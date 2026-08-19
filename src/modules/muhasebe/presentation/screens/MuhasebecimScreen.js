import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { GlobalAppBar } from '../../../../shared';

// -- DEĞİŞKENLER VE RENKLER --
const COLORS = {
  background: '#151518',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  accent: '#00daf3', // Turkuaz
  accentSubtle: 'rgba(0, 218, 243, 0.1)',
  textPrimary: '#e5e2e3',
  textSecondary: '#8e939c',
  error: '#ffb4ab',
  warning: '#ffb95f',
  success: '#4edea3',
};

const BORDER_WIDTH = 0.5;

export default function MuhasebecimScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // State for toggling between steps
  const [step, setStep] = useState('initial'); // 'initial' | 'verified' | 'connected'
  const [accountantCode, setAccountantCode] = useState('');
  const [firm, setFirm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const myCode = 'WG-73492';
  
  // Real DB connection fetch
  React.useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { supabase } = require('../../../../../shared');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (orgMember?.organization_id) {
        const { data: link } = await supabase
          .from('accountant_taxpayer_links')
          .select('accounting_firm_id')
          .eq('taxpayer_organization_id', orgMember.organization_id)
          .eq('status', 'active')
          .maybeSingle();

        if (link?.accounting_firm_id) {
          const { data: firmInfo } = await supabase
            .from('accounting_firms')
            .select('firm_name')
            .eq('id', link.accounting_firm_id)
            .maybeSingle();

          if (firmInfo) {
            setFirm({
              name: firmInfo.firm_name,
              location: '-',
              rating: 5.0,
              activeTaxpayers: 'Çok sayıda'
            });
            setStep('connected');
          }
        }
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    if (accountantCode.trim().length > 0) {
      setIsLoading(true);
      // Simulate API GET /api/flow-connections/verify
      setTimeout(() => {
        setFirm({
          name: 'Akbulut Mali Müşavirlik',
          location: 'İstanbul / Başakşehir',
          rating: 4.9,
          activeTaxpayers: 120
        });
        setIsLoading(false);
        setStep('verified');
      }, 800);
    } else {
      Alert.alert('Hata', 'Lütfen geçerli bir muhasebeci kodu girin.');
    }
  };

  const handleConnectFinal = () => {
    setIsLoading(true);
    // Simulate API POST /api/flow-connections/link
    setTimeout(() => {
      setIsLoading(false);
      setStep('connected');
    }, 1000);
  };

  const handleCopy = () => {
    Alert.alert('Kopyalandı', 'Kimlik kodunuz panoya kopyalandı.');
  };

  const renderUnconnectedState = () => (
    <View style={styles.stateContainer}>
      <Text style={styles.headerTitle}>Müşavirinize Bağlanın</Text>
      <Text style={styles.headerSubtitle}>
        Verilerinizi güvenli bir şekilde paylaşarak finansal süreçlerinizi hızlandırın.
      </Text>

      {/* Option 1: Enter Code */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="vpn-key" size={20} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Muhasebeci Kodunu Gir</Text>
        </View>
        <Text style={styles.cardDesc}>
          Muhasebecinizin size verdiği davet kodunu girerek hesabınızı bağlayın.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, step === 'verified' && { opacity: 0.5 }]}
            placeholder="Örn: ABC-12345"
            placeholderTextColor={COLORS.textSecondary}
            value={accountantCode}
            onChangeText={setAccountantCode}
            autoCapitalize="characters"
            editable={step === 'initial'}
          />
          {step === 'initial' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Bekleyin...' : 'Doğrula'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {step === 'verified' && firm && (
          <View style={styles.previewContainer}>
            <View style={styles.firmCard}>
              <View style={styles.firmHeader}>
                <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                <Text style={styles.firmVerifiedText}>Kod doğrulandı</Text>
              </View>
              
              <Text style={styles.firmName}>{firm.name}</Text>
              <Text style={styles.firmLocation}>{firm.location}</Text>
              
              <View style={styles.firmStats}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStars}>★★★★☆</Text>
                  <Text style={styles.ratingValue}>{firm.rating}</Text>
                </View>
                <Text style={styles.taxpayersText}>{firm.activeTaxpayers} aktif mükellef</Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.featuresTitle}>Bu muhasebeciye bağlanırsanız;</Text>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Faturalar paylaşılır</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Gelir gider aktarılır</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Evrak talepleri alınır</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>AI Muhasebe birlikte çalışır</Text>
              </View>
              
              <TouchableOpacity style={styles.connectFinalBtn} onPress={handleConnectFinal} disabled={isLoading}>
                <Text style={styles.connectFinalBtnText}>{isLoading ? 'Bağlanıyor...' : 'Bağlan'}</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.legalText}>
              Bağlanarak faturalarınızı, fişlerinizi ve finansal belgelerinizi seçtiğiniz mali müşavir ile güvenli şekilde paylaşmayı kabul etmiş olursunuz. Bağlantıyı istediğiniz zaman kaldırabilirsiniz.
            </Text>
          </View>
        )}
      </View>

      {/* Option 2: Share Code */}
      <View style={[styles.card, { marginTop: 24 }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="share" size={20} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Kendi Kodunu Paylaş</Text>
        </View>
        <Text style={styles.cardDesc}>
          Muhasebeciniz sizi platforma davet etmek isterse aşağıdaki kodu onunla paylaşın. Muhasebecim beni eklesin.
        </Text>
        
        <TouchableOpacity style={styles.copyCodeContainer} onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.copyCodeText}>{myCode}</Text>
          <MaterialIcons name="content-copy" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnectedState = () => (
    <View style={styles.stateContainer}>
      
      {/* 1. Accountant Profile */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="account-balance" size={24} color={COLORS.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Akbulut Mali Müşavirlik</Text>
            <Text style={styles.profileSubName}>Volkan Akbulut</Text>
            <View style={[styles.statusRow, { marginTop: 4 }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Bağlı • Son Senk: Bugün 14:32</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Last Message */}
      <View style={styles.messageCard}>
        <MaterialIcons name="format-quote" size={24} color={COLORS.textSecondary} style={styles.quoteIcon} />
        <Text style={styles.messageText}>"Mart ayı faturalarını kontrol ettim, eksik olanları belgeler kısmına yükleyebilir misin?"</Text>
        <Text style={styles.messageAuthor}>- Ahmet Yılmaz, Müşavir</Text>
      </View>

      {/* 3. Action Cards (Side by Side) */}
      <View style={styles.actionCardsRow}>
        <View style={[styles.actionCard, { marginRight: 8 }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 180, 171, 0.1)' }]}>
            <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
          </View>
          <Text style={styles.actionCardTitle}>Eksik Evrak</Text>
          <Text style={[styles.actionCardValue, { color: COLORS.error }]}>2 Adet</Text>
        </View>
        <View style={[styles.actionCard, { marginLeft: 8 }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 185, 95, 0.1)' }]}>
            <MaterialIcons name="event" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.actionCardTitle}>Yaklaşan Vergi</Text>
          <Text style={[styles.actionCardValue, { color: COLORS.warning }]}>18 Temmuz</Text>
        </View>
      </View>

      {/* 4. Quick Actions */}
      <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionBtn}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="chat" size={20} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.quickActionText}>Mesaj Gönder</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionBtn}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="folder" size={20} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.quickActionText}>Belgeleri Gör</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn} onPress={() => setStep('initial')}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="link-off" size={20} color={COLORS.error} />
          </View>
          <Text style={[styles.quickActionText, { color: COLORS.error }]}>Bağlantıyı Kes</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );

  return (
    <View style={styles.container}>
      <GlobalAppBar level={2} module="finans" title="Muhasebecim" showProfile={false} />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'connected' ? renderConnectedState() : renderUnconnectedState()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  stateContainer: {
    flex: 1,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginRight: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  copyCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  copyCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  
  // -- Connected State Styles --
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accentSubtle,
    borderWidth: BORDER_WIDTH,
    borderColor: 'rgba(0, 218, 243, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  messageCard: {
    backgroundColor: 'rgba(0, 218, 243, 0.05)',
    borderWidth: BORDER_WIDTH,
    borderColor: 'rgba(0, 218, 243, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: 8,
    right: 16,
    opacity: 0.2,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
    paddingRight: 16,
  },
  messageAuthor: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  actionCardsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  actionCardValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardBg,
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // -- New UI Flow Styles --
  previewContainer: {
    marginTop: 24,
  },
  firmCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.3)',
    borderRadius: 16,
    padding: 20,
  },
  firmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  firmVerifiedText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  firmName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  firmLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  firmStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 185, 95, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  ratingStars: {
    color: COLORS.warning,
    fontSize: 12,
    marginRight: 4,
    letterSpacing: 2,
  },
  ratingValue: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  taxpayersText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  connectFinalBtn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectFinalBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  legalText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  profileSubName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  }
});
