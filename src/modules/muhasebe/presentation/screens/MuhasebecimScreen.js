import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GlobalAppBar } from '../../../../shared';
import { useTranslation } from 'react-i18next';

// -- DEĞİŞKENLER VE RENKLER --
const COLORS = {
  background: '#201D24',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  accent: '#22B573', // Turkuaz
  accentSubtle: 'rgba(0, 218, 243, 0.1)',
  textPrimary: '#F6F1EC',
  textSecondary: '#A79E96',
  error: '#FCA5A5',
  warning: '#F59E0B',
  success: '#22B573',
};

const BORDER_WIDTH = 0.5;

export default function MuhasebecimScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // State for toggling between steps
  const [step, setStep] = useState('initial');
  const [accountantCode, setAccountantCode] = useState('');
  const [firm, setFirm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    checkConnection();
    // Müşavir isteği kabul/ret ettiğinde ya da bağlantıyı kestiğinde ekran kendiliğinden güncellenir.
    // RLS: işletme yalnız kendi bağlantı olaylarını alır.
    const { supabase } = require('../../../../shared');
    const channel = supabase
      .channel('my-accountant-connection')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accountant_taxpayer_links' }, () => {
        checkConnection();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkConnection = async () => {
    try {
      const { supabase } = require('../../../../shared');
      const { data, error } = await supabase.rpc('get_my_accountant_connection');
      if (error) throw error;
      
      if (data?.status === 'active') {
        setFirm({ name: data.firm_name, connected_at: data.connected_at });
        setStep('connected');
      } else if (data?.status === 'pending_confirmation') {
        setFirm({ name: data.firm_name, requested_at: data.requested_at });
        setStep('pending_confirmation');
      } else {
        setFirm(null);
        setStep('initial');
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (accountantCode.trim().length > 0) {
      setIsLoading(true);
      try {
        const { supabase } = require('../../../../shared');
        const { data, error } = await supabase.rpc('resolve_accountant_code', { input_code: accountantCode.trim() });
        
        if (error) throw error;
        if (data?.status === 'SUCCESS') {
          setFirm({ name: data.firm_name });
          setStep('verified');
        } else if (data?.status === 'CODE_NOT_FOUND') {
          Alert.alert('', t('muhasebecimScreen.codeNotFound'));
        } else {
          Alert.alert('', t('muhasebecimScreen.actionError'));
        }
      } catch {
        Alert.alert('', t('muhasebecimScreen.actionError'));
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert(t('muhasebecimScreen.alerts.invalidCodeTitle'), t('muhasebecimScreen.alerts.invalidCodeMessage'));
    }
  };

  const handleConnectFinal = async () => {
    setIsLoading(true);
    try {
      const { supabase } = require('../../../../shared');
      const { data, error } = await supabase.rpc('request_accountant_connection', { p_code: accountantCode.trim() });
      if (error) throw error;

      if (data?.status === 'SUCCESS' || data?.status === 'REQUEST_PENDING') {
        setStep('pending_confirmation');
      } else if (data?.status === 'ALREADY_CONNECTED') {
        Alert.alert('', t('muhasebecimScreen.alreadyConnected'));
        checkConnection();
      } else if (data?.status === 'CODE_NOT_FOUND') {
        Alert.alert('', t('muhasebecimScreen.codeNotFound'));
      } else {
        Alert.alert('', t('muhasebecimScreen.actionError'));
      }
    } catch {
      Alert.alert('', t('muhasebecimScreen.actionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsLoading(true);
    try {
      const { supabase } = require('../../../../shared');
      const { data, error } = await supabase.rpc('cancel_accountant_request');
      if (error) throw error;
      checkConnection();
    } catch {
      Alert.alert('', t('muhasebecimScreen.actionError'));
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      t('muhasebecimScreen.disconnect'),
      t('muhasebecimScreen.disconnectConfirm', { firm: firm?.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('muhasebecimScreen.disconnect'), 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { supabase } = require('../../../../shared');
              const { error } = await supabase.rpc('disconnect_current_accountant', { p_reason: 'User request' });
              if (error) throw error;
              checkConnection();
            } catch {
              Alert.alert('', t('muhasebecimScreen.actionError'));
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderUnconnectedState = () => {
    if (step === 'pending_confirmation') {
      return (
        <View style={styles.stateContainer}>
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <MaterialIcons name="hourglass-empty" size={48} color={COLORS.warning} style={{ marginBottom: 16 }} />
            <Text style={[styles.headerTitle, { textAlign: 'center' }]}>{t('muhasebecimScreen.pendingTitle')}</Text>
            <Text style={[styles.headerSubtitle, { textAlign: 'center', marginTop: 8 }]}>
              {t('muhasebecimScreen.pendingDescription', { firm: firm?.name })}
            </Text>
            <TouchableOpacity style={[styles.primaryButton, { marginTop: 24, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.error }]} onPress={handleCancelRequest} disabled={isLoading}>
              <Text style={[styles.primaryButtonText, { color: COLORS.error }]}>{isLoading ? '...' : t('muhasebecimScreen.cancelRequest')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <Text style={styles.headerTitle}>{t('muhasebecimScreen.unconnected.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('muhasebecimScreen.unconnected.subtitle')}
        </Text>
  
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="vpn-key" size={20} color={COLORS.accent} />
            <Text style={styles.cardTitle}>{t('muhasebecimScreen.unconnected.enterCode.cardTitle')}</Text>
          </View>
          <Text style={styles.cardDesc}>
            {t('muhasebecimScreen.unconnected.enterCode.cardDesc')}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, step === 'verified' && { opacity: 0.5 }]}
              placeholder={t('muhasebecimScreen.unconnected.enterCode.placeholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={accountantCode}
              onChangeText={setAccountantCode}
              autoCapitalize="characters"
              editable={step === 'initial'}
            />
            {step === 'initial' && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>{isLoading ? t('muhasebecimScreen.unconnected.enterCode.verifying') : t('muhasebecimScreen.unconnected.enterCode.verify')}</Text>
              </TouchableOpacity>
            )}
          </View>
  
          {step === 'verified' && firm && (
            <View style={styles.previewContainer}>
              <View style={styles.firmCard}>
                <View style={styles.firmHeader}>
                  <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                  <Text style={styles.firmVerifiedText}>{t('muhasebecimScreen.unconnected.preview.verifiedBadge')}</Text>
                </View>
  
                <Text style={styles.firmName}>{firm.name}</Text>
  
                <View style={styles.divider} />
  
                <Text style={styles.featuresTitle}>{t('muhasebecimScreen.unconnected.preview.featuresTitle')}</Text>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{t('muhasebecimScreen.unconnected.preview.feature1')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{t('muhasebecimScreen.unconnected.preview.feature2')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{t('muhasebecimScreen.unconnected.preview.feature3')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialIcons name="check" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{t('muhasebecimScreen.unconnected.preview.feature4')}</Text>
                </View>
  
                <TouchableOpacity style={styles.connectFinalBtn} onPress={handleConnectFinal} disabled={isLoading}>
                  <Text style={styles.connectFinalBtnText}>{isLoading ? t('muhasebecimScreen.unconnected.preview.connecting') : t('muhasebecimScreen.unconnected.preview.connect')}</Text>
                </TouchableOpacity>
              </View>
  
              <Text style={styles.legalText}>
                {t('muhasebecimScreen.unconnected.preview.legalText')}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderConnectedState = () => {
    const dateStr = firm?.connected_at ? new Date(firm.connected_at).toLocaleDateString() : '';
    return (
    <View style={styles.stateContainer}>
      <Text style={styles.headerTitle}>{t('muhasebecimScreen.screenTitle')}</Text>
      
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="business" size={28} color={COLORS.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{firm?.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{t('muhasebecimScreen.connectedSince', { date: dateStr })}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('muhasebecimScreen.connected.quickActionsTitle')}</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionBtn}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="receipt" size={24} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.quickActionText}>{t('muhasebecimScreen.connected.viewInvoices')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionBtn}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="description" size={24} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.quickActionText}>{t('muhasebecimScreen.connected.viewDocuments')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionBtn}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="chat" size={24} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.quickActionText}>{t('muhasebecimScreen.connected.sendMessage')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleDisconnect} disabled={isLoading}>
          <View style={[styles.quickActionIcon, { borderColor: 'rgba(252, 165, 165, 0.2)' }]}>
            <MaterialIcons name="link-off" size={24} color={COLORS.error} />
          </View>
          <Text style={[styles.quickActionText, { color: COLORS.error }]}>{t('muhasebecimScreen.disconnect')}</Text>
        </TouchableOpacity>
      </View>
      
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <GlobalAppBar level={2} module="finans" title={t('muhasebecimScreen.screenTitle')} showProfile={false} />
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
