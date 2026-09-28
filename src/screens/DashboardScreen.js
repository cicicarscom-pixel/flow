import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ImageBackground,
  StyleSheet, 
  Switch,
  Animated,
  Dimensions, Platform, TouchableWithoutFeedback, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import CustomButton from '../shared/ui/CustomButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { AppState } from 'react-native';
import { todayInTimezone, addDaysYmd } from '../lib/dates';
import { appointmentSentence } from '../lib/appointmentSentence';
import { supabase } from '../shared/lib/supabase';
import { container } from '../core/container';
import { AppointmentStatus } from '../modules/randevu/domain/enums/AppointmentStatus';
import { extractTime } from '../modules/randevu/presentation/hooks/useAppointments';
import { Ionicons } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';

const PLATFORM_ICONS = {
  WHATSAPP: { name: 'logo-whatsapp', color: '#25D366' },
  INSTAGRAM: { name: 'logo-instagram', color: '#E8A8CD' },
  FACEBOOK: { name: 'logo-facebook', color: '#FF7A59' },
  YOUTUBE: { name: 'logo-youtube', color: '#ff0000' },
  LINKEDIN: { name: 'logo-linkedin', color: '#0077b5' },
  TIKTOK: { name: 'logo-tiktok', color: '#69C9D0' },
};

// Not: Bu değerler artık src/core/theme/designSystem.js içindeki merkezi
// palet ile uyumludur (aynı marka renkleri, daha profesyonel/dengeli tonlar).
const COLORS = {
  background: '#17151A',
  surface: '#201D24',
  surfaceContainer: '#2A2631',
  surfaceContainerHigh: '#34303C',
  surfaceContainerHighest: '#262B38',
  onSurface: '#F6F1EC',
  onSurfaceVariant: '#A79E96',
  primary: '#22B573',
  primaryContainer: '#38BDF8',
  primaryFixed: '#67E8F9',
  primaryFixedDim: '#22B573',
  secondary: '#C084FC',
  secondaryFixed: '#E9D5FF',
  tertiary: '#4ADE80',
  tertiaryContainer: '#22B573',
  tertiaryFixed: '#86EFAC',
  error: '#FCA5A5',
};

// --- Utilities ---
const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,218,243';
};

const formatRelativeTime = (dateStr, t) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t('dashboardScreen.time.minutesAgo', { count: Math.max(1, mins) });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('dashboardScreen.time.hoursAgo', { count: hrs });
  return t('dashboardScreen.time.daysAgo', { count: Math.floor(hrs / 24) });
};

const formatDayMonth = (dateStr, t) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = [
    t('dashboardScreen.months.jan'), t('dashboardScreen.months.feb'), t('dashboardScreen.months.mar'),
    t('dashboardScreen.months.apr'), t('dashboardScreen.months.may'), t('dashboardScreen.months.jun'),
    t('dashboardScreen.months.jul'), t('dashboardScreen.months.aug'), t('dashboardScreen.months.sep'),
    t('dashboardScreen.months.oct'), t('dashboardScreen.months.nov'), t('dashboardScreen.months.dec')
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const formatCurrency = (amount) => { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount); };

// --- Subcomponents ---

const GlowingText = ({ children, style, color = COLORS.primary }) => (
  <Text style={[style, { textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
    {children}
  </Text>
);

const CustomGlassCard = ({ children, style, glowColor }) => (
  <View style={[
    styles.glassCard,
    glowColor ? {
      borderColor: `rgba(${hexToRgb(glowColor)}, 0.3)`,
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    } : null,
    style
  ]}>
    {children}
  </View>
);

const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
  const [animValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [animValue]);

  const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });

  return (
    <Animated.View style={[{ width, height, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius, opacity }, style]} />
  );
};

