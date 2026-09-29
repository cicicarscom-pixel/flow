
>     return () => { if (loop) loop.stop(); };
    }, [active, pulse]);
  
    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  
>   return (
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    );
  };
  const BAR_IMAGES = [
    require('../../image/bar_image/bar1.jpg'),
    require('../../image/bar_image/bar2.jpg'),
    require('../../image/bar_image/bar3.jpg'),
    require('../../image/bar_image/bar4.jpg'),
    require('../../image/bar_image/bar5.jpg'),
    require('../../image/bar_image/bar6.jpg'),
    require('../../image/bar_image/bar7.jpg'),
    require('../../image/bar_image/bar8.jpg'),
    require('../../image/bar_image/bar9.jpg'),
    require('../../image/bar_image/bar10.jpg'),
    require('../../image/bar_image/bar11.jpg'),
    require('../../image/bar_image/bar12.jpg'),
    require('../../image/bar_image/bar14.jpg'),
  ];
  const { width: screenWidth } = Dimensions.get('window');
  const innerWidth = screenWidth - 2; // Compensate for left/right borders (1px each)
  
  
  const AppointmentNotifications = ({ navigation, onRead }) => {
>   return (
      <View style={{ gap: 10 }}>
        {notifications.map(n => {
          const m = n.metadata || {};
          const dateText = m.starts_at ? new Date(m.starts_at).toLocaleString('tr-TR', { timeZone: m.timezone || 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
          const title = `${m.customer_name || 'İsimsiz'} için ${dateText} tarihine randevu oluşturuldu`;
          
>         return (
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
  
  export default function DashboardScreen({ navigation }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
  
    const { showActionSheetWithOptions } = useActionSheet();
    const [showHint, setShowHint] = useState(false);
    const [hintAnim] = useState(() => new Animated.Value(0));
  
    const [isLoading, setIsLoading] = useState(true);
    const [aiActive, setAiActive] = useState(true);
>       return () => sub.remove();
      }, []);
    
      useFocusEffect(
        React.useCallback(() => {
          let organizationId = null;
          const loadCounts = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { data: orgData } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', session.user.id)
                .limit(1);
              
              organizationId = orgData?.[0]?.organization_id;
              if (organizationId) {
                fetchAppointments(organizationId);
                fetchSocialStats(organizationId);
                fetchUnreadNotifications(organizationId);
              } else {
                fetchUnreadNotifications(null);
              }
            }
          };
          loadCounts();
>         return () => {
            if (notifChannel) supabase.removeChannel(notifChannel);
            if (broadcastChannel) supabase.removeChannel(broadcastChannel);
          };
        }, [])
      );
  
    useFocusEffect(
      React.useCallback(() => {
        const fetchData = async () => {
        try {
          // 1. Auth & Profile
          const { data: { session } } = await supabase.auth.getSession();
          let merchantId = null;
          if (session) {
            const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).limit(1);
            merchantId = orgMember?.[0]?.organization_id || session.user.id;
            const meta = session.user.user_metadata || {};
  
            // Fetch profile for avatar
            const { data: profileDataArr } = await supabase
              .from('profiles')
              .select('business_name, authorized_person, avatar_url, hero_image_url')
              .eq('id', session.user.id)
              .limit(1);
            const profileData = profileDataArr?.[0];
>   return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
  
            {/* HERO SHADOW WRAPPER */}
            <View style={{
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              borderBottomWidth: 1.5,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: 'rgba(0, 162, 255, 0.6)',
              shadowColor: '#00a2ff',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.6,
              shadowRadius: 20,
              elevation: 15,
              backgroundColor: '#131315',
              marginBottom: 20,
            }}>
              {/* HERO: cesur renk bloğu - profil, bildirim ve AI durumu tek odakta */}
              <View style={[styles.hero, { overflow: 'hidden', marginBottom: 0 }]}>
>                   return (
                      <CustomGlassCard key={payment.id || index} style={styles.paymentCard}>
                        <View style={styles.paymentDateRow}>
                          <MaterialIcons name="event" size={16} color={pColor} />
                          <Text style={[styles.paymentDateText, { color: pColor }]}>{formatDayMonth(payment.date, t).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.paymentTitle} numberOfLines={1}>{payment.description || t('dashboardScreen.upcomingPayments.defaultTitle')}</Text>
                        <View style={styles.paymentBottomRow}>
                          <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)} <Text style={styles.paymentCurrency}>TL</Text></Text>
                          <TouchableOpacity style={styles.paymentMoreBtn}>
                            <MaterialIcons name="more-horiz" size={18} color={COLORS.onSurfaceVariant} />
                          </TouchableOpacity>
                        </View>
                      </CustomGlassCard>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>{t('dashboardScreen.upcomingPayments.empty')}</Text>
              )}
  
              {/* İletişim Raporları */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('dashboardScreen.communicationReports.title')}</Text>
              </View>
              <AppointmentNotifications navigation={navigation} onRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />

