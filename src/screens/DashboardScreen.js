import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { CommunicationLogsTable } from '../modules/sosyal_medya/presentation/components/CommunicationLogsTable';
import { supabase } from '../shared/lib/supabase';

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

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
};

const formatDayMonth = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString('tr-TR');
};

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
];
const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [aiActive, setAiActive] = useState(true);
  const [userProfile, setUserProfile] = useState({ fullName: '', avatarUrl: null });
  const [financeStats, setFinanceStats] = useState({ income: 0, expense: 0 });
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [socialStats, setSocialStats] = useState({ followers: 0, trend: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Sadece görsel: ekran girişinde içerik yumuşakça belirir ---
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const appointments = [
    { time: "10:00", title: "Ayşe Kaya - Danışmanlık", type: "consulting", color: COLORS.primary },
    { time: "12:30", title: "Marka Toplantısı", type: "meeting", color: COLORS.secondary },
    { time: "15:00", title: "Seda Koç - Demo Sunumu", type: "demo", color: COLORS.tertiaryFixed },
    { time: "17:30", title: "Haftalık Analitik İncelemesi", type: "review", color: COLORS.error },
  ];

  const fetchUnreadNotifications = async (merchantId) => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', merchantId)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch (e) {
      console.warn('Notification count error:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadCounts = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
          const merchantId = orgMember?.organization_id || session.user.id;
          fetchUnreadNotifications(merchantId);
        }
      };
      loadCounts();
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
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
          merchantId = orgMember?.organization_id || session.user.id;
          const meta = session.user.user_metadata || {};

          // Fetch profile for avatar
          const { data: profileData } = await supabase
            .from('profiles')
            .select('business_name, authorized_person, avatar_url')
            .eq('id', merchantId)
            .maybeSingle();

          const nameToUse = profileData?.authorized_person || profileData?.business_name || meta.full_name || 'Kullanıcı';
          setUserProfile({
            fullName: nameToUse,
            avatarUrl: profileData?.avatar_url || meta.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToUse)}&background=00daf3&color=fff`
          });

          // Unread Notifications Count
          fetchUnreadNotifications(merchantId);

          // Bot Status
          const { data: botData } = await supabase
            .from('bot_settings')
            .select('is_active')
            .eq('merchant_id', merchantId)
            .maybeSingle();
          if (botData) setAiActive(botData.is_active);
        }

        // 2. Finance Stats (Transactions + Finance Documents)
        let inc = 0, exp = 0;
        let upcoming = [];
        const today = new Date().toISOString().split('T')[0];

        // Fetch transactions
        const { data: transactions } = await supabase.from('transactions').select('*');
        if (transactions) {
          transactions.forEach(t => {
            if (t.type === 'income') inc += Number(t.amount);
            if (t.type === 'expense') {
              exp += Number(t.amount);
              if (t.date && t.date >= today) {
                upcoming.push({ ...t, description: t.title || 'Ödeme' });
              }
            }
          });
        }

        // Fetch finance_documents
        let orgId = null;
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
          orgId = orgMember?.organization_id;
        }

        if (orgId) {
          const { data: docs } = await supabase.from('finance_documents').select('*').eq('organization_id', orgId);
          if (docs) {
            docs.forEach(d => {
              const amt = Number(d.amount_minor) / 100;
              if (d.type === 'income' || d.type === 'sales') {
                if (d.flow_payment_status === 'paid') inc += amt;
              } else if (d.type === 'expense') {
                if (d.flow_payment_status === 'paid') {
                  exp += amt;
                } else {
                  const docDate = d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : null;
                  if (docDate && docDate >= today) {
                    upcoming.push({ id: d.id, date: docDate, amount: amt, description: d.title || 'Fatura Ödemesi', type: 'expense' });
                  }
                }
              }
            });
          }
        }

        upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingPayments(upcoming.slice(0, 5));
        setFinanceStats({ income: inc, expense: exp });

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

        // 4. Recent Activities (Messages & Comments)
        const [{ data: msgs }, { data: comments }] = await Promise.all([
          supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        
        let merged = [];
        if (msgs) {
          merged = [...merged, ...msgs.map(m => ({
            id: 'msg_'+m.id,
            type: 'MESAJ',
            platform: 'WHATSAPP',
            name: m.sender_name || 'Müşteri',
            message: m.message_body || m.content || '',
            date: m.created_at,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.sender_name || 'M')}&background=00daf3&color=fff`,
            color: COLORS.primaryFixedDim
          }))];
        }
        if (comments) {
          merged = [...merged, ...comments.map(c => ({
            id: 'cmt_'+c.id,
            type: 'YORUM',
            platform: (c.platform || 'INSTAGRAM').toUpperCase(),
            name: c.username || 'Kullanıcı',
            message: c.text || c.content || '',
            date: c.created_at,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || 'K')}&background=ecb2ff&color=fff`,
            color: COLORS.secondaryFixed
          }))];
        }
        
        merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentActivities(merged.slice(0, 3));

      } catch (error) {
        console.warn('Dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    }, [])
  );

  const handleToggleAiActive = async (val) => {
    setAiActive(val);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
        const merchantId = orgMember?.organization_id || session.user.id;
        
        await supabase
          .from('bot_settings')
          .update({ is_active: val })
          .eq('merchant_id', merchantId);
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
        scrollRef.current.scrollTo({ x: screenWidth * initialIndex, animated: false });
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

          {/* HERO: cesur renk bloğu — profil, bildirim ve AI durumu tek odakta */}
          <View style={[styles.hero, { overflow: 'hidden' }]}>
            <View style={StyleSheet.absoluteFill}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {BAR_IMAGES.map((img, idx) => (
                  <Image key={idx} source={img} style={{ width: screenWidth, height: '100%', resizeMode: 'cover' }} />
                ))}
              </ScrollView>
            </View>
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

              <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Inbox', { screen: 'Bildirimler' })}>
                <MaterialIcons name="notifications" size={20} color={COLORS.background} />
                {unreadCount > 0 && <View style={styles.notificationBadge} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.heroGreeting}>İyi günler</Text>
            {isLoading ? (
              <Skeleton width={140} height={26} style={{ marginTop: 6, marginBottom: 18 }} />
            ) : (
              <Text style={styles.heroName}>{userProfile.fullName}</Text>
            )}

            {/* AI Asistan durumu — hero'nun içine gömülü tek odak kartı */}
            <View style={styles.heroAiCard}>
              <BreathingIcon active={aiActive && !isLoading}>
                <View style={styles.heroAiIconWrapper}>
                  <MaterialIcons name="smart-toy" size={22} color={COLORS.background} />
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
                    <Text style={styles.heroAiTitle}>{aiActive ? 'Asistanın çalışıyor' : 'Asistanın kapalı'}</Text>
                    <Text style={styles.heroAiSubtitle}>{aiActive ? '7/24 akıllı otomasyon devrede' : 'WhatsApp, sosyal medya vb. kapalı'}</Text>
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

          <View style={styles.body}>

            {/* Gelir / Gider */}
            <View style={styles.financeGrid}>
              <CustomGlassCard style={styles.financeCard}>
                <View style={styles.financeHeaderRow}>
                  <View style={[styles.financeBadge, { backgroundColor: 'rgba(34, 181, 115, 0.12)', borderColor: 'rgba(34, 181, 115, 0.25)' }]}>
                    <Text style={[styles.financeBadgeText, { color: COLORS.tertiaryFixed }]}>Gelir</Text>
                  </View>
                  <MaterialIcons name="trending-up" size={18} color={COLORS.tertiary} />
                </View>
                {isLoading ? (
                  <Skeleton width="80%" height={26} style={{ marginBottom: 12 }} />
                ) : (
                  <Text style={styles.financeValueText}>{formatCurrency(financeStats.income)} <Text style={styles.financeValueCurrency}>TL</Text></Text>
                )}
                <View style={styles.barChartContainer}>
                  {[30, 50, 45, 75, 65, 90, 100].map((h, i) => (
                    <View key={i} style={[
                      styles.barChartBar,
                      { height: `${h}%`, backgroundColor: i === 6 ? COLORS.tertiary : `rgba(34, 181, 115, ${0.15 + (i * 0.1)})` },
                      i === 6 ? { shadowColor: COLORS.tertiary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 } : null
                    ]} />
                  ))}
                </View>
              </CustomGlassCard>

              <CustomGlassCard style={styles.financeCard}>
                <View style={styles.financeHeaderRow}>
                  <View style={[styles.financeBadge, { backgroundColor: 'rgba(255, 180, 171, 0.1)', borderColor: 'rgba(255, 180, 171, 0.2)' }]}>
                    <Text style={[styles.financeBadgeText, { color: COLORS.error }]}>Gider</Text>
                  </View>
                  <MaterialIcons name="trending-down" size={18} color={COLORS.error} />
                </View>
                {isLoading ? (
                  <Skeleton width="80%" height={26} style={{ marginBottom: 12 }} />
                ) : (
                  <Text style={styles.financeValueText}>{formatCurrency(financeStats.expense)} <Text style={styles.financeValueCurrency}>TL</Text></Text>
                )}
                <View style={styles.barChartContainer}>
                  {[70, 50, 85, 30, 60, 40, 50].map((h, i) => (
                    <View key={i} style={[
                      styles.barChartBar,
                      { height: `${h}%`, backgroundColor: i === 6 ? COLORS.error : `rgba(255, 180, 171, ${0.2 + (i * 0.1)})` },
                      i === 6 ? { shadowColor: COLORS.error, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 } : null
                    ]} />
                  ))}
                </View>
              </CustomGlassCard>
            </View>

            {/* Bugünkü Randevular — yatay kaydırmalı çipler */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Bugün</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.apptScroll}>
              {appointments.map(a => (
                <View key={a.time} style={styles.apptChip}>
                  <View style={[styles.apptChipDot, { backgroundColor: a.color }]} />
                  <Text style={styles.apptChipTime}>{a.time}</Text>
                  <Text style={styles.apptChipTitle} numberOfLines={1}>{a.title}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Tüm Hesaplar — sosyal özet */}
            <CustomGlassCard style={styles.socialCard}>
              <View style={styles.socialHeader}>
                <View style={styles.socialProfile}>
                  <View style={styles.socialAvatar}>
                    <MaterialIcons name="groups" size={18} color={COLORS.primaryFixedDim} />
                  </View>
                  <Text style={styles.socialUsername}>Tüm Hesaplar</Text>
                </View>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>CANLI</Text>
                </View>
              </View>
              <View style={styles.socialStatsRow}>
                <View>
                  <Text style={styles.statsLabelText}>Toplam takipçi</Text>
                  <View style={styles.followerRow}>
                    {isLoading ? (
                      <Skeleton width={70} height={26} />
                    ) : (
                      <>
                        <Text style={styles.followerValue}>{socialStats.followers.toLocaleString('tr-TR')}</Text>
                        <View style={styles.followerTrend}>
                          <MaterialIcons name="arrow-upward" size={13} color={COLORS.tertiaryFixed} />
                          <Text style={styles.followerTrendText}> {socialStats.trend}%</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.statsLabelText}>Etkileşim</Text>
                  <View style={styles.trendBarBg}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryContainer, COLORS.secondary]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.trendBarFill, { width: '82%' }]}
                    />
                  </View>
                </View>
              </View>
            </CustomGlassCard>

            {/* Fatura Tarayıcı */}
            <CustomGlassCard style={styles.invoiceCard} glowColor="#F59E0B">
              <Text style={styles.invoiceCardHeader}>FATURA TARAYICI · SON FATURA</Text>
              <View style={styles.invoiceContentRow}>
                <View style={styles.invoiceImageWrapper}>
                  <Image
                    source={{ uri: "https://images.unsplash.com/photo-1648500847390-7792256bb95a?w=80&h=100&fit=crop&auto=format" }}
                    style={styles.invoiceImage}
                  />
                </View>
                <View style={styles.invoiceDetails}>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>Tedarikçi</Text>
                    <Text style={styles.invoiceDetailValue}>Ofis Dünyası A.Ş.</Text>
                  </View>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>Tarih</Text>
                    <Text style={styles.invoiceDetailValue}>03.02.2026</Text>
                  </View>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>KDV</Text>
                    <Text style={styles.invoiceDetailValue}>%20</Text>
                  </View>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>Toplam</Text>
                    <Text style={styles.invoiceDetailValue}>₺4,820.00</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.invoiceBtn}>
                <Text style={styles.invoiceBtnText}>+ Yeni Fatura Tara</Text>
              </TouchableOpacity>
            </CustomGlassCard>

            {/* Son Aktiviteler */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Son hareketler</Text>
              <TouchableOpacity><Text style={styles.seeAllBtn}>TÜMÜNÜ GÖR</Text></TouchableOpacity>
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
                    <Image source={{ uri: act.avatar }} style={styles.activityAvatar} />
                    <View style={styles.activityBody}>
                      <View style={styles.activityTopRow}>
                        <Text style={styles.activityName} numberOfLines={1}>{act.name}</Text>
                        <Text style={styles.activityTime}>{formatRelativeTime(act.date)}</Text>
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
                <Text style={styles.emptyText}>Henüz bir aktivite bulunmuyor.</Text>
              )}
            </View>

            {/* Yaklaşan Ödemeler */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Yaklaşan ödemeler</Text>
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
                        <Text style={[styles.paymentDateText, { color: pColor }]}>{formatDayMonth(payment.date).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.paymentTitle} numberOfLines={1}>{payment.description || 'Ödeme'}</Text>
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
              <Text style={styles.emptyText}>Yaklaşan bir ödeme bulunmuyor.</Text>
            )}

            {/* İletişim Raporları */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>İletişim raporları</Text>
            </View>
            <CommunicationLogsTable />
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
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllBtn: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  apptScroll: {
    gap: 10,
    paddingBottom: 20,
    paddingRight: 4,
  },
  apptChip: {
    width: 132,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  apptChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  apptChipTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  apptChipTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
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



