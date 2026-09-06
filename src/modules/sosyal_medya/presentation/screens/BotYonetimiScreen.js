/* eslint-disable react-hooks/refs */
/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch,
  ImageBackground, 
  Image,
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalAppBar, supabase, CustomButton, CustomInput } from '../../../../shared';

import {
  ROLES,
  MOODS,
  ROLE_I18N_KEY_BY_ID,
  MOOD_I18N_KEY_BY_ID,
  usePersonaEngine,
  useSavePersona,
  usePlayground,
  getPublishedPersonas,
  getPersonaConfig,
  PersonaAvatarCard,
  DialSlider
} from '../../../persona_engine';

import { container } from '../../../../core/container';
import { ManageBotUseCase } from '@application/useCases/ManageBotUseCase';
const botUseCase = container.resolve(ManageBotUseCase);

// "Asistan çalışıyor" hissi: durum noktasının arkasında yavaşça büyüyüp
// küçülen bir nefes alma animasyonu — sadece görsel.
const BreathingDot = ({ active, children }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => { if (loop) loop.stop(); };
  }, [active]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] });

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {children}
    </Animated.View>
  );
};

export default function BotYonetimiScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();

  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom + 10, 20) + 64 + 14;
  const [rgbSpinValue] = useState(new Animated.Value(0));

  // --- Sadece görsel: ekran girişinde içerik yumuşakça belirir ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rgbSpinValue, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [rgbSpinValue]);

  const rgbSpin = rgbSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const [botActive, setBotActive] = useState(true);
  const [whatsappBotActive, setWhatsappBotActive] = useState(true);
  const [socialBotActive, setSocialBotActive] = useState(true);

  // Hook Integration
  const {
    config: promptConfig,
    setRole,
    setCustomRole,
    setPersona,
    setMood,
    resetConfig
  } = usePersonaEngine();

  const { saveConfig, isLoading: isSavingSettings } = useSavePersona();

  const [isSaveBtnActive, setIsSaveBtnActive] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [driveLink, setDriveLink] = useState('');
  const [connectedFolderId, setConnectedFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnectingFolder, setDisconnectingFolder] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

  // WAHA connection states
  const [loginMethod, setLoginMethod] = useState('qr'); // 'qr' or 'phone'
  const [wahaQrCode, setWahaQrCode] = useState(null);
  const [wahaPhone, setWahaPhone] = useState('');
  const [wahaPairingCode, setWahaPairingCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);

  // Modal visibilities
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [driveModalVisible, setDriveModalVisible] = useState(false);

  // Feature checkboxes state
  const [features, setFeatures] = useState({
    appointment: true,
    catalog: true,
    faq: false
  });

  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [appointmentModuleEnabled, setAppointmentModuleEnabled] = useState(true);

  // Karakter (Persona): artık web ile aynı kaynaktan, canlı olarak
  // ai_personas'tan çekiliyor (bkz. fetchInitialData) — eski hardcoded
  // Einstein/Shakespeare/Ramsay/Holmes listesi tamamen kaldırıldı.
  const [personas, setPersonas] = useState([]);
  const [personasLoading, setPersonasLoading] = useState(true);

  // Faz 2: Karakter Ayarları kadranları — web'in aynı initial değerleriyle
  // (50/50/50, bkz. flowweb page.tsx) başlar, sadece gerçek bir karakter
  // seçiliyken (Standart değilken) gösterilir.
  const [personaIntensity, setPersonaIntensity] = useState(50);
  const [humorLevel, setHumorLevel] = useState(50);
  const [modernAdaptation, setModernAdaptation] = useState(50);

  // Simulated Test Chat states (Powered by usePlayground Hook) — artık
  // gerçek persona-test fonksiyonunu çağırıyor, bkz. usePlayground.ts
  const { messages, chatInput, setChatInput, sendMessage, isTyping } = usePlayground(promptConfig, {
    appointmentModuleEnabled,
    personaIntensity,
    humorLevel,
    modernAdaptation,
  });
  const chatListRef = useRef(null);

  const fetchInitialData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profiles (like Google Drive details)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('google_drive_folder_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile data:', profileError);
        } else if (profileData) {
          if (profileData.google_drive_folder_id) {
            setConnectedFolderId(profileData.google_drive_folder_id);
            setDriveLink(`https://drive.google.com/drive/folders/${profileData.google_drive_folder_id}`);
          }
        }

        // Fetch WAHA settings (Prompt)
        // Fetch org settings for timezone
        const { data: orgAiSettings } = await supabase
          .from('organization_ai_settings')
          .select('timezone')
          .eq('merchant_id', session.user.id)
          .maybeSingle();

        if (orgAiSettings?.timezone) setTimezone(orgAiSettings.timezone);

        // Faz 1 (mobil-web paritesi): daha önce bu ekran kayıtlı AI Kişiliği
        // seçimini (rol/karakter/üslup/randevu modülü) HİÇBİR ZAMAN geri
        // yüklemiyordu — ekran her açılışta sıfırdan başlıyordu ve merchant
        // "Kaydet"e basmadığı sürece önceki seçimler görünmüyordu. Web'in
        // getAiPersonaSettings() ile aynı mantık burada uygulanıyor.
        const restoredConfig = await getPersonaConfig(session.user.id);
        if (restoredConfig) {
          if (restoredConfig.appointmentModuleEnabled !== undefined) {
            setAppointmentModuleEnabled(restoredConfig.appointmentModuleEnabled);
          }
          if (restoredConfig.businessRole) {
            if (ROLES.some(r => r.id === restoredConfig.businessRole)) {
              setRole(restoredConfig.businessRole);
            } else {
              // Web'deki 15 sabit rolden biri değil: merchant mobildeki
              // "Diğer" (custom) seçeneğiyle serbest metin girmiş demektir.
              setCustomRole(restoredConfig.businessRole);
            }
          }
          if (restoredConfig.tone) setMood(restoredConfig.tone);
          if (restoredConfig.personaSlug) setPersona(restoredConfig.personaSlug);
          // Faz 2: kayıtlı kadran değerlerini geri yükle.
          if (restoredConfig.personaIntensity !== undefined) setPersonaIntensity(restoredConfig.personaIntensity);
          if (restoredConfig.humorLevel !== undefined) setHumorLevel(restoredConfig.humorLevel);
          if (restoredConfig.modernAdaptation !== undefined) setModernAdaptation(restoredConfig.modernAdaptation);
        }

        // Karakter (Persona) listesi: artık web ile aynı kaynaktan, canlı
        // olarak ai_personas'tan çekiliyor (eski hardcoded liste kaldırıldı).
        const publishedPersonas = await getPublishedPersonas();
        setPersonas(publishedPersonas);
        setPersonasLoading(false);

        const { data: botSettingsData, error: botSettingsError } = await botUseCase.getSettings(session.user.id);
        if (!botSettingsError && botSettingsData) {
          const fullPrompt = botSettingsData.system_prompt || '';
          setBotActive(botSettingsData.is_active !== false);
          setWhatsappBotActive(botSettingsData.whatsapp_bot_active !== false);
          setSocialBotActive(botSettingsData.social_bot_active !== false);
          
          if (fullPrompt.trim().length > 0) {
            setIsEditing(false); // Default to locked if we have data
          }
        }

        // Check WAHA status
        const statusRes = await botUseCase.getSessionStatus(session.user.id);
        if (statusRes.data && statusRes.data.status === 'WORKING') {
          setIsWhatsAppConnected(true);
          if (statusRes.data.me && statusRes.data.me.id) {
            setWahaPhone(statusRes.data.me.id.split('@')[0]);
          }
        } else {
          setIsWhatsAppConnected(false);
        }
      }
    } catch (err) {
      console.error('Fetch profile data exception:', err);
    } finally {
      setLoading(false);
      setPersonasLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchInitialData();
    }, 0);
  }, []);

  const handleAutoSave = async (updates) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('organization_ai_settings')
          .update(updates)
          .eq('merchant_id', session.user.id);
      }
    } catch (e) {
      console.warn('Auto save error', e);
    }
  };

  const handleSave = async () => {
    try {
      // 1. Supabase ve Infrastructure Katmanı (Yeni Sistem)
      await saveConfig({ ...promptConfig, appointmentModuleEnabled, timezone, personaIntensity, humorLevel, modernAdaptation }, botActive, whatsappBotActive, socialBotActive);

      // 2. Yan Etkiler (Background sync ve lokal önbellek)
      if (connectedFolderId) {
        supabase.functions.invoke('drive-watch-setup', {
          body: { folderId: connectedFolderId }
        }).catch(err => console.warn('Background drive sync warning:', err));
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await AsyncStorage.setItem(`@promptConfig_${session.user.id}`, JSON.stringify(promptConfig));
        } catch (e) {
          console.warn('Could not save prompt config to storage', e);
        }
      }

      setIsSaveBtnActive(false);
      setIsEditing(false);
      
      Alert.alert(t('sosyalMedya.alerts.success'), t('sosyalMedya.alerts.settingsSaved'));
    } catch (err) {
      console.error('Error in handleSave:', err);
    }
  };

  const handleRefreshQr = async () => {
    setQrLoading(true);
    setWahaQrCode(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");
      const merchantId = session.user.id;

      await botUseCase.startSession(merchantId);
      const qrRes = await botUseCase.getQrCode(merchantId);
      if (qrRes.error) throw qrRes.error;
      
      if (qrRes.data && qrRes.data.data) {
        setWahaQrCode(qrRes.data.data);
      } else if (typeof qrRes.data === 'string') {
        setWahaQrCode(qrRes.data);
      } else {
        throw new Error("Geçersiz QR formatı");
      }
    } catch (err) {
      console.error('QR Yenileme Hatası:', err);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.qrCodeError') + ' ' + err.message);
    } finally {
      setQrLoading(false);
    }
  };

  const handleGetPairingCode = async () => {
    if (!wahaPhone.trim()) {
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.invalidPhone'));
      return;
    }
    
    setPairingLoading(true);
    setWahaPairingCode(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");
      const merchantId = session.user.id;

      await botUseCase.startSession(merchantId);
      const pairingRes = await botUseCase.getPairingCode(merchantId, wahaPhone.trim());
      if (pairingRes.error) throw pairingRes.error;

      if (pairingRes.data && pairingRes.data.code) {
        setWahaPairingCode(pairingRes.data.code);
      } else {
        throw new Error("Geçersiz eşleşme kodu formatı");
      }
    } catch (err) {
      console.error('Eşleşme Kodu Hatası:', err);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.pairingCodeError') + ' ' + err.message);
    } finally {
      setPairingLoading(false);
    }
  };

  const extractFolderId = (url) => {
    if (!url) return null;
    const foldersMatch = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (foldersMatch && foldersMatch[1]) return foldersMatch[1];
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) return idMatch[1];
    if (/^[a-zA-Z0-9-_]+$/.test(url)) return url;
    return null;
  };

  const handleSyncFolder = async () => {
    if (!driveLink.trim()) {
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.invalidDriveLink'));
      return;
    }

    const folderId = extractFolderId(driveLink.trim());
    if (!folderId) {
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.invalidDriveId'));
      return;
    }

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('drive-watch-setup', {
        body: { folderId }
      });

      if (error) throw new Error(error.message || 'Bilinmeyen bir hata oluştu');
      if (data && data.error) throw new Error(data.error);

      setConnectedFolderId(folderId);
      setDriveModalVisible(false);
      Alert.alert(t('sosyalMedya.alerts.success'), t('sosyalMedya.alerts.driveConnected'));
    } catch (err) {
      console.error('Error saving folder ID:', err);
      Alert.alert(t('sosyalMedya.alerts.accessError'), err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectFolder = async () => {
    setDisconnectingFolder(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('profiles')
          .update({ google_drive_folder_id: null })
          .eq('id', session.user.id);

        if (error) throw error;

        setConnectedFolderId(null);
        setDriveLink('');
        setDriveModalVisible(false);
        Alert.alert(t('sosyalMedya.alerts.disconnectedTitle'), t('sosyalMedya.alerts.driveDisconnected'));
      }
    } catch (err) {
      console.error('Error disconnecting folder:', err);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.disconnectError') + ' ' + err.message);
    } finally {
      setDisconnectingFolder(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 bg-[#201D24]">
        <ImageBackground 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(19, 19, 21, 0.92)' }]} />
        </ImageBackground>
        
        <GlobalAppBar level={2} module="ai" title="Ai Asistan" showProfile={true} />
        
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22B573" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView 
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 130 }}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* SECTION 1: AI Status (Always Visible) */}
              <View style={styles.statusHeroCard}>
                  {/* Platform Toggles */}
                  <View style={[styles.statusSubRow, { marginTop: 0 }]}>
                      <View className="flex-row items-center flex-1">
                        <View style={styles.statusSubIconWrapper}>
                          <Ionicons name="logo-whatsapp" size={16} color={whatsappBotActive ? "#25D366" : "#756D66"} />
                        </View>
                        <Text className="text-white text-xs font-semibold ml-2">WhatsApp Asistanı</Text>
                        <Switch
                          value={whatsappBotActive}
                          onValueChange={(val) => { setWhatsappBotActive(val); setIsSaveBtnActive(true); setIsEditing(true); }}
                          trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(37, 211, 102, 0.4)' }}
                          thumbColor={whatsappBotActive ? '#25D366' : '#ffffff'}
                          style={{ marginLeft: 'auto' }}
                        />
                      </View>
                    </View>
              </View>

              {/* YENİ EKLENEN BASİT ALAN: Asistan Talimatı Oluştur */}
              <View className="mb-4 mt-2 px-1">
                <Text className="text-white text-sm font-bold mb-2">Asistan Talimatı Oluştur</Text>
                <View className="bg-black/20 border border-white/5 rounded-xl p-3">
                  <TextInput
                    value={promptConfig.roleId === 'custom' ? promptConfig.customRoleText : ''}
                    onChangeText={(text) => { 
                      setCustomRole(text); 
                      setIsSaveBtnActive(true); 
                    }}
                    placeholder="Örn: Sen bir berber dükkanı asistanısın, fiyat bilgisi verip randevu alırsın..."
                    placeholderTextColor="#A79E96"
                    multiline
                    style={{ color: '#F6F1EC', fontSize: 13, minHeight: 60, textAlignVertical: 'top' }}
                  />
                </View>
              </View>

              <View>
                
                {/* SECTION 5: Integrations (Google Drive & WhatsApp ONLY) - Moved to top */}
                <View style={styles.glassCard} className="p-4 mb-4 mt-2">
                  <Text className="text-white text-sm font-bold mb-3">Bağlı Servisler</Text>
                  
                  {/* Google Drive Compact Item */}
                  <View className="flex-row items-center justify-between mb-3 bg-black/20 p-3 rounded-xl border border-white/5">
                     <View className="flex-row items-center gap-3">
                       <Ionicons name="logo-google" size={20} color={connectedFolderId ? "#22B573" : "#A79E96"} />
                       <View>
                         <Text className="text-xs font-semibold text-white">Google Drive (Bilgi Bankası)</Text>
                         <Text className="text-[10px] text-gray-400">{connectedFolderId ? '🟢 Bağlı ve güncel' : '🔴 Bağlı değil'}</Text>
                       </View>
                     </View>
                     <TouchableOpacity onPress={() => setDriveModalVisible(true)} className="bg-white/10 px-4 py-1.5 rounded-full">
                       <Text className="text-white text-[10px] font-bold">{connectedFolderId ? 'Yönet' : 'Bağla'}</Text>
                     </TouchableOpacity>
                  </View>

                  {/* WhatsApp Compact Item */}
                  <View className="flex-row items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                     <View className="flex-row items-center gap-3">
                       <Ionicons name="logo-whatsapp" size={20} color={isWhatsAppConnected ? "#25D366" : "#A79E96"} />
                       <View>
                         <Text className="text-xs font-semibold text-white">WhatsApp</Text>
                         <Text className="text-[10px] text-gray-400">{isWhatsAppConnected ? '🟢 Asistan aktif' : '🔴 Bağlı değil'}</Text>
                       </View>
                     </View>
                     <TouchableOpacity onPress={() => { setWhatsappModalVisible(true); if(!isWhatsAppConnected) handleRefreshQr(); }} className="bg-white/10 px-4 py-1.5 rounded-full">
                       <Text className="text-white text-[10px] font-bold">{isWhatsAppConnected ? 'Yönet' : 'Bağla'}</Text>
                     </TouchableOpacity>
                  </View>
                </View>

                {/* SECTION 2: AI Personality */}
                <View style={{
                  overflow: 'hidden',
                  padding: 2, 
                  borderRadius: 20,
                  marginBottom: 16,
                  shadowColor: '#FF7A59',
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 10,
                }}>
                  <Animated.View style={{ 
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: 1500, height: 1500,
                    marginTop: -750, marginLeft: -750,
                    transform: [{ rotate: rgbSpin }],
                  }}>
                    <LinearGradient
                      colors={['#22B573', '#FF7A59', '#C2478D', '#FF7A59', '#22B573']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>

                  <View style={{ backgroundColor: '#2A2631', borderRadius: 16 }} className="p-4">
                    <Text className="text-white text-sm font-bold mb-3">{t('personas.title')}</Text>

                  {/* 1. 👔 Roller (Sektör) — Faz 2: web'deki gibi portre kart
                      carousel'i (PersonaAvatarCard), eski pill/chip yerine.
                      i18n Faz 2: `label` artık role.title (Türkçe sabit) değil,
                      ROLE_I18N_KEY_BY_ID ile personas.roles.* çevirisinden
                      üretiliyor — role.id hiç değişmiyor (bkz. roles.ts notu). */}
                  <View className="mb-4">
                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">{t('personas.businessRole')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {ROLES.map(role => (
                        <PersonaAvatarCard
                          key={role.id}
                          label={t(`personas.roles.${ROLE_I18N_KEY_BY_ID[role.id]}`)}
                          icon={role.icon}
                          avatarUrl={role.avatarUrl}
                          accentColor="#FF7A59"
                          selected={promptConfig.roleId === role.id}
                          onPress={() => { setRole(role.id); setIsSaveBtnActive(true); }}
                        />
                      ))}
                      {/* Diğer (Custom Role) kartı — görseli yok, sadece emoji */}
                      <PersonaAvatarCard
                        label={t('personas.otherRole')}
                        icon="✨"
                        accentColor="#FF7A59"
                        selected={promptConfig.roleId === 'custom'}
                        onPress={() => { setRole('custom'); setIsSaveBtnActive(true); }}
                      />
                    </ScrollView>
                  </View>

                  {/* Custom Role Input (Conditionally Rendered) */}
                  {promptConfig.roleId === 'custom' && (
                    <View className="bg-black/40 border border-white/5 rounded-xl p-2 mb-4">
                      <TextInput
                        value={promptConfig.customRoleText}
                        onChangeText={(text) => { setCustomRole(text); setIsSaveBtnActive(true); }}
                        placeholder={t('personas.customRolePlaceholder')}
                        placeholderTextColor="#A79E96"
                        style={{ color: '#F6F1EC', fontSize: 12, paddingVertical: 4, paddingHorizontal: 8 }}
                      />
                    </View>
                  )}

                  {/* 2. 🧠 Personalar (Karakter) — artık web ile aynı kaynaktan
                      (ai_personas) canlı çekiliyor. "Standart" kartı web'deki
                      gibi DB'ye bağlı olmayan, sabit/senkron bir kart:
                      promptConfig.personaId boşsa (kayıtlı persona yoksa)
                      seçili görünür. */}
                  <View className="mb-4">
                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">{t('personas.character')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <PersonaAvatarCard
                        label={t('personas.standardLabel')}
                        icon="🤖"
                        accentColor="#C2478D"
                        selected={!promptConfig.personaId}
                        onPress={() => { setPersona(''); setIsSaveBtnActive(true); }}
                      />

                      {personasLoading && (
                        <Text className="text-[11px] text-gray-400 self-center px-2">{t('personas.loading')}</Text>
                      )}

                      {!personasLoading && personas.length === 0 && (
                        <Text className="text-[11px] text-gray-400 self-center px-2">{t('personas.empty')}</Text>
                      )}

                      {personas.map(persona => (
                        <PersonaAvatarCard
                          key={persona.slug}
                          label={persona.name}
                          icon={persona.icon}
                          avatarUrl={persona.avatarUrl}
                          accentColor="#C2478D"
                          selected={promptConfig.personaId === persona.slug}
                          onPress={() => { setPersona(persona.slug); setIsSaveBtnActive(true); }}
                        />
                      ))}
                    </ScrollView>
                  </View>

                  {/* 3. 🎭 Mood / Üslup — i18n Faz 2: `label` artık mood.title
                      değil, MOOD_I18N_KEY_BY_ID ile personas.tones.*
                      çevirisinden üretiliyor — mood.id hiç değişmiyor. */}
                  <View style={{ marginBottom: promptConfig.personaId ? 16 : 0 }}>
                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">{t('personas.tone')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {MOODS.map(mood => (
                        <PersonaAvatarCard
                          key={mood.id}
                          label={t(`personas.tones.${MOOD_I18N_KEY_BY_ID[mood.id]}`)}
                          icon={mood.icon}
                          avatarUrl={mood.avatarUrl}
                          accentColor="#F59E0B"
                          selected={promptConfig.moodId === mood.id}
                          onPress={() => { setMood(mood.id); setIsSaveBtnActive(true); }}
                        />
                      ))}
                    </ScrollView>
                  </View>

                  {/* 4. 🎚️ Karakter Ayarları (kadranlar) — web'deki showDials
                      mantığıyla birebir aynı: sadece gerçek bir karakter
                      seçiliyken (Standart değilken) görünür. Faz 2'de eklendi;
                      daha önce mobilde bu üç kadran hiç yoktu. */}
                  {!!promptConfig.personaId && (
                    <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                      <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-3">{t('personas.characterSettings')}</Text>
                      <DialSlider
                        label={t('personas.sliders.characterIntensity')}
                        value={personaIntensity}
                        onChange={(v) => { setPersonaIntensity(v); setIsSaveBtnActive(true); }}
                        accentColor="#C2478D"
                      />
                      <DialSlider
                        label={t('personas.sliders.humorLevel')}
                        value={humorLevel}
                        onChange={(v) => { setHumorLevel(v); setIsSaveBtnActive(true); }}
                        accentColor="#F59E0B"
                      />
                      <DialSlider
                        label={t('personas.sliders.modernAdaptation')}
                        value={modernAdaptation}
                        onChange={(v) => { setModernAdaptation(v); setIsSaveBtnActive(true); }}
                        accentColor="#22B573"
                      />
                    </View>
                  )}
                </View>
                </View>

                {/* SECTION 4: "İleri Seviye Ayarlar" paneli kaldırıldı ("Tek Yapı"
                    refactor, Eylül 2026) — burada gösterilen "AI Karakter
                    Talimatı (Prompt)" client-side hesaplanan bir önizlemeydi ve
                    gerçek müşteri botuna hiç ulaşmıyordu (bkz. persona_engine/
                    index.ts üst notu). Kültürel/dil adaptasyonu artık burada
                    yapılandırılabilir bir ayar değil — sunucu tarafında (ledger
                    reposu, PromptBuilder.ts → SYSTEM_POLICY madde 1) her
                    merchant için sabit ve kapatılamaz şekilde gömülü. */}

                {/* SECTION 4.5: Timezone and Appointment (Moved outside) */}
                <View style={styles.glassCard} className="p-4 mb-4">
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-1 pr-2">
                      <Text className="text-white text-sm font-bold mb-1">Randevu / Rezervasyon Özelliği</Text>
                      <Text className="text-gray-400 text-[10px] leading-3">Kapatırsanız AI randevu almaya çalışmaz, sadece bilgi verir.</Text>
                    </View>
                    <Switch
                      value={appointmentModuleEnabled}
                      onValueChange={(val) => { setAppointmentModuleEnabled(val); handleAutoSave({ appointment_module_enabled: val }); }}
                      trackColor={{ false: '#34303C', true: '#22B573' }}
                      thumbColor="#ffffff"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center border-t border-white/5 pt-4">
                    <View className="flex-1 mr-4">
                      <Text className="text-white text-sm font-bold mb-1">Saat Dilimi (Timezone)</Text>
                      <Text className="text-gray-400 text-[10px] leading-3">Örn: Europe/Istanbul</Text>
                    </View>
                    <View className="bg-white/5 border border-white/10 rounded-lg overflow-hidden" style={{ width: 140 }}>
                      <TextInput
                        value={timezone}
                        onChangeText={(val) => setTimezone(val)}
                        onEndEditing={(e) => handleAutoSave({ timezone: e.nativeEvent.text })}
                        className="text-white text-xs px-2 py-2 text-center"
                      />
                    </View>
                  </View>
                </View>

                {/* INLINE SAVE BUTTON */}
                {isSaveBtnActive && (
                  <Animated.View style={{ 
                    marginBottom: 16,
                    shadowColor: '#22B573',
                    shadowOpacity: 0.35,
                    shadowRadius: 15,
                    elevation: 10
                  }}>
                    <CustomButton
                      title="Değişiklikleri Kaydet"
                      onPress={handleSave}
                      isLoading={isSavingSettings}
                      leftIcon={<Ionicons name="save-outline" size={18} color="#1C3327" />}
                      className="w-full bg-[#22B573]"
                      textClassName="text-[#1C3327] font-bold text-sm"
                    />
                  </Animated.View>
                )}

                {/* SECTION 3: Live AI Preview */}
                <View style={styles.glassCard} className="mb-4 overflow-hidden">
                  <View className="p-4 border-b border-white/5 flex-row justify-between items-center bg-white/2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#22B573" />
                      <Text className="text-sm font-semibold text-white">Canlı Test</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-1.5 h-1.5 rounded-full bg-[#22B573]" />
                      <Text className="text-[9px] text-[#22B573] font-bold uppercase tracking-wider">SİMÜLASYON</Text>
                    </View>
                  </View>

                  {/* Chat Simulator View */}
                  <View className="p-4 bg-black/20" style={{ height: 260 }}>
                    <ScrollView 
                      ref={chatListRef}
                      nestedScrollEnabled={true}
                      onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingBottom: 10 }}
                    >
                      {messages.length === 0 && (
                        <View>
                          <View className="items-center mb-6 mt-2">
                            <Text className="text-[#A79E96]/50 text-[9px] font-bold tracking-widest uppercase">
                              SİMÜLASYON BAŞLADI
                            </Text>
                          </View>
                          
                          <View className="flex-row justify-end mb-3">
                            <View 
                              style={{
                                backgroundColor: 'rgba(34, 181, 115, 0.15)',
                                borderWidth: 1,
                                borderColor: 'rgba(34, 181, 115, 0.3)',
                                borderRadius: 16,
                                padding: 10,
                                maxWidth: '85%'
                              }}
                            >
                              <Text style={{ color: '#F6F1EC', fontSize: 11 }}>
                                Merhaba, stoklarınızda mavi renk M beden kışlık mont var mı? Fiyatı nedir?
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row justify-start mb-3">
                            <View className="w-7 h-7 rounded-full bg-[#C2478D]/20 items-center justify-center mr-2 flex-shrink-0 border border-[#C2478D]/30">
                              <Ionicons name="sparkles" size={12} color="#E8A8CD" />
                            </View>
                            <View 
                              style={{
                                backgroundColor: 'rgba(32, 31, 34, 0.9)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 16,
                                padding: 10,
                                maxWidth: '85%'
                              }}
                            >
                              <Text style={{ color: '#F6F1EC', fontSize: 11, lineHeight: 16 }}>
                                Merhaba! 👋 Evet, mavi renk M beden kışlık montumuz stoklarımızda mevcuttur. Güncel fiyatımız 1.450 TL'dir. Hemen sipariş oluşturmak isterseniz size bir bağlantı gönderebilirim. Başka yardımcı olabileceğim bir konu var mı?
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {messages.map((item) => (
                        <View key={item.id} className={`flex-row ${item.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                          {item.sender === 'bot' && (
                            <View className="w-7 h-7 rounded-full bg-[#C2478D]/20 items-center justify-center mr-2 flex-shrink-0 border border-[#C2478D]/30">
                              <Ionicons name="sparkles" size={12} color="#E8A8CD" />
                            </View>
                          )}
                          <View 
                            style={{
                              backgroundColor: item.sender === 'user' ? 'rgba(34, 181, 115, 0.15)' : 'rgba(32, 31, 34, 0.9)',
                              borderWidth: 1,
                              borderColor: item.sender === 'user' ? 'rgba(34, 181, 115, 0.3)' : 'rgba(194, 71, 141, 0.3)',
                              borderRadius: 16,
                              borderTopRightRadius: item.sender === 'user' ? 2 : 14,
                              borderTopLeftRadius: item.sender === 'bot' ? 2 : 14,
                              padding: 10,
                              maxWidth: '75%',
                              shadowColor: item.sender === 'bot' ? '#C2478D' : 'transparent',
                              shadowOpacity: 0.2,
                              shadowRadius: 5,
                              elevation: item.sender === 'bot' ? 3 : 0
                            }}
                          >
                            <Text style={{ color: item.sender === 'bot' ? '#E8A8CD' : '#F6F1EC', fontSize: 12, lineHeight: 16 }}>{item.text}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                    
                    {isTyping && (
                      <View className="flex-row justify-start mb-3 items-center">
                        <View className="w-7 h-7 rounded-full bg-[#C2478D]/20 items-center justify-center mr-2 border border-[#C2478D]/30">
                          <Ionicons name="sparkles" size={12} color="#E8A8CD" />
                        </View>
                        <ActivityIndicator size="small" color="#C2478D" style={{ marginLeft: 6 }} />
                      </View>
                    )}

                    {/* Input Bar */}
                    <View className="relative mt-2">
                      <TextInput
                        value={chatInput}
                        onChangeText={setChatInput}
                        placeholder="Test mesajı gönder..."
                        placeholderTextColor="#A79E96"
                        onSubmitEditing={() => sendMessage(chatInput)}
                        style={{
                          backgroundColor: 'rgba(32, 31, 34, 0.8)',
                          borderColor: 'rgba(255, 255, 255, 0.05)',
                          borderWidth: 1,
                          borderRadius: 20,
                          paddingLeft: 16,
                          paddingRight: 40,
                          paddingVertical: 8,
                          color: '#fff',
                          fontSize: 12
                        }}
                      />
                      <TouchableOpacity 
                        onPress={() => sendMessage(chatInput)}
                        style={{ position: 'absolute', right: 8, top: 6 }}
                      >
                        <Ionicons name="send" size={18} color="#22B573" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* SECTION 7: Business Modules */}
                <View style={styles.glassCard} className="p-4 mb-4">
                  <View className="space-y-3">
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('RandevuMain')}
                      style={{ backgroundColor: 'rgba(34, 181, 115, 0.1)', borderColor: 'rgba(34, 181, 115, 0.3)', borderWidth: 1 }}
                      className="flex-row items-center justify-between p-3.5 rounded-xl mb-3"
                    >
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="calendar-outline" size={18} color="#22B573" />
                        <Text className="text-xs text-[#22B573] font-semibold">Ai Randevu Yönetimi</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#22B573" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => navigation.navigate('HizmetAyarlari')}
                      style={{ backgroundColor: 'rgba(0, 162, 255, 0.1)', borderColor: 'rgba(0, 162, 255, 0.3)', borderWidth: 1 }}
                      className="flex-row items-center justify-between p-3.5 rounded-xl mb-3"
                    >
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="briefcase-outline" size={18} color="#FF7A59" />
                        <Text className="text-xs text-[#FF7A59] font-semibold">Ai İşletme Hizmetleri</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#FF7A59" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Musteriler')}
                      style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', borderWidth: 1 }}
                      className="flex-row items-center justify-between p-3.5 rounded-xl"
                    >
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="people-outline" size={18} color="#a855f7" />
                        <Text className="text-xs text-[#a855f7] font-semibold">Müşteriler</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#a855f7" />
                    </TouchableOpacity>
                  </View>
                </View>

              </View>

              </Animated.View>
            </ScrollView>

            {/* FLOATING SAVE BUTTON MOVED INLINE */}
          </View>
        )}

        {/* WhatsApp Entegrasyon Modalı */}
        <Modal
          visible={whatsappModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setWhatsappModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent} className="bg-[#2A2631] border border-white/10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-bold text-white">WhatsApp Bağlantısı</Text>
                <TouchableOpacity onPress={() => setWhatsappModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {isWhatsAppConnected ? (
                <View className="items-center py-4">
                  <View className="w-16 h-16 bg-[#25D366]/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="checkmark-circle" size={40} color="#25D366" />
                  </View>
                  <Text className="text-white font-semibold text-sm mb-1">Asistan WhatsApp&apos;a Bağlı</Text>
                  {wahaPhone ? <Text className="text-gray-400 text-xs mb-6">Telefon: +{wahaPhone}</Text> : null}

                  <CustomButton
                    title="Bağlantıyı Kes"
                    onPress={async () => {
                      Alert.alert('Bağlantıyı Kes', 'Bağlantıyı kesmek istediğinize emin misiniz?', [
                        { text: 'Vazgeç' },
                        { 
                          text: 'Bağlantıyı Kes', 
                          onPress: async () => {
                            setQrLoading(true);
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              if (session) {
                                await botUseCase.stopSession(session.user.id);
                                setIsWhatsAppConnected(false);
                                setWahaQrCode(null);
                                setWahaPairingCode(null);
                                setWhatsappModalVisible(false);
                                Alert.alert('Bağlantı Kesildi', 'WhatsApp bağlantınız kaldırıldı.');
                              }
                            } catch (e) {
                              console.error(e);
                              Alert.alert('Hata', 'Bağlantı kesilirken bir sorun oluştu. Lütfen tekrar deneyin.');
                            } finally {
                              setQrLoading(false);
                            }
                          } 
                        }
                      ]);
                    }}
                    className="w-full bg-red-500/10 border border-red-500/40"
                    textClassName="text-red-500 font-bold"
                  />
                </View>
              ) : (
                <ScrollView>
                  <View className="flex-row bg-white/5 p-1 rounded-xl mb-4">
                    <TouchableOpacity 
                      onPress={() => setLoginMethod('qr')}
                      style={{ flex: 1, backgroundColor: loginMethod === 'qr' ? 'rgba(34, 181, 115, 0.15)' : 'transparent' }}
                      className="py-2 rounded-lg items-center"
                    >
                      <Text className="text-white text-xs font-semibold">QR Kod</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setLoginMethod('phone')}
                      style={{ flex: 1, backgroundColor: loginMethod === 'phone' ? 'rgba(34, 181, 115, 0.15)' : 'transparent' }}
                      className="py-2 rounded-lg items-center"
                    >
                      <Text className="text-white text-xs font-semibold">Telefon İle Bağlan</Text>
                    </TouchableOpacity>
                  </View>

                  {loginMethod === 'qr' ? (
                    <View className="items-center py-2">
                      <View className="w-44 h-44 bg-white rounded-xl items-center justify-center mb-4 overflow-hidden p-2">
                        {wahaQrCode ? (
                          <ImageBackground 
                            source={{ uri: wahaQrCode.startsWith('data:image') ? wahaQrCode : `data:image/png;base64,${wahaQrCode}` }} 
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View className="items-center justify-center">
                            <ActivityIndicator size="small" color="#22B573" />
                            <Text className="text-black text-[10px] font-semibold mt-2">QR Kod Bekleniyor...</Text>
                          </View>
                        )}
                      </View>

                      <CustomButton
                        title="QR Kodu Yenile"
                        onPress={handleRefreshQr}
                        isLoading={qrLoading}
                        leftIcon={<Ionicons name="refresh" size={16} color="#1C3327" />}
                        className="w-full mb-2"
                        textClassName="text-[#1C3327] font-bold"
                      />
                    </View>
                  ) : (
                    <View className="py-2">
                      <CustomInput
                        value={wahaPhone}
                        onChangeText={setWahaPhone}
                        placeholder="Telefon numarası"
                        keyboardType="phone-pad"
                        leftIcon={<Ionicons name="call-outline" size={18} color="#22B573" />}
                        containerClassName="mb-3"
                      />

                      <CustomButton
                        title="Eşleşme Kodu Al"
                        onPress={handleGetPairingCode}
                        isLoading={pairingLoading}
                        leftIcon={<Ionicons name="key-outline" size={16} color="#1C3327" />}
                        className="w-full mb-4"
                        textClassName="text-[#1C3327] font-bold"
                      />

                      {wahaPairingCode && (
                        <View className="bg-black/40 border border-[#22B573]/30 rounded-xl p-4 items-center justify-center mb-4">
                          <Text className="text-gray-400 text-[10px] mb-1">Eşleşme Kodunuz</Text>
                          <Text className="text-[#22B573] text-2xl font-bold tracking-widest">{wahaPairingCode}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Google Drive Wizard Modalı */}
        <Modal
          visible={driveModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDriveModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent} className="bg-[#2A2631] border border-white/10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-bold text-white">Bilgi Bankası (Google Drive)</Text>
                <TouchableOpacity onPress={() => setDriveModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View className="bg-white/5 rounded-xl p-3 mb-4">
                  <Text className="text-gray-300 text-xs leading-5 mb-2">
                    Google Drive klasörünüzü bağlamak için aşağıdaki servis e-postasını klasörünüze &apos;Görüntüleyen&apos; olarak ekleyin:
                  </Text>
                  <Text selectable={true} className="text-[#22B573] font-medium text-xs bg-black/40 p-2 rounded-lg mb-3 text-center">
                    esnaf-drive-bot@gen-lang-client-0889039852.iam.gserviceaccount.com
                  </Text>
                  <Text className="text-gray-300 text-xs">
                    Ardından klasör linkini aşağıya yapıştırın.
                  </Text>
                </View>

                <CustomInput
                  value={driveLink}
                  onChangeText={setDriveLink}
                  placeholder="Google Drive Klasör Linki"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={<Ionicons name="logo-google" size={18} color="#22B573" />}
                  containerClassName="mb-4"
                />

                <View className="flex-row gap-2">
                  {connectedFolderId && (
                    <TouchableOpacity 
                      onPress={handleDisconnectFolder}
                      disabled={disconnectingFolder}
                      className="flex-1 bg-red-500/10 border border-red-500/40 py-3 rounded-xl items-center"
                    >
                      <Text className="text-red-400 text-xs font-bold">Bağlantıyı Kes</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={handleSyncFolder}
                    disabled={syncing}
                    style={{ flex: 2 }}
                    className="bg-[#22B573] py-3 rounded-xl items-center justify-center"
                  >
                    {syncing ? (
                      <ActivityIndicator size="small" color="#1C3327" />
                    ) : (
                      <Text className="text-[#1C3327] text-xs font-bold">Bağla ve Senkronize Et</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  statusHeroCard: {
    backgroundColor: 'rgba(42, 38, 49, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.25)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    color: '#F6F1EC',
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: '#A79E96',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 16,
    marginTop: 14,
  },
  statusSubIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(32, 31, 34, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.2)',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  glowBorderCyanThick: {
    backgroundColor: '#2A2631', // Solid opaque dark grey to prevent Android elevation shadow bleed-through
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF7A59',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
  pulseGlow: {
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  }
});
