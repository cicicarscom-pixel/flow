
> const AppointmentNotifications = ({ navigation, onRead }) => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
  
    const fetchNotifs = async () => {
      try {
        setErrorMsg(null);
        const { data, error } = await supabase
          .from('notifications')
          .select('id, created_at, is_read, metadata')
          .eq('type', 'appointment_created')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setNotifications(data || []);
      } catch (e) {
        console.warn('Notifs error', e);
        setErrorMsg('Bildirimler yüklenemedi');
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
        if (onRead) onRead();
      }
      const targetDate = n.metadata?.starts_at ? new Intl.DateTimeFormat('en-CA', { timeZone: n.metadata.timezone || 'Europe/Istanbul' }).format(new Date(n.metadata.starts_at)) : null;
      if (targetDate) {
        navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
      }
    };
  
    if (loading) return <ActivityIndicator size="small" color="#00F2FE" />;
    if (errorMsg) return <Text style={{ color: '#FF4D4D', textAlign: 'center' }}>{errorMsg}</Text>;
    if (notifications.length === 0) return <Text style={{ color: '#849495', textAlign: 'center' }}>Henüz randevu bildirimi yok</Text>;

