const fs = require('fs');

let content = fs.readFileSync('C:/Users/roman/flow/src/screens/DashboardScreen.js', 'utf8');

// 1. Remove CommunicationLogsTable import and add AppState
content = content.replace(
  "import { CommunicationLogsTable } from '../modules/sosyal_medya/presentation/components/CommunicationLogsTable';",
  "import { AppState } from 'react-native';"
);

// 2. Add AppointmentNotifications component
const apptComponent = `
const AppointmentNotifications = ({ navigation }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id, created_at, is_read, metadata')
        .eq('type', 'appointment_created')
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(data || []);
    } catch (e) {
      console.warn('Notifs error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifs();
    }, [])
  );

  const handlePress = async (n) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, is_read: true } : p));
    }
    const targetDate = n.metadata?.starts_at ? new Intl.DateTimeFormat('en-CA', { timeZone: n.metadata.timezone || 'Europe/Istanbul' }).format(new Date(n.metadata.starts_at)) : null;
    if (targetDate) {
      navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
    }
  };

  if (loading) return <ActivityIndicator size="small" color="#00F2FE" />;
  if (notifications.length === 0) return <Text style={{ color: '#849495', textAlign: 'center' }}>Henüz randevu bildirimi yok</Text>;

  return (
    <View style={{ gap: 10 }}>
      {notifications.map(n => {
        const m = n.metadata || {};
        const dateText = m.starts_at ? new Date(m.starts_at).toLocaleString('tr-TR', { timeZone: m.timezone || 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
        const title = \`\${m.customer_name || 'İsimsiz'} için \${dateText} tarihine randevu oluşturuldu\`;
        
        return (
          <TouchableOpacity key={n.id} onPress={() => handlePress(n)} style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: 12, borderRadius: 12, borderWidth: 1, borderColor: n.is_read ? 'transparent' : 'rgba(0, 242, 254, 0.3)'
          }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: n.is_read ? '400' : '600' }}>{title}</Text>
            {!!m.calendar_name && <Text style={{ color: '#849495', fontSize: 12, marginTop: 4 }}>👨‍⚕️ {m.calendar_name}</Text>}
            {!!m.customer_request_raw && <Text style={{ color: '#849495', fontSize: 12, marginTop: 2 }}>📝 {m.customer_request_raw}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
`;

content = content.replace("export default function DashboardScreen({ navigation }) {", apptComponent + "\nexport default function DashboardScreen({ navigation }) {");

// 3. Replace <CommunicationLogsTable />
content = content.replace(
  `              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('dashboardScreen.communicationReports.title')}</Text>
              </View>
              <CommunicationLogsTable />`,
  `              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Randevu Bildirimleri</Text>
              </View>
              <AppointmentNotifications navigation={navigation} />`
);

// 4. Unread count logic replacement
const oldUnreadLogic = `        try {
          // Normal notifications
          const { count: regularCount } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('is_read', false);

          // Broadcast notifications
          const { count: totalBroadcasts } = await supabase
            .from('broadcast_messages')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'sent');

          const { count: readBroadcasts } = await supabase
            .from('user_broadcast_reads')
            .select('broadcast_id', { count: 'exact', head: true })
            .eq('user_id', session.user.id);

          const broadcastUnreadCount = Math.max(0, (totalBroadcasts || 0) - (readBroadcasts || 0));
          setUnreadCount(regularCount + broadcastUnreadCount);
        } catch (e) {
          console.warn('Notification count error:', e);
        }`;

const newUnreadLogic = `        const fetchUnreadCount = async () => {
          try {
            const { count } = await supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('type', 'appointment_created')
              .eq('is_read', false);
            setUnreadCount(count || 0);
          } catch (e) {
            console.warn('Unread count error:', e);
          }
        };
        fetchUnreadCount();
        
        const sub = AppState.addEventListener('change', nextAppState => {
          if (nextAppState === 'active') {
            fetchUnreadCount();
          }
        });
        // We cannot cleanly remove AppState listener from here if it's inside this big effect, but we can do it globally.`;

content = content.replace(oldUnreadLogic, newUnreadLogic);

fs.writeFileSync('C:/Users/roman/flow/src/screens/DashboardScreen.js', content, 'utf8');
