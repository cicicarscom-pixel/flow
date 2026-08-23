import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Switch,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
  const animValue = useRef(new Animated.Value(0)).current;

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
  const pulse = useRef(new Animated.Value(0)).current;

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
  }, [active]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

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

  useEffect(() => {
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
  }, []);

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

  let tabBarHeight = 80;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {}

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerProfileArea}>
          <TouchableOpacity 
            style={styles.profileImageWrapper}
            onPress={() => navigation.navigate('Profil')}
          >
            {isLoading ? (
              <Skeleton width="100%" height="100%" borderRadius={18} />
            ) : (
              <Image 
                source={{ uri: userProfile.avatarUrl || 'https://ui-avatars.com/api/?name=Kullanici' }}
                style={styles.profileImage}
              />
            )}
            {!isLoading && <View style={styles.onlineDot} />}
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>MERHABA,</Text>
            {isLoading ? (
              <Skeleton width={100} height={20} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.userNameText}>{userProfile.fullName}</Text>
            )}
          </View>
        </View>

          <View style={styles.headerRightArea}>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Inbox', { screen: 'Bildirimler' })}>
              <MaterialIcons name="notifications" size={26} color={COLORS.onSurfaceVariant} />
              {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* AI Assistant Status Card */}
        <CustomGlassCard style={styles.aiStatusCard} glowColor={COLORS.primary}>
          <View style={styles.aiStatusLeft}>
            <BreathingIcon active={aiActive && !isLoading}>
              <View style={styles.aiIconWrapper}>
                <MaterialIcons name="smart-toy" size={28} color={COLORS.primaryFixedDim} />
              </View>
            </BreathingIcon>
            <View style={styles.aiStatusTexts}>
              {isLoading ? (
                <>
                  <Skeleton width={120} height={18} style={{ marginBottom: 4 }} />
                  <Skeleton width={160} height={12} />
                </>
              ) : (
                <>
                  <Text style={styles.aiStatusTitle}>{aiActive ? 'Ai Asistan Aktif' : 'Ai Asistan Kapalı'}</Text>
                  <Text style={styles.aiStatusSubtitle}>{aiActive ? '7/24 Akıllı Otomasyon Devrede' : 'Tüm asistanlar (WhatsApp, Sosyal Medya vb.) kapalı'}</Text>
                </>
              )}
            </View>
          </View>
          {!isLoading && (
            <Switch 
              value={aiActive}
              onValueChange={handleToggleAiActive}
              trackColor={{ false: COLORS.surfaceContainerHighest, true: COLORS.primaryContainer }}
              thumbColor={'#fff'}
              ios_backgroundColor={COLORS.surfaceContainerHighest}
            />
          )}
        </CustomGlassCard>

        {/* Financial Summary Grid */}
        <View style={styles.financeGrid}>
          {/* Gelir */}
          <CustomGlassCard style={styles.financeCard}>
            <View style={styles.financeHeaderRow}>
              <View style={[styles.financeBadge, { backgroundColor: 'rgba(174, 255, 192, 0.1)', borderColor: 'rgba(174, 255, 192, 0.2)' }]}>
                <Text style={[styles.financeBadgeText, { color: COLORS.tertiaryFixed }]}>Gelir</Text>
              </View>
              <MaterialIcons name="trending-up" size={18} color={COLORS.tertiary} />
            </View>
            {isLoading ? (
              <Skeleton width="80%" height={28} style={{ marginBottom: 12 }} />
            ) : (
              <Text style={styles.financeValueText}>{formatCurrency(financeStats.income)} <Text style={styles.financeValueCurrency}>TL</Text></Text>
            )}
            <View style={styles.barChartContainer}>
              {[30, 50, 45, 75, 65, 90, 100].map((h, i) => (
                <View key={i} style={[
                  styles.barChartBar, 
                  { height: `${h}%`, backgroundColor: i === 6 ? COLORS.tertiary : `rgba(174, 255, 192, ${0.2 + (i * 0.1)})` },
                  i === 6 ? { shadowColor: COLORS.tertiary, shadowOffset: {width:0,height:0}, shadowOpacity:0.35, shadowRadius:8, elevation: 5 } : null
                ]} />
              ))}
            </View>
          </CustomGlassCard>

          {/* Gider */}
          <CustomGlassCard style={styles.financeCard}>
            <View style={styles.financeHeaderRow}>
              <View style={[styles.financeBadge, { backgroundColor: 'rgba(255, 180, 171, 0.1)', borderColor: 'rgba(255, 180, 171, 0.2)' }]}>
                <Text style={[styles.financeBadgeText, { color: COLORS.error }]}>Gider</Text>
              </View>
              <MaterialIcons name="trending-down" size={18} color={COLORS.error} />
            </View>
            {isLoading ? (
              <Skeleton width="80%" height={28} style={{ marginBottom: 12 }} />
            ) : (
              <Text style={styles.financeValueText}>{formatCurrency(financeStats.expense)} <Text style={styles.financeValueCurrency}>TL</Text></Text>
            )}
            <View style={styles.barChartContainer}>
              {[70, 50, 85, 30, 60, 40, 50].map((h, i) => (
                <View key={i} style={[
                  styles.barChartBar, 
                  { height: `${h}%`, backgroundColor: i === 6 ? COLORS.error : `rgba(255, 180, 171, ${0.2 + (i * 0.1)})` },
                  i === 6 ? { shadowColor: COLORS.error, shadowOffset: {width:0,height:0}, shadowOpacity:0.35, shadowRadius:8, elevation: 5 } : null
                ]} />
              ))}
            </View>
          </CustomGlassCard>
        </View>

        {/* Social Media Stats Section */}
        <View style={styles.socialCardWrapper}>
          <LinearGradient
            colors={['rgba(0, 218, 243, 0.1)', 'transparent', 'rgba(236, 178, 255, 0.05)']}
            style={StyleSheet.absoluteFillObject}
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          />
          <View style={styles.socialCardContent}>
            <View style={styles.socialHeader}>
              <View style={styles.socialProfile}>
                <View style={styles.socialAvatar}>
                  <MaterialIcons name="groups" size={20} color={COLORS.primaryFixedDim} />
                </View>
                <Text style={styles.socialUsername}>Tüm Hesaplar</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>CANLI ANALİZ</Text>
              </View>
            </View>
            
            <View style={styles.socialStatsRow}>
              <View>
                <Text style={styles.statsLabelText}>Toplam Takipçi Kitle</Text>
                <View style={styles.followerRow}>
                  {isLoading ? (
                    <Skeleton width={80} height={32} />
                  ) : (
                    <>
                      <GlowingText style={styles.followerValue} color={COLORS.primary}>
                        {socialStats.followers.toLocaleString('tr-TR')}
                      </GlowingText>
                      <View style={styles.followerTrend}>
                        <MaterialIcons name="arrow-upward" size={14} color={COLORS.tertiaryFixed} style={{fontWeight: 'bold'}} />
                        <Text style={styles.followerTrendText}> {socialStats.trend}%</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statsLabelText}>Etkileşim Trendi</Text>
                <View style={styles.trendRow}>
                  <View style={styles.trendBarBg}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryContainer, COLORS.secondary]}
                      start={{x:0, y:0}} end={{x:1, y:0}}
                      style={[styles.trendBarFill, { width: '82%' }]}
                    />
                  </View>
                  <Text style={styles.trendLevelText}>Yüksek</Text>
                </View>
              </View>
            </View>
          </View>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryContainer, COLORS.secondary]}
            start={{x:0, y:0}} end={{x:1, y:0}}
            style={styles.socialBottomLine}
          />
        </View>

        {/* Fatura Tarayıcı */}
        <CustomGlassCard style={[styles.invoiceCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]} glowColor="#F59E0B">
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

        {/* Bugünkü Randevular */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Bugünkü Randevular</Text>
        </View>
        <CustomGlassCard style={styles.appointmentsContainer}>
          {appointments.map(a => (
            <View key={a.time} style={styles.appointmentRow}>
              <Text style={[styles.appointmentTime, { color: a.color }]}>{a.time}</Text>
              <View style={[styles.appointmentDivider, { backgroundColor: a.color }]} />
              <View style={styles.appointmentBody}>
                <Text style={styles.appointmentTitle}>{a.title}</Text>
              </View>
            </View>
          ))}
        </CustomGlassCard>

        {/* Son Aktiviteler */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          <TouchableOpacity><Text style={styles.seeAllBtn}>TÜMÜNÜ GÖR</Text></TouchableOpacity>
        </View>
        <View style={styles.activitiesContainer}>
          {isLoading ? (
            <>
              <View style={styles.activityCard}><Skeleton width="100%" height={60} borderRadius={12} /></View>
              <View style={styles.activityCard}><Skeleton width="100%" height={60} borderRadius={12} /></View>
            </>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((act, index) => (
              <TouchableOpacity key={act.id} style={[styles.activityCard, index > 0 ? { borderLeftWidth: 2, borderLeftColor: act.color } : null]} activeOpacity={0.7}>
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
                <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurfaceVariant} style={styles.activityArrow} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, textAlign: 'center', padding: 16 }}>Henüz bir aktivite bulunmuyor.</Text>
          )}
        </View>

        {/* Yaklaşan Ödemeler */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Yaklaşan Ödemeler</Text>
        </View>
        
        {isLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} scrollEnabled={false}>
            <Skeleton width={200} height={120} borderRadius={16} />
            <Skeleton width={200} height={120} borderRadius={16} style={{ marginLeft: 12 }} />
          </ScrollView>
        ) : upcomingPayments.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} snapToInterval={216} decelerationRate="fast">
            {upcomingPayments.map((payment, index) => {
              const colors = [COLORS.error, COLORS.tertiary, COLORS.primary, COLORS.secondary];
              const pColor = colors[index % colors.length];
              return (
                <CustomGlassCard key={payment.id || index} style={[styles.paymentCard, { borderBottomWidth: 2, borderBottomColor: `${pColor}99` }]}>
                  <View style={styles.paymentDateRow}>
                    <MaterialIcons name="event" size={18} color={pColor} />
                    <Text style={styles.paymentDateText}>{formatDayMonth(payment.date).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.paymentTitle} numberOfLines={1}>{payment.description || 'Ödeme'}</Text>
                  <View style={styles.paymentBottomRow}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)} <Text style={styles.paymentCurrency}>TL</Text></Text>
                    <TouchableOpacity style={styles.paymentMoreBtn}>
                      <MaterialIcons name="more-horiz" size={20} color={COLORS.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                </CustomGlassCard>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, paddingHorizontal: 4, paddingBottom: 16 }}>Yaklaşan bir ödeme bulunmuyor.</Text>
        )}

        {/* İletişim Raporları */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>İletişim Raporları</Text>
        </View>
        <CommunicationLogsTable />
        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(17, 20, 23, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 50,
  },
  headerProfileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    padding: 2,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: COLORS.tertiaryContainer,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  greetingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userNameText: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(39, 42, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 240, 0.06)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  aiStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    marginBottom: 16,
  },
  aiStatusLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiStatusTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  aiIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 181, 115, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStatusTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  aiStatusSubtitle: {
    color: 'rgba(186, 201, 204, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  financeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  financeCard: {
    flex: 1,
    padding: 16,
  },
  financeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  financeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  financeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  financeValueText: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  financeValueCurrency: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '400',
  },
  barChartContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barChartBar: {
    flex: 1,
    borderRadius: 4,
  },
  socialCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(39, 42, 46, 0.4)',
    marginBottom: 16,
  },
  socialCardContent: {
    padding: 16,
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
    gap: 12,
  },
  socialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialUsername: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  liveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.2)',
  },
  liveBadgeText: {
    color: COLORS.primaryContainer,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabelText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  followerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  followerValue: {
    fontSize: 32,
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendBarBg: {
    width: 110,
    height: 10,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trendBarFill: {
    height: '100%',
  },
  trendLevelText: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '700',
  },
  socialBottomLine: {
    height: 4,
    width: '100%',
    opacity: 0.6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllBtn: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activitiesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(39, 42, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 16,
  },
  activityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
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
    fontSize: 14,
    fontWeight: '700',
  },
  activityTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
  activityMessage: {
    color: 'rgba(186, 201, 204, 0.9)',
    fontSize: 14,
    marginBottom: 10,
  },
  activityTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  activityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  activityTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activityArrow: {
    alignSelf: 'center',
    opacity: 0.4,
  },
  paymentsScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  paymentCard: {
    width: 200,
    padding: 16,
  },
  paymentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentDateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  paymentTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: '800',
  },
  paymentCurrency: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  paymentMoreBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentsContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: '700',
    width: 44,
  },
  appointmentDivider: {
    width: 3,
    height: 36,
    borderRadius: 4,
    opacity: 0.6,
  },
  appointmentBody: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentTitle: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceCard: {
    padding: 16,
    marginBottom: 16,
  },
  invoiceCardHeader: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  invoiceContentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  invoiceImageWrapper: {
    width: 70,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11,0.2)',
    overflow: 'hidden',
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
    marginTop: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  invoiceBtnText: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 13,
  }
});