// "Asistan çalışıyor" hissi: ikon rozetinin arkasında yavaşça büyüyüp küçülen
// bir nefes alma animasyonu — sadece görsel, aiActive durumuna dokunmaz.
const BreathingIcon = ({ active, children }) => {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => { if (loop) loop.stop(); };
  }, [active, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
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
  const { t, i18n } = useTranslation();
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

  return (
    <View style={{ gap: 10 }}>
      {notifications.map(n => {
        const m = n.metadata || {};
        const lang = i18n.language?.startsWith('en') ? 'en' : (i18n.language?.startsWith('de') ? 'de' : 'tr');
        const localeStr = lang === 'en' ? 'en-US' : (lang === 'de' ? 'de-DE' : 'tr-TR');
        const dateText = m.starts_at ? new Date(m.starts_at).toLocaleString(localeStr, { timeZone: m.timezone || 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
        const name = m.customer_name || t('dashboardScreen.appointmentNotifications.unknownCustomer');
        
        let title = '';
        if (lang === 'tr') {
            title = appointmentSentence(name, dateText, m.calendar_name);
        } else {
            title = m.calendar_name
              ? t('dashboardScreen.appointmentNotifications.sentenceWithResource', { name, when: dateText, resource: m.calendar_name })
              : t('dashboardScreen.appointmentNotifications.sentence', { name, when: dateText });
        }
        
        return (
          <TouchableOpacity key={n.id} onPress={() => handlePress(n)} style={{
            backgroundColor: n.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(34, 181, 115, 0.1)',
            padding: 12, borderRadius: 12, borderWidth: 1, 
            borderColor: n.is_read ? 'transparent' : '#22B573',
            borderLeftWidth: n.is_read ? 1 : 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22B573', marginRight: 8, marginTop: 4 }} />}
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: n.is_read ? '400' : 'bold', flex: 1 }}>{title}</Text>
            </View>
            {!!m.calendar_name && (
              <View style={{ backgroundColor: 'rgba(34,181,115,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: 'flex-start', marginTop: 6, marginLeft: n.is_read ? 0 : 16 }}>
                <Text style={{ color: '#22B573', fontSize: 11, fontWeight: '500' }}>{m.calendar_name}</Text>
              </View>
            )}
            {!!m.customer_request_raw && <Text style={{ color: '#849495', fontSize: 12, marginTop: 2, marginLeft: n.is_read ? 0 : 16 }}>📝 {m.customer_request_raw}</Text>}
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
  const [userProfile, setUserProfile] = useState({ fullName: '', avatarUrl: null, heroImageUrl: null });
  const [financeStats, setFinanceStats] = useState({ income: 0, expense: 0 });
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [socialStats, setSocialStats] = useState({ followers: 0, trend: 0 });
  const [latestInvoice, setLatestInvoice] = useState(null);
  const [hasSocialAccounts, setHasSocialAccounts] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Sadece görsel: ekran girişinde içerik yumuşakça belirir ---
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Check for tooltip hint
    AsyncStorage.getItem('hasSeenCoverHint').then(val => {
      if (!val) {
        setShowHint(true);
        Animated.sequence([
          Animated.timing(hintAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.delay(3000),
          Animated.timing(hintAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ]).start(() => {
          setShowHint(false);
          AsyncStorage.setItem('hasSeenCoverHint', 'true');
        });
      }
    });
  }, [fadeAnim, slideAnim, hintAnim]);

    const fetchUnreadNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'appointment_created')
          .eq('is_read', false);
        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (e) {
        console.warn('Unread count error:', e);
      }
    };

    // Uygulama öne gelince okunmamış sayısını yenile (tek dinleyici, ekrandan çıkınca kaldırılır)
    useEffect(() => {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') fetchUnreadNotifications();
      });
      return () => sub.remove();
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
              
              
              fetchUnreadNotifications(organizationId);
            } else {
              fetchUnreadNotifications(null);
            }
          }
        };
        loadCounts();
        
        let notifChannel;
        let broadcastChannel;

        notifChannel = supabase.channel('mobile_dashboard_notifs')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
            fetchUnreadNotifications(organizationId);
          }).subscribe();

        broadcastChannel = supabase.channel('mobile_dashboard_broadcasts')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' }, () => {
            fetchUnreadNotifications(organizationId);
          }).subscribe();

        return () => {
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

          const nameToUse = profileData?.authorized_person || profileData?.business_name || meta.full_name || t('dashboardScreen.greeting.defaultName');
          setUserProfile({
            fullName: nameToUse,
            avatarUrl: profileData?.avatar_url || meta.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToUse)}&background=00daf3&color=fff`,
            heroImageUrl: profileData?.hero_image_url || null
          });

          // Bot Status
          // NOT: bot_settings ham auth kullanıcı ID'si (merchant_id) ile anahtarlanır —
          // organizasyon fallback'i YOK (RLS: auth.uid() = merchant_id). Web (page.tsx) ve
          // SosyalMedyaScreen.js ile aynı davranış için burada organizasyon-çözümlü
          // merchantId DEĞİL, ham session.user.id kullanılmalı.
          const { data: botDataArr } = await supabase
            .from('bot_settings')
            .select('is_active')
            .eq('merchant_id', session.user.id)
            .limit(1);
          const botData = botDataArr?.[0];
          if (botData) setAiActive(botData.is_active);
        }

        // 2. Finance Stats (RPC get_finance_summary)
        let tz = 'Europe/Istanbul';
        let orgId = null;
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).limit(1);
          orgId = orgMember?.[0]?.organization_id;
        }

        if (orgId) {
          const { data: orgData } = await supabase.from('organizations').select('timezone').eq('id', orgId).single();
          if (orgData?.timezone) tz = orgData.timezone;
        }

        const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
        const dateObj = new Date(today);
        const p_from = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split("T")[0];
        const p_to = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split("T")[0];

        const { data: summaryData } = await supabase.rpc('get_finance_summary', { p_from, p_to });
        if (summaryData && summaryData.status === 'SUCCESS') {
          setFinanceStats({ income: summaryData.income / 100, expense: summaryData.expense / 100 });
        } else {
          setFinanceStats({ income: 0, expense: 0 });
        }

        const futureDateObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 30);
        const p_future = futureDateObj.toISOString().split("T")[0];
        const { data: calendarData } = await supabase.rpc('get_payment_calendar', { p_from: today, p_to: p_future });
        
        let upcoming = [];
        if (calendarData) {
          upcoming = calendarData
            .filter(d => d.type === 'expense' && d.payment_status !== 'paid')
            .slice(0, 5)
            .map(d => ({
              id: d.id,
              date: d.day,
              amount: d.amount_minor / 100,
              description: d.title || t('dashboardScreen.upcomingPayments.defaultTitle'),
              type: 'expense'
            }));
        }
        setUpcomingPayments(upcoming);

        if (orgId) {
          const { data: latestDoc } = await supabase.from('finance_documents')
            .select('*')
            .eq('organization_id', orgId)
            .is('archived_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          setLatestInvoice(latestDoc);
        }

        // 3. Social Stats (Zernio)
        const { data: followRes } = await supabase.functions.invoke('zernio-client', {
          body: { action: 'get-follower-stats', payload: {} }
        });
        
        let totalFollowers = 0;
        let totalTrend = 0;
        let accountsWithTrend = 0;

        const actualFollow = followRes?.data?.data?.data || followRes?.data?.data || {};
        if (actualFollow.accounts) {
           totalFollowers = actualFollow.accounts.reduce((sum, a) => sum + (a.currentFollowers || a.followers || 0), 0);
           actualFollow.accounts.forEach(a => {
              const t = a.followerGrowthPercentage || a.growthPercentage || a.trend || a.growth || 0;
              if (t > 0 || t < 0) {
                 totalTrend += t;
                 accountsWithTrend++;
              }
           });
        }
        
        const finalTrend = accountsWithTrend > 0 
           ? Number((totalTrend / accountsWithTrend).toFixed(1)) 
           : (actualFollow.trend || actualFollow.growthPercentage || actualFollow.totalGrowth || 0);

        setSocialStats(prev => ({ ...prev, followers: totalFollowers, trend: finalTrend }));
          const hasAccounts = Array.isArray(actualFollow.accounts) && actualFollow.accounts.length > 0;
          setHasSocialAccounts(hasAccounts);


        // 4. Recent Activities (Messages & Comments)
        const [{ data: msgs }, { data: comments }] = await Promise.all([
          supabase.from('messages').select('*, conversations(participant_name, participant_picture, platform)').order('created_at', { ascending: false }).limit(5),
          supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        
        let merged = [];
        if (msgs) {
          merged = [...merged, ...msgs.map(m => {
            const conv = m.conversations || {};
            const displayName = conv.participant_name || t('dashboardScreen.recentActivity.customerFallback');
            return {
              id: 'msg_'+m.id,
              type: t('dashboardScreen.recentActivity.types.message'),
              platform: (conv.platform || 'whatsapp').toUpperCase(),
              name: displayName,
              message: m.content || '',
              date: m.created_at,
              avatar: conv.participant_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00daf3&color=fff`,
              color: COLORS.primaryFixedDim
            };
          })];
        }
        if (comments) {
          merged = [...merged, ...comments.map(c => ({
            id: 'cmt_'+c.id,
            type: t('dashboardScreen.recentActivity.types.comment'),
            platform: (c.platform || 'INSTAGRAM').toUpperCase(),
            name: c.username || t('dashboardScreen.recentActivity.userFallback'),
            message: c.text || c.content || '',
            date: c.created_at,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || 'K')}&background=ecb2ff&color=fff`,
            color: COLORS.secondaryFixed
          }))];
        }
        
        merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentActivities(merged.slice(0, 3));

        // 5. Yaklaşan Randevu / Rezervasyonlar (gerçek veri — Randevu modülü repository'si üzerinden)
          try {
            const appointmentRepo = container.resolve('AppointmentRepository');
            // Fetch more to ensure we have enough for upcoming after filtering today
            const upcomingRaw = await appointmentRepo.getUpcomingAppointments(20);

              
 
            const statusColor = {
              [AppointmentStatus.Approved]: COLORS.tertiary,
              [AppointmentStatus.Pending]: COLORS.secondary,
            };
            
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
            
            const todayList = [];
            const upcomingList = [];
            
            for (const appt of upcomingRaw) {
               const apptDate = new Date(appt.date);
               const apptDateStr = apptDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
               
               const serviceName = appt.services && appt.services.length > 0 ? appt.services.join(' + ') : '';
               const customerName = appt.customerName || t('dashboardScreen.appointments.unnamedCustomer', 'İsimsiz müşteri');
               const note = appt.customerRequestRaw || '';
               const doc = appt.calendarName || '';
               
               const formatted = {
                  id: appt.id,
                  time: extractTime(appt.date),
                  dateText: appt.date,
                  customerName,
                  serviceName,
                  note,
                  calendarName: doc,
                  color: statusColor[appt.status] || COLORS.tertiary,
               };
               
               if (apptDateStr === todayStr) {
                  todayList.push(formatted);
               } else if (apptDateStr > todayStr && upcomingList.length < 7) {
                  upcomingList.push(formatted);
               }
            }
            
            setTodayAppointments(todayList);
            setAppointments(upcomingList);
          } catch (apptError) {
          console.warn('Upcoming appointments fetch error:', apptError);
          setAppointments([]);
        }
      } catch (error) {
        console.warn('Dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    }, [])
  );

  const handleHeroImageChange = () => {
    showActionSheetWithOptions(
      {
        options: ['Galeriden Seç', 'Varsayılana Dön', 'İptal'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          // Galeriden Seç
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const oldHeroImageUrl = userProfile.heroImageUrl;

            try {
              // Optimistic UI update
              setUserProfile(prev => ({ ...prev, heroImageUrl: asset.uri }));
              
              // Kaydırmayı en başa al (kullanıcının eklediği resim ilk sırada çıkıyor)
              setTimeout(() => {
                scrollRef.current?.scrollTo({ x: 0, animated: true });
              }, 100);

              // 1. Optimize image (Compress & Resize) and get base64
              const manipResult = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
              );

              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const fileName = `${session.user.id}/hero.jpg`;

                // 2. Upload to Supabase Storage (upsert) using base64 arraybuffer
                const { error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(fileName, decode(manipResult.base64), { contentType: 'image/jpeg', upsert: true });

                if (uploadError) throw uploadError;

                // 4. Get public URL and apply cache-busting
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                const finalUrl = `${publicUrl}?t=${Date.now()}`;

                // 5. Update profiles table
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ hero_image_url: finalUrl })
                  .eq('id', session.user.id);

                if (updateError) throw updateError;

                // 6. Confirm optimistic update with final URL
                setUserProfile(prev => ({ ...prev, heroImageUrl: finalUrl }));
              }
            } catch (e) {
              console.warn("Hero image upload failed:", e);
              // Rollback
              setUserProfile(prev => ({ ...prev, heroImageUrl: oldHeroImageUrl }));
              Alert.alert("Hata", "Kapak resmi yüklenemedi. Lütfen tekrar deneyin.");
            }
          }
        } else if (buttonIndex === 1) {
          // Varsayılana Dön
          const oldHeroImageUrl = userProfile.heroImageUrl;
          try {
            setUserProfile(prev => ({ ...prev, heroImageUrl: null }));
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { error } = await supabase
                .from('profiles')
                .update({ hero_image_url: null })
                .eq('id', session.user.id);
              if (error) throw error;
              
              // Optional: Delete from storage
              const fileName = `${session.user.id}/hero.jpg`;
              await supabase.storage.from('avatars').remove([fileName]);
            }
          } catch (e) {
            console.warn("Hero image reset failed:", e);
            setUserProfile(prev => ({ ...prev, heroImageUrl: oldHeroImageUrl }));
            Alert.alert("Hata", "Varsayılana dönerken bir hata oluştu.");
          }
        }
      }
    );
  };

  const handleToggleAiActive = async (val) => {
    setAiActive(val);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // bot_settings ham merchant_id (session.user.id) ile anahtarlanır, organizasyon
        // fallback'i YOK — bkz. fetchData() içindeki Bot Status okuma notu.
        await supabase
          .from('bot_settings')
          .update({ is_active: val })
          .eq('merchant_id', session.user.id);
      }
    } catch (e) {
      console.warn('Could not save bot status', e);
    }
  };

  const tabBarHeight = 80;

  const scrollRef = useRef(null);
  useEffect(() => {
    const hour = new Date().getHours();
    let initialIndex = 0; // Sabah (06-12) -> bar1
    if (hour >= 12 && hour < 18) initialIndex = 1; // Öğlen (12-18) -> bar2
    else if (hour >= 18 && hour < 22) initialIndex = 2; // Akşam (18-22) -> bar3
    else if (hour >= 22 || hour < 6) initialIndex = 3; // Gece (22-06) -> bar4
    
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ x: innerWidth * initialIndex, animated: false });
      }
    }, 150);
  }, []);

  return (
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
            <TouchableWithoutFeedback onLongPress={handleHeroImageChange}>
              <View style={StyleSheet.absoluteFill}>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                >
                  {(userProfile.heroImageUrl ? [{ id: 'custom', uri: userProfile.heroImageUrl, isUserImage: true }, ...BAR_IMAGES] : BAR_IMAGES).map((img, idx) => (
                    <Image key={idx} source={img.isUserImage ? { uri: img.uri } : img} style={{ width: innerWidth, height: '100%', resizeMode: 'cover' }} />
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
            
            {showHint && (
              <Animated.View style={{
                position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', opacity: hintAnim, zIndex: 99
              }} pointerEvents="none">
                <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Kendi resmini eklemek için basılı tut</Text>
                </View>
              </Animated.View>
            )}

            <View style={[styles.heroTopRow, { paddingTop: Math.max(insets.top, 16) }]}>
              <TouchableOpacity
                style={styles.heroAvatarOuter}
                onPress={() => navigation.navigate('Profil')}
              >
                <View style={styles.heroAvatarHalo} />
                <View style={styles.heroAvatarWrapper}>
                  {isLoading ? (
                    <Skeleton width="100%" height="100%" borderRadius={22} />
                  ) : (
                    <Image
                      source={{ uri: userProfile.avatarUrl || 'https://ui-avatars.com/api/?name=Kullanici' }}
                      style={styles.heroAvatarImage}
                    />
                  )}
                </View>
                {!isLoading && <View style={styles.onlineDot} />}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={[styles.heroIconBtn, { marginRight: 8, backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={handleHeroImageChange}>
                  <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Inbox', { screen: 'Bildirimler' })}>
                  <MaterialIcons name="notifications" size={20} color={COLORS.background} />
                  {unreadCount > 0 && <View style={styles.notificationBadge} />}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.heroGreeting}>{t('dashboardScreen.greeting.hello')}</Text>
            {isLoading ? (
              <Skeleton width={140} height={26} style={{ marginTop: 6, marginBottom: 18 }} />
            ) : (
              <Text style={styles.heroName}>{userProfile.fullName}</Text>
            )}

            {/* AI Asistan durumu — hero'nun içine gömülü tek odak kartı */}
            <View style={styles.heroAiCard}>
              <BreathingIcon active={aiActive && !isLoading}>
                <View style={styles.heroAiIconWrapper}>
                  {isFocused && (
                    <Image
                      source={require('../../image/robot1.gif')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  )}
                </View>
              </BreathingIcon>
              <View style={styles.heroAiTexts}>
                {isLoading ? (
                  <>
                    <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width={160} height={11} />
                  </>
                ) : (
                  <>
                    <Text style={styles.heroAiTitle}>{aiActive ? t('dashboardScreen.ai.activeTitle') : t('dashboardScreen.ai.inactiveTitle')}</Text>
                    <Text style={styles.heroAiSubtitle}>{aiActive ? t('dashboardScreen.ai.activeSubtitle') : t('dashboardScreen.ai.inactiveSubtitle')}</Text>
                  </>
                )}
              </View>
              {!isLoading && (
                <Switch
                  value={aiActive}
                  onValueChange={handleToggleAiActive}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(56, 189, 248, 0.35)' }}
                  thumbColor={aiActive ? '#38BDF8' : '#fff'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              )}
            </View>
          </View>
          </View>

          <View style={styles.body}>
            {/* Bugünkü Randevu/Rezervasyonlar — dikey liste */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.appointments.todayTitle', 'Bugünkü Randevular')}</Text>
            </View>
            {isLoading ? (
              <View style={styles.apptList}><Skeleton width="100%" height={44} borderRadius={14} /><Skeleton width="100%" height={44} borderRadius={14} /></View>
            ) : todayAppointments.length > 0 ? (
              <View style={styles.apptList}>
                {todayAppointments.map(a => {
                  const targetDate = a.dateText ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(a.dateText)) : null;
                  return (
                    <TouchableOpacity key={a.id} style={styles.apptListRow} onPress={() => {
                      if (targetDate) navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
                    }}>
                      <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                      <Text style={styles.apptListTime}>{a.time}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.apptListTitle} numberOfLines={1}>{a.customerName}</Text>
                        {(a.calendarName || a.serviceName || a.note) ? (
                           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                             {a.calendarName ? <View style={{ backgroundColor: 'rgba(34,181,115,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}><Text style={{ color: '#22B573', fontSize: 11, fontWeight: '500' }}>{a.calendarName}</Text></View> : null}
                             {a.serviceName ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11 }}>🏷️ {a.serviceName}</Text> : null}
                             {a.note ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12 }}>📝 {a.note}</Text> : null}
                           </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                )})}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('dashboardScreen.appointments.todayEmpty', 'Bugün için planlı randevu yok.')}</Text>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.appointments.upcomingTitle', 'Yaklaşan Randevular')}</Text>
            </View>
            {isLoading ? (
              <View style={styles.apptList}><Skeleton width="100%" height={44} borderRadius={14} /><Skeleton width="100%" height={44} borderRadius={14} /></View>
            ) : appointments.length > 0 ? (
              <View style={styles.apptList}>
                {appointments.map(a => {
                  const targetDate = a.dateText ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(a.dateText)) : null;
                  const displayTime = (new Date(a.dateText).getDate() === new Date().getDate() ? '' : new Date(a.dateText).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + a.time;
                  return (
                    <TouchableOpacity key={a.id} style={styles.apptListRow} onPress={() => {
                      if (targetDate) navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
                    }}>
                      <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                      <Text style={[styles.apptListTime, { width: 55, textAlign: 'right' }]}>{displayTime}</Text>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.apptListTitle} numberOfLines={1}>{a.customerName}</Text>
                        {(a.calendarName || a.serviceName || a.note) ? (
                           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                             {a.calendarName ? <View style={{ backgroundColor: 'rgba(34,181,115,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}><Text style={{ color: '#22B573', fontSize: 11, fontWeight: '500' }}>{a.calendarName}</Text></View> : null}
                             {a.serviceName ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11 }}>🏷️ {a.serviceName}</Text> : null}
                             {a.note ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12 }}>📝 {a.note}</Text> : null}
                           </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                )})}
                {totalAppointments > appointments.length && (
                  <TouchableOpacity onPress={() => navigation.navigate('Ai Asistan', { screen: 'RandevuMain' })} style={{ marginTop: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#00F2FE', fontSize: 13, fontWeight: '500' }}>{t('dashboardScreen.appointments.viewAll', 'Tümünü gör')} ({totalAppointments})</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('dashboardScreen.appointments.empty', 'Yaklaşan randevu veya rezervasyon bulunmuyor.')}</Text>
            )}


            {/* Gelir / Gider */}
            <View style={styles.financeGrid}>
              <CustomGlassCard style={styles.financeCard}>
                <View style={styles.financeHeaderRow}>
                  <View style={[styles.financeBadge, { backgroundColor: 'rgba(34, 181, 115, 0.12)', borderColor: 'rgba(34, 181, 115, 0.25)' }]}>
                    <Text style={[styles.financeBadgeText, { color: COLORS.tertiaryFixed }]}>{t('dashboardScreen.finance.income')}</Text>
                  </View>
                  <MaterialIcons name="trending-up" size={18} color={COLORS.tertiary} />
                </View>
                {isLoading ? (
                  <Skeleton width="80%" height={26} style={{ marginBottom: 12 }} />
                ) : (
                  <Text style={styles.financeValueText}>{formatCurrency(financeStats.income)} </Text>
                )}

              </CustomGlassCard>

              <CustomGlassCard style={styles.financeCard}>
                <View style={styles.financeHeaderRow}>
                  <View style={[styles.financeBadge, { backgroundColor: 'rgba(255, 180, 171, 0.1)', borderColor: 'rgba(255, 180, 171, 0.2)' }]}>
                    <Text style={[styles.financeBadgeText, { color: COLORS.error }]}>{t('dashboardScreen.finance.expense')}</Text>
                  </View>
                  <MaterialIcons name="trending-down" size={18} color={COLORS.error} />
                </View>
                {isLoading ? (
                  <Skeleton width="80%" height={26} style={{ marginBottom: 12 }} />
                ) : (
                  <Text style={styles.financeValueText}>{formatCurrency(financeStats.expense)} </Text>
                )}

              </CustomGlassCard>
            </View>

            {/* Fatura Tarayıcı */}
            <CustomGlassCard style={styles.invoiceCard} glowColor="#F59E0B">
              <Text style={styles.sectionTitle}>{t('dashboardScreen.invoiceScanner.header')}</Text>
              {latestInvoice ? (
                <View style={styles.invoiceContentRow}>
                  <View style={[styles.invoiceImageWrapper, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.05)' }]}>
                    {latestInvoice.image_url ? (
                      <Image
                        source={{ uri: latestInvoice.image_url }}
                        style={styles.invoiceImage}
                      />
                    ) : (
                      <Ionicons name="document-text-outline" size={32} color="rgba(245,158,11,0.6)" />
                    )}
                  </View>
                  <View style={styles.invoiceDetails}>
                    <View style={styles.invoiceDetailRow}>
                      <Text style={styles.invoiceDetailLabel}>{t('dashboardScreen.invoiceScanner.supplier')}</Text>
                      <Text style={styles.invoiceDetailValue}>{latestInvoice.counterparty_name || latestInvoice.title || "-"}</Text>
                    </View>
                    <View style={styles.invoiceDetailRow}>
                      <Text style={styles.invoiceDetailLabel}>{t('dashboardScreen.invoiceScanner.date')}</Text>
                      <Text style={styles.invoiceDetailValue}>{latestInvoice.due_date || latestInvoice.created_at ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(latestInvoice.due_date || latestInvoice.created_at)) : "-"}</Text>
                    </View>
                    {latestInvoice.tax_details && latestInvoice.tax_details.rate != null && (
                      <View style={styles.invoiceDetailRow}>
                        <Text style={styles.invoiceDetailLabel}>{t('dashboardScreen.invoiceScanner.vat')}</Text>
                        <Text style={styles.invoiceDetailValue}>%{latestInvoice.tax_details.rate}</Text>
                      </View>
                    )}
                    <View style={styles.invoiceDetailRow}>
                      <Text style={styles.invoiceDetailLabel}>{t('dashboardScreen.invoiceScanner.total')}</Text>
                      <Text style={styles.invoiceDetailValue}>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: latestInvoice.currency_code || 'TRY' }).format(Number(latestInvoice.amount_minor)/100)}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 13 }}>{t('dashboardScreen.invoiceScanner.noInvoice')}</Text>
                </View>
              )}
              <CustomButton
                title={t('dashboardScreen.invoiceScanner.scanButton')}
                onPress={() => navigation.navigate('Muhasebe', { screen: 'VeriGirisi' })}
                style={{ marginTop: 14, backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.25)', borderWidth: 1, borderRadius: 12 }}
                textStyle={{ color: '#F59E0B', fontSize: 13, fontWeight: '700' }}
              />
            </CustomGlassCard>

            {/* Tüm Hesaplar — sosyal özet */}
            <CustomGlassCard style={styles.socialCard} glowColor="#A5B4FC">
              <View style={[styles.socialHeader, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={styles.sectionTitle}>{t('dashboardScreen.social.allAccounts')}</Text>
                {hasSocialAccounts && (
                  <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#22C55E', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{t('dashboardScreen.social.liveAnalysis')}</Text>
                  </View>
                )}
              </View>

              {hasSocialAccounts ? (
                <View style={[styles.socialMainRow, { marginTop: 12, flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <MaterialIcons name="people" size={20} color="#A5B4FC" />
                  </View>
                  <View style={styles.socialStatsWrapper}>
                    {isLoading ? (
                      <Skeleton width={70} height={26} />
                    ) : (
                      <>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.onBackground }}>{socialStats.followers.toLocaleString('tr-TR')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {socialStats.trend > 0 ? (
                            <MaterialIcons name="arrow-upward" size={13} color={COLORS.tertiaryFixed} />
                          ) : socialStats.trend < 0 ? (
                            <MaterialIcons name="arrow-downward" size={13} color="#EF4444" />
                          ) : (
                            <MaterialIcons name="remove" size={13} color={COLORS.onSurfaceVariant} />
                          )}
                          <Text style={{ fontSize: 11, fontWeight: '700', color: socialStats.trend > 0 ? COLORS.tertiaryFixed : socialStats.trend < 0 ? "#EF4444" : COLORS.onSurfaceVariant }}>
                            {socialStats.trend !== 0 ? ` ${Math.abs(socialStats.trend)}%` : ''}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 13, textAlign: 'center' }}>{t('dashboardScreen.social.noAccounts')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Sosyal Medya')} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#00F2FE', fontSize: 13, fontWeight: '500' }}>{t('dashboardScreen.social.connectAccount')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </CustomGlassCard>

            {/* İletişim Raporları */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.appointmentNotifications.title')}</Text>
            </View>
            <AppointmentNotifications navigation={navigation} onRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
            {recentActivities.length > 0 && (
            <>
            {/* Son Aktiviteler */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.recentActivity.title')}</Text>
              <TouchableOpacity><Text style={styles.seeAllBtn}>{t('dashboardScreen.recentActivity.seeAll')}</Text></TouchableOpacity>
            </View>
            <View style={styles.activitiesContainer}>
              {isLoading ? (
                <>
                  <View style={styles.activityCard}><Skeleton width="100%" height={60} borderRadius={16} /></View>
                  <View style={styles.activityCard}><Skeleton width="100%" height={60} borderRadius={16} /></View>
                </>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <TouchableOpacity key={act.id} style={styles.activityCard} activeOpacity={0.7}>
                    <View style={styles.activityAvatarWrap}>
                      <Image source={{ uri: act.avatar }} style={styles.activityAvatar} />
                      {PLATFORM_ICONS[act.platform] && (
                        <View style={[styles.platformBadge, { backgroundColor: PLATFORM_ICONS[act.platform].color }]}>
                          <Ionicons name={PLATFORM_ICONS[act.platform].name} size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={styles.activityBody}>
                      <View style={styles.activityTopRow}>
                        <Text style={styles.activityName} numberOfLines={1}>{act.name}</Text>
                        <Text style={styles.activityTime}>{formatRelativeTime(act.date, t)}</Text>
                      </View>
                      <Text style={styles.activityMessage} numberOfLines={1}>{act.message}</Text>
                      <View style={styles.activityTagsRow}>
                        <View style={[styles.activityTag, { backgroundColor: `${act.color}1A`, borderColor: `${act.color}33` }]}>
                          <Text style={[styles.activityTagText, { color: act.color }]}>{act.type}</Text>
                        </View>
                        <View style={[styles.activityTag, { backgroundColor: COLORS.surfaceContainer, borderColor: 'rgba(255,255,255,0.05)' }]}>
                          <Text style={[styles.activityTagText, { color: COLORS.onSurfaceVariant }]}>{act.platform}</Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} style={styles.activityArrow} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>{t('dashboardScreen.recentActivity.empty')}</Text>
              )}
            </View>
            </>

            )}
            {/* Yaklaşan Ödemeler */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.upcomingPayments.title')}</Text>
            </View>
            {isLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} scrollEnabled={false}>
                <Skeleton width={200} height={120} borderRadius={20} />
                <Skeleton width={200} height={120} borderRadius={20} style={{ marginLeft: 12 }} />
              </ScrollView>
            ) : upcomingPayments.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} snapToInterval={216} decelerationRate="fast">
                {upcomingPayments.map((payment, index) => {
                  const colors = [COLORS.error, COLORS.tertiary, COLORS.primary, COLORS.secondary];
                  const pColor = colors[index % colors.length];
                  return (
                    <CustomGlassCard key={payment.id || index} style={styles.paymentCard}>
                      <View style={styles.paymentDateRow}>
                        <MaterialIcons name="event" size={16} color={pColor} />
                        <Text style={[styles.paymentDateText, { color: pColor }]}>{formatDayMonth(payment.date, t).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.paymentTitle} numberOfLines={1}>{payment.description || t('dashboardScreen.upcomingPayments.defaultTitle')}</Text>
                      <View style={styles.paymentBottomRow}>
                        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)} </Text>
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

            <View style={{ height: 40 }} />
          </View>
        </Animated.View>
      </ScrollView>

      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // --- HERO ------------------------------------------------------------
  hero: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroAvatarOuter: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(23, 21, 26, 0.55)',
  },
  heroAvatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F6F1EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: COLORS.tertiaryContainer,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(23, 21, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 9,
    height: 9,
    backgroundColor: '#EF4444',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  heroGreeting: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroName: {
    color: '#FDE047',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Heavy' : 'sans-serif-medium',
    letterSpacing: 0.5,
    marginBottom: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  heroAiCard: {
    backgroundColor: '#17151A',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroAiIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroAiTexts: {
    flex: 1,
  },
  heroAiTitle: {
    color: '#F6F1EC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroAiSubtitle: {
    color: '#A79E96',
    fontSize: 12,
    fontWeight: '500',
  },

  // --- BODY --------------------------------------------------------------
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Kart temeli — CustomGlassCard bunu her zaman baz alır.
  glassCard: {
    backgroundColor: 'rgba(42, 38, 49, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 240, 0.06)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },

  financeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  financeCard: {
    flex: 1,
    padding: 16,
  },
  financeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  financeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  financeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  financeValueText: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  financeValueCurrency: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '500',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 36,
    gap: 4,
  },
  barChartBar: {
    flex: 1,
    borderRadius: 3,
    minHeight: 4,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '600', letterSpacing: 0.84 },
  seeAllBtn: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  apptList: {
    gap: 10,
    marginBottom: 20,
  },
  apptListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  apptListDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  apptListTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    width: 44,
  },
  apptListTitle: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },

  socialCard: {
    padding: 16,
    marginBottom: 20,
  },
  socialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 181, 115, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialUsername: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  liveBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statsLabelText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 6,
  },
  followerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  followerValue: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: '800',
  },
  followerTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerTrendText: {
    color: COLORS.tertiaryFixed,
    fontSize: 11,
    fontWeight: '700',
  },
  trendBarBg: {
    width: 90,
    height: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 6,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 6,
  },

  invoiceCard: {
    padding: 16,
    marginBottom: 20,
  },
  invoiceCardHeader: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
  },
  invoiceContentRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  invoiceImageWrapper: {
    width: 64,
    height: 82,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  invoiceImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  invoiceDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  invoiceDetailLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  invoiceDetailValue: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  invoiceBtnText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 13,
  },

  activitiesContainer: {
    gap: 10,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(42, 38, 49, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 14,
    alignItems: 'center',
  },
  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  activityAvatarWrap: {
    position: 'relative',
  },
  platformBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  activityBody: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  activityName: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  activityTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
  activityMessage: {
    color: 'rgba(167, 158, 150, 0.9)',
    fontSize: 12,
    marginBottom: 8,
  },
  activityTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  activityTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  activityTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activityArrow: {
    opacity: 0.4,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    padding: 16,
  },

  paymentsScroll: {
    gap: 12,
    paddingBottom: 20,
    paddingRight: 4,
  },
  paymentCard: {
    width: 190,
    padding: 16,
  },
  paymentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  paymentDateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  paymentTitle: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  paymentAmount: {
    color: COLORS.onSurface,
    fontSize: 17,
    fontWeight: '800',
  },
  paymentCurrency: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.6,
  },
  paymentMoreBtn: {
    padding: 4,
  },
});






















