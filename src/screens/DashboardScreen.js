import { formatMoney } from '../lib/money';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Animated, Dimensions, Alert, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { addDaysYmd, monthRangeYmd } from '../lib/dates';
import { supabase } from '../shared/lib/supabase';
import { container } from '../core/container';
import { AppointmentStatus } from '../modules/randevu/domain/enums/AppointmentStatus';
import { extractTime } from '../modules/randevu/presentation/hooks/useAppointments';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import { getCurrentOrgId } from '../lib/org';
import { COLORS } from './dashboard/dashboardTheme';
import { styles } from './dashboard/dashboardStyles';
import { AppointmentNotifications } from './dashboard/AppointmentNotifications';
import { pickFollowStats } from './dashboard/dashboardHelpers';
import { DashboardHero } from './dashboard/DashboardHero';
import { AppointmentsSection } from './dashboard/AppointmentsSection';
import { FinanceAndSocialSection } from './dashboard/FinanceAndSocialSection';
import { RecentActivitiesSection } from './dashboard/RecentActivitiesSection';
import { UpcomingPaymentsSection } from './dashboard/UpcomingPaymentsSection';

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

const formatCurrency = (amount, locale = 'tr-TR') => formatMoney(amount, locale);

// --- Subcomponents ---

const BAR_IMAGES = [
  require('../../assets/images/dashboard/bar1.jpg'),
  require('../../assets/images/dashboard/bar2.jpg'),
  require('../../assets/images/dashboard/bar3.jpg'),
  require('../../assets/images/dashboard/bar4.jpg'),
  require('../../assets/images/dashboard/bar5.jpg'),
  require('../../assets/images/dashboard/bar6.jpg'),
  require('../../assets/images/dashboard/bar7.jpg'),
  require('../../assets/images/dashboard/bar8.jpg'),
  require('../../assets/images/dashboard/bar9.jpg'),
  require('../../assets/images/dashboard/bar10.jpg'),
  require('../../assets/images/dashboard/bar11.jpg'),
  require('../../assets/images/dashboard/bar12.jpg'),
  require('../../assets/images/dashboard/bar14.jpg'),
];
const { width: screenWidth } = Dimensions.get('window');
const innerWidth = screenWidth - 2; // Compensate for left/right borders (1px each)


export default function DashboardScreen({ navigation }) {
  const { t, i18n } = useTranslation();
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
  const [orgTz, setOrgTz] = useState('Europe/Istanbul');
  const [hasSocialAccounts, setHasSocialAccounts] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState([]);
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
        // Tek doğru kaynak: silinen/iptal edilen randevuların bildirimleri sayılmaz (sunucu RPC'si).
        const { data, error } = await supabase.rpc('count_unread_appointment_notifications');
        if (error) throw error;
        setUnreadCount(Number(data) || 0);
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
          // İşletme kimliği istemciden gönderilmez: RLS (org_id = current_org_id()) satırı kapsar.
          const { data: botDataArr } = await supabase
            .from('bot_settings')
            .select('is_active')
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
          setOrgTz(tz);
        }

        const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
        const { from: p_from, to: p_to } = monthRangeYmd(today);

        const { data: summaryData } = await supabase.rpc('get_finance_summary', { p_from, p_to });
        if (summaryData && summaryData.status === 'SUCCESS') {
          setFinanceStats({ income: summaryData.income / 100, expense: summaryData.expense / 100 });
        } else {
          setFinanceStats({ income: 0, expense: 0 });
        }

        const p_future = addDaysYmd(today, 30);
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

        const actualFollow = pickFollowStats(followRes);
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
          setSocialAccounts(hasAccounts ? actualFollow.accounts.map(a => ({
            id: a._id || a.id || a.accountId,
            platform: a.platform,
            name: a.displayName || a.username || '',
            username: a.username || '',
            picture: a.profilePicture || null,
            followers: Number(a.currentFollowers || a.followers || 0),
            growth: Number(a.growthPercentage || a.followerGrowthPercentage || a.growth || 0),
          })) : []);


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
      const orgId = session ? await getCurrentOrgId(supabase) : null;
      if (orgId) {
        await supabase
          .from('bot_settings')
          .update({ is_active: val })
          .eq('org_id', orgId);
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
          <DashboardHero BAR_IMAGES={BAR_IMAGES} aiActive={aiActive} handleHeroImageChange={handleHeroImageChange} handleToggleAiActive={handleToggleAiActive} hintAnim={hintAnim} innerWidth={innerWidth} insets={insets} isFocused={isFocused} isLoading={isLoading} navigation={navigation} scrollRef={scrollRef} showHint={showHint} t={t} unreadCount={unreadCount} userProfile={userProfile} />

          <View style={styles.body}>
            <AppointmentsSection appointments={appointments} isLoading={isLoading} navigation={navigation} t={t} todayAppointments={todayAppointments} totalAppointments={totalAppointments} />


            <FinanceAndSocialSection financeStats={financeStats} formatCurrency={formatCurrency} hasSocialAccounts={hasSocialAccounts} i18n={i18n} isLoading={isLoading} latestInvoice={latestInvoice} navigation={navigation} orgTz={orgTz} socialAccounts={socialAccounts} socialStats={socialStats} t={t} />

            {/* İletişim Raporları */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.appointmentNotifications.title')}</Text>
            </View>
            <AppointmentNotifications navigation={navigation} onRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} onCleared={() => setUnreadCount(0)} />
            <RecentActivitiesSection isLoading={isLoading} recentActivities={recentActivities} t={t} />
            <UpcomingPaymentsSection formatCurrency={formatCurrency} formatDayMonth={formatDayMonth} i18n={i18n} isLoading={isLoading} t={t} upcomingPayments={upcomingPayments} />

            <View style={{ height: 40 }} />
          </View>
        </Animated.View>
      </ScrollView>

      

    </View>
  );
}






















