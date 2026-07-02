import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Switch,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { CommunicationLogsTable } from '../modules/sosyal_medya/presentation/components/CommunicationLogsTable';
import { supabase } from '../shared/lib/supabase';

const COLORS = {
  background: '#0b0e11',
  surface: '#111417',
  surfaceContainer: '#1d2023',
  surfaceContainerHigh: '#272a2e',
  surfaceContainerHighest: '#323538',
  onSurface: '#e1e2e7',
  onSurfaceVariant: '#bac9cc',
  primary: '#00daf3',
  primaryContainer: '#00e5ff',
  primaryFixed: '#9cf0ff',
  primaryFixedDim: '#00daf3',
  secondary: '#ecb2ff',
  secondaryFixed: '#f8d8ff',
  tertiary: '#aeffc0',
  tertiaryContainer: '#56eb8c',
  tertiaryFixed: '#6bfe9c',
  error: '#ffb4ab',
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

const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,218,243';
};

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [aiActive, setAiActive] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase
            .from('bot_settings')
            .select('is_active')
            .eq('merchant_id', session.user.id)
            .single();
          
          if (!error && data) {
            setAiActive(data.is_active);
          }
        }
      } catch (e) {
        console.warn('Could not fetch bot status', e);
      }
    };
    fetchStatus();
  }, []);

  const handleToggleAiActive = async (val) => {
    setAiActive(val);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('bot_settings')
          .update({ is_active: val })
          .eq('merchant_id', session.user.id);
      }
    } catch (e) {
      console.warn('Could not save bot status', e);
    }
  };

  // Tab bar yüksekliğini safe şekilde al, try-catch içine alıyoruz çünkü stack içinde açılırsa hata vermesin
  let tabBarHeight = 80;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {}

  return (
    <View style={styles.container}>
      {/* Top App Bar - Sabit */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerProfileArea}>
          <View style={styles.profileImageWrapper}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5mDstGNogn2SQOuqSPcGYs1i1mHNdDCZBU4CdtS2_qZghvP58iYQVQrLEcHdb4NnP1NB6ccpCfY5-LyKsTD2URe2r-oC8ZglDgkzGW1265HF7vjE3vqrEo2aRplQNzkwmxq16xnwa4_i0uFaVZ2UJyIUHG3jQ7vxllB3Gx_QPdWMJmKRIt566hkqspHewH6UALC2IkKCk6QsNhDmNNDgTeF1RMOeI_41nvxJCa4zQyNIvpXaN-BNDF3eVJtmCpVCRzJMVcc2gCxM' }}
              style={styles.profileImage}
            />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.greetingText}>MERHABA,</Text>
            <Text style={styles.userNameText}>Volkan</Text>
          </View>
        </View>

        <View style={styles.headerRightArea}>
          <GlowingText style={styles.brandTitle}>QuantuMinds</GlowingText>
          <TouchableOpacity style={styles.notificationBtn}>
            <MaterialIcons name="notifications" size={26} color={COLORS.onSurfaceVariant} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Assistant Status Card */}
        <CustomGlassCard style={styles.aiStatusCard} glowColor={COLORS.primary}>
          <View style={styles.aiStatusLeft}>
            <View style={styles.aiIconWrapper}>
              <MaterialIcons name="smart-toy" size={28} color={COLORS.primaryFixedDim} />
            </View>
            <View style={styles.aiStatusTexts}>
              <Text style={styles.aiStatusTitle}>{aiActive ? 'AI Asistan Aktif' : 'AI Asistan Kapalı'}</Text>
              <Text style={styles.aiStatusSubtitle}>{aiActive ? '7/24 Akıllı Otomasyon Devrede' : 'Sistem şu anda duraklatıldı'}</Text>
            </View>
          </View>
          <Switch 
            value={aiActive}
            onValueChange={handleToggleAiActive}
            trackColor={{ false: COLORS.surfaceContainerHighest, true: COLORS.primaryContainer }}
            thumbColor={'#fff'}
            ios_backgroundColor={COLORS.surfaceContainerHighest}
          />
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
            <Text style={styles.financeValueText}>50.000 <Text style={styles.financeValueCurrency}>TL</Text></Text>
            <View style={styles.barChartContainer}>
              {[30, 50, 45, 75, 65, 90, 100].map((h, i) => (
                <View key={i} style={[
                  styles.barChartBar, 
                  { height: `${h}%`, backgroundColor: i === 6 ? COLORS.tertiary : `rgba(174, 255, 192, ${0.2 + (i * 0.1)})` },
                  i === 6 ? { shadowColor: COLORS.tertiary, shadowOffset: {width:0,height:0}, shadowOpacity:0.5, shadowRadius:8, elevation: 5 } : null
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
            <Text style={styles.financeValueText}>20.000 <Text style={styles.financeValueCurrency}>TL</Text></Text>
            <View style={styles.barChartContainer}>
              {[70, 50, 85, 30, 60, 40, 50].map((h, i) => (
                <View key={i} style={[
                  styles.barChartBar, 
                  { height: `${h}%`, backgroundColor: i === 6 ? COLORS.error : `rgba(255, 180, 171, ${0.2 + (i * 0.1)})` },
                  i === 6 ? { shadowColor: COLORS.error, shadowOffset: {width:0,height:0}, shadowOpacity:0.5, shadowRadius:8, elevation: 5 } : null
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
                  <MaterialIcons name="alternate-email" size={18} color={COLORS.primaryFixedDim} />
                </View>
                <Text style={styles.socialUsername}>@cicicars</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>CANLI ANALİZ</Text>
              </View>
            </View>
            
            <View style={styles.socialStatsRow}>
              <View>
                <Text style={styles.statsLabelText}>Takipçi Kitlesi</Text>
                <View style={styles.followerRow}>
                  <GlowingText style={styles.followerValue} color={COLORS.primary}>83</GlowingText>
                  <View style={styles.followerTrend}>
                    <MaterialIcons name="arrow-upward" size={14} color={COLORS.tertiaryFixed} style={{fontWeight: 'bold'}} />
                    <Text style={styles.followerTrendText}> 12%</Text>
                  </View>
                </View>
              </View>
              
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statsLabelText}>Etkileşim Trendi</Text>
                <View style={styles.trendRow}>
                  <View style={styles.trendBarBg}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryContainer, COLORS.secondary]}
                      start={{x:0, y:0}} end={{x:1, y:0}}
                      style={[styles.trendBarFill, { width: '74%' }]}
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

        {/* Son Aktiviteler */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          <TouchableOpacity><Text style={styles.seeAllBtn}>TÜMÜNÜ GÖR</Text></TouchableOpacity>
        </View>
        <View style={styles.activitiesContainer}>
          {/* Message 1 */}
          <TouchableOpacity style={styles.activityCard} activeOpacity={0.7}>
            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxAxAHiEQ5kcjzzKXL-PO0pv0fh9gJyqMgM1v_aANNaURWUwJc4Qq9jaDywcW44egObbPykpKRc5sRAbMsiXezGE7lMMpTcQS8f1NJF1MDTd79hzDP1VYt7C575ekPzl_M-ti58w_ATd0jtKY60cQK9SYrkmZaZQ8ewJA_aXmXJJGo0t7hRwdBrQERe71vl9doRY2UiHsqdQGznz8WzyCFD4U0srCHfDMqpmWXjDs5-QSunlYTU1_DKwGreuDYwFdw8K-7IQ49fdI' }} style={styles.activityAvatar} />
            <View style={styles.activityBody}>
              <View style={styles.activityTopRow}>
                <Text style={styles.activityName} numberOfLines={1}>Mert Yılmaz</Text>
                <Text style={styles.activityTime}>10dk önce</Text>
              </View>
              <Text style={styles.activityMessage} numberOfLines={1}>Cevap Test 7: Ürün detayları hakkında bilgi alabilir miyim?</Text>
              <View style={styles.activityTagsRow}>
                <View style={[styles.activityTag, { backgroundColor: 'rgba(236, 178, 255, 0.1)', borderColor: 'rgba(236, 178, 255, 0.2)' }]}>
                  <Text style={[styles.activityTagText, { color: COLORS.secondaryFixed }]}>YORUM</Text>
                </View>
                <View style={[styles.activityTag, { backgroundColor: COLORS.surfaceContainer, borderColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[styles.activityTagText, { color: COLORS.onSurfaceVariant }]}>INSTAGRAM</Text>
                </View>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurfaceVariant} style={styles.activityArrow} />
          </TouchableOpacity>

          {/* Message 2 */}
          <TouchableOpacity style={[styles.activityCard, { borderLeftWidth: 2, borderLeftColor: COLORS.secondary }]} activeOpacity={0.7}>
            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtGjgXfwUuxpBphixzznCkJilEfG23KatYn2lGNLVHK5nZkGGk2eXGUlw64jIe4sPGrhcAbel8ltsyZFHmClZrIIVLYvW0_zGBEkO3n7RnzqckdRoKTeJkiYnyfP7H7-bJtuH9Dvh12JfaKb8vgQNc-7DpWqQIdd9p0qh1wDkEV38arTYISrfUlrIE-XUMsm-sYkxADmrCb-j9N8UnyZmo5UwkxKY8LOour0f7Z3PNK3OLAhkQfxoXy9gndhDA87idUqLe8K2qF4E' }} style={styles.activityAvatar} />
            <View style={styles.activityBody}>
              <View style={styles.activityTopRow}>
                <Text style={styles.activityName} numberOfLines={1}>Selin Aksu</Text>
                <Text style={styles.activityTime}>2sa önce</Text>
              </View>
              <Text style={styles.activityMessage} numberOfLines={1}>Cevap Test 7: Teşekkürler, çok hızlı dönüş yaptınız!</Text>
              <View style={styles.activityTagsRow}>
                <View style={[styles.activityTag, { backgroundColor: 'rgba(0, 218, 243, 0.1)', borderColor: 'rgba(0, 218, 243, 0.2)' }]}>
                  <Text style={[styles.activityTagText, { color: COLORS.primaryFixedDim }]}>MESAJ</Text>
                </View>
                <View style={[styles.activityTag, { backgroundColor: COLORS.surfaceContainer, borderColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[styles.activityTagText, { color: COLORS.onSurfaceVariant }]}>TWITTER</Text>
                </View>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurfaceVariant} style={styles.activityArrow} />
          </TouchableOpacity>
        </View>

        {/* Yaklaşan Ödemeler */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Yaklaşan Ödemeler</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} snapToInterval={216} decelerationRate="fast">
          {/* Kira */}
          <CustomGlassCard style={[styles.paymentCard, { borderBottomWidth: 2, borderBottomColor: 'rgba(255, 180, 171, 0.6)' }]}>
            <View style={styles.paymentDateRow}>
              <MaterialIcons name="event" size={18} color={COLORS.error} />
              <Text style={styles.paymentDateText}>15 NİSAN</Text>
            </View>
            <Text style={styles.paymentTitle}>Kira</Text>
            <View style={styles.paymentBottomRow}>
              <Text style={styles.paymentAmount}>12.500 <Text style={styles.paymentCurrency}>TL</Text></Text>
              <TouchableOpacity style={styles.paymentMoreBtn}>
                <MaterialIcons name="more-horiz" size={20} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </CustomGlassCard>

          {/* Tedarikçi */}
          <CustomGlassCard style={[styles.paymentCard, { borderBottomWidth: 2, borderBottomColor: 'rgba(174, 255, 192, 0.6)' }]}>
            <View style={styles.paymentDateRow}>
              <MaterialIcons name="event" size={18} color={COLORS.tertiary} />
              <Text style={styles.paymentDateText}>18 NİSAN</Text>
            </View>
            <Text style={styles.paymentTitle}>Tedarikçi</Text>
            <View style={styles.paymentBottomRow}>
              <Text style={styles.paymentAmount}>7.500 <Text style={styles.paymentCurrency}>TL</Text></Text>
              <TouchableOpacity style={styles.paymentMoreBtn}>
                <MaterialIcons name="more-horiz" size={20} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </CustomGlassCard>

          {/* Bulut Servis */}
          <CustomGlassCard style={[styles.paymentCard, { borderBottomWidth: 2, borderBottomColor: 'rgba(0, 218, 243, 0.6)' }]}>
            <View style={styles.paymentDateRow}>
              <MaterialIcons name="event" size={18} color={COLORS.primary} />
              <Text style={styles.paymentDateText}>22 NİSAN</Text>
            </View>
            <Text style={styles.paymentTitle}>Bulut Servis</Text>
            <View style={styles.paymentBottomRow}>
              <Text style={styles.paymentAmount}>1.200 <Text style={styles.paymentCurrency}>TL</Text></Text>
              <TouchableOpacity style={styles.paymentMoreBtn}>
                <MaterialIcons name="more-horiz" size={20} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </CustomGlassCard>
        </ScrollView>

        {/* İletişim Raporları */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>İletişim Raporları</Text>
        </View>
        <CommunicationLogsTable />
        
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, { bottom: tabBarHeight + 16 }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryContainer, COLORS.secondary]}
          style={styles.fabGradient}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        >
          <MaterialIcons name="auto-awesome" size={28} color={COLORS.onPrimary} />
        </LinearGradient>
      </TouchableOpacity>
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
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: COLORS.tertiaryContainer,
    borderRadius: 6,
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
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(39, 42, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  aiStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryContainer,
    marginBottom: 16,
  },
  aiStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.2)',
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
    borderRadius: 2,
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
    borderRadius: 18,
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
    borderRadius: 5,
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
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 100,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  }
});
