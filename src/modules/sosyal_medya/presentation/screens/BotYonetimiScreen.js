/* eslint-disable react-hooks/refs */
/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, ImageBackground, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalAppBar, supabase } from '../../../../shared';
import { getCurrentOrgId } from '../../../../lib/org';

import { ROLES, usePersonaEngine, useSavePersona, usePlayground, getPublishedPersonas, getPersonaConfig } from '../../../persona_engine';

import { container } from '../../../../core/container';
import { ManageBotUseCase } from '@application/useCases/ManageBotUseCase';
import { BotStatusHero } from './botyonetimi/BotStatusHero';
import { AssistantInstructionBox } from './botyonetimi/AssistantInstructionBox';
import { IntegrationsCard } from './botyonetimi/IntegrationsCard';
import { AiPersonalitySection } from './botyonetimi/AiPersonalitySection';
import { TimezoneAppointmentCard } from './botyonetimi/TimezoneAppointmentCard';
import { SaveButtonInline } from './botyonetimi/SaveButtonInline';
import { LivePreviewSection } from './botyonetimi/LivePreviewSection';
import { BusinessModulesCard } from './botyonetimi/BusinessModulesCard';
import { DangerZoneSection } from './botyonetimi/DangerZoneSection';
import { WhatsAppModal } from './botyonetimi/WhatsAppModal';
import { DriveModal } from './botyonetimi/DriveModal';
import { DangerModal } from './botyonetimi/DangerModal';
const botUseCase = container.resolve(ManageBotUseCase);

// Not: 'SIFIRLA' onay kelimesi iş mantığında sabit bir değer olarak kullanıldığından
// KASITLI OLARAK çevrilmez — web versiyonundaki (AiDataResetPanel.tsx) davranışla birebir aynı.
const RESET_CONFIRM_WORD = 'SIFIRLA';

export default function BotYonetimiScreen() {
  const { t } = useTranslation();

  // Kullanıcının eklediği işletme rolleri (custom_business_roles; kimlik RLS ile çözülür, istemci göndermez)
  const [customRoles, setCustomRoles] = useState([]);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [newRoleText, setNewRoleText] = useState('');
  useEffect(() => {
    let alive = true;
    supabase.from('custom_business_roles').select('id, label').order('created_at', { ascending: true })
      .then(({ data }) => { if (alive && Array.isArray(data)) setCustomRoles(data); });
    return () => { alive = false; };
  }, []);

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
    setCustomInstruction,
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
  const [multiCalendarEnabled, setMultiCalendarEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

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
          .maybeSingle();

        if (orgAiSettings?.timezone) setTimezone(orgAiSettings.timezone);

        const { data: orgData } = await supabase
          .from('organizations')
          .select('multi_calendar_enabled')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (orgData?.multi_calendar_enabled !== undefined) {
          setMultiCalendarEnabled(orgData.multi_calendar_enabled);
        }

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
          if (restoredConfig.customInstruction) setCustomInstruction(restoredConfig.customInstruction);
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

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const handleAutoSave = async (updates) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const orgId = session ? await getCurrentOrgId(supabase) : null;
      if (orgId) {
        await supabase
          .from('organization_ai_settings')
          .update(updates)
          .eq('org_id', orgId);
      }
    } catch (e) {
      console.warn('Auto save error', e);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_reminder_settings');
        if (alive && data?.status === 'SUCCESS') setReminderEnabled(!!data.enabled);
      } catch (e) {
        console.warn('Reminder settings load error', e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleReminderSave = async (newValue) => {
    setReminderEnabled(newValue);
    try {
      const { data, error } = await supabase.rpc('set_reminder_settings', { p_enabled: newValue });
      if (error || data?.status !== 'SUCCESS') {
        setReminderEnabled(!newValue);
        Alert.alert(t('sosyalMedya.alerts.error'), data?.status === 'FORBIDDEN' ? t('reminders.ownerOnly') : t('reminders.saveFailed'));
      }
    } catch {
      setReminderEnabled(!newValue);
      Alert.alert(t('sosyalMedya.alerts.error'), t('reminders.saveFailed'));
    }
  };

  const handleMultiCalendarSave = async (newValue) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('organizations')
          .update({ multi_calendar_enabled: newValue })
          .eq('owner_id', session.user.id);
      }
    } catch (e) {
      console.warn('Multi calendar save error', e);
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

  // --- Tehlikeli Bölge: Veri Sıfırlama (web AiDataResetPanel.tsx ile birebir aynı mantık) ---
  const [dangerModal, setDangerModal] = useState(null); // 'soft' | 'hard' | null
  const [dangerConfirmText, setDangerConfirmText] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);

  const handleDataReset = async (mode) => {
    setDangerLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('flow-reset-ai-data', { body: { mode } });
      if (error || data?.success === false) {
        throw new Error(error?.message || data?.error || 'Bilinmeyen bir hata oluştu');
      }

      setDangerModal(null);
      setDangerConfirmText('');
      Alert.alert(
        t('sosyalMedya.alerts.success'),
        mode === 'soft'
          ? 'Test verileri başarıyla sıfırlandı.'
          : 'Tüm veriler fabrika ayarlarına sıfırlandı.'
      );
    } catch (err) {
      console.error('Veri sıfırlama hatası:', err);
      Alert.alert(t('sosyalMedya.alerts.error'), err.message);
    } finally {
      setDangerLoading(false);
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
              <BotStatusHero setIsEditing={setIsEditing} setIsSaveBtnActive={setIsSaveBtnActive} setWhatsappBotActive={setWhatsappBotActive} whatsappBotActive={whatsappBotActive} />

              {/* YENİ EKLENEN BASİT ALAN: Asistan Talimatı Oluştur */}
              <AssistantInstructionBox promptConfig={promptConfig} setCustomInstruction={setCustomInstruction} setIsSaveBtnActive={setIsSaveBtnActive} />

              <View>
                
                {/* SECTION 5: Integrations (Google Drive & WhatsApp ONLY) - Moved to top */}
                <IntegrationsCard connectedFolderId={connectedFolderId} handleRefreshQr={handleRefreshQr} isWhatsAppConnected={isWhatsAppConnected} setDriveModalVisible={setDriveModalVisible} setWhatsappModalVisible={setWhatsappModalVisible} />

                {/* SECTION 2: AI Personality */}
                <AiPersonalitySection addRoleOpen={addRoleOpen} customRoles={customRoles} humorLevel={humorLevel} modernAdaptation={modernAdaptation} newRoleText={newRoleText} personaIntensity={personaIntensity} personas={personas} personasLoading={personasLoading} promptConfig={promptConfig} rgbSpin={rgbSpin} setAddRoleOpen={setAddRoleOpen} setCustomRole={setCustomRole} setCustomRoles={setCustomRoles} setHumorLevel={setHumorLevel} setIsSaveBtnActive={setIsSaveBtnActive} setModernAdaptation={setModernAdaptation} setMood={setMood} setNewRoleText={setNewRoleText} setPersona={setPersona} setPersonaIntensity={setPersonaIntensity} setRole={setRole} t={t} />

                {/* SECTION 4: "İleri Seviye Ayarlar" paneli kaldırıldı ("Tek Yapı"
                    refactor, Eylül 2026) — burada gösterilen "AI Karakter
                    Talimatı (Prompt)" client-side hesaplanan bir önizlemeydi ve
                    gerçek müşteri botuna hiç ulaşmıyordu (bkz. persona_engine/
                    index.ts üst notu). Kültürel/dil adaptasyonu artık burada
                    yapılandırılabilir bir ayar değil — sunucu tarafında (ledger
                    reposu, PromptBuilder.ts → SYSTEM_POLICY madde 1) her
                    merchant için sabit ve kapatılamaz şekilde gömülü. */}

                {/* SECTION 4.5: Timezone and Appointment (Moved outside) */}
                <TimezoneAppointmentCard appointmentModuleEnabled={appointmentModuleEnabled} handleAutoSave={handleAutoSave} handleMultiCalendarSave={handleMultiCalendarSave} handleReminderSave={handleReminderSave} multiCalendarEnabled={multiCalendarEnabled} reminderEnabled={reminderEnabled} setAppointmentModuleEnabled={setAppointmentModuleEnabled} setMultiCalendarEnabled={setMultiCalendarEnabled} setTimezone={setTimezone} t={t} timezone={timezone} />

                {/* INLINE SAVE BUTTON */}
                <SaveButtonInline handleSave={handleSave} isSaveBtnActive={isSaveBtnActive} isSavingSettings={isSavingSettings} />

                {/* SECTION 3: Live AI Preview */}
                <LivePreviewSection chatInput={chatInput} chatListRef={chatListRef} isTyping={isTyping} messages={messages} sendMessage={sendMessage} setChatInput={setChatInput} t={t} />

                {/* SECTION 7: Business Modules */}
                <BusinessModulesCard navigation={navigation} />

                {/* SECTION 8: Tehlikeli Bölge (Danger Zone) */}
                <DangerZoneSection setDangerConfirmText={setDangerConfirmText} setDangerModal={setDangerModal} />


              </View>

              </Animated.View>
            </ScrollView>

            {/* FLOATING SAVE BUTTON MOVED INLINE */}
          </View>
        )}

        {/* WhatsApp Entegrasyon Modalı */}
        <WhatsAppModal botUseCase={botUseCase} handleGetPairingCode={handleGetPairingCode} handleRefreshQr={handleRefreshQr} isWhatsAppConnected={isWhatsAppConnected} loginMethod={loginMethod} pairingLoading={pairingLoading} qrLoading={qrLoading} setIsWhatsAppConnected={setIsWhatsAppConnected} setLoginMethod={setLoginMethod} setQrLoading={setQrLoading} setWahaPairingCode={setWahaPairingCode} setWahaPhone={setWahaPhone} setWahaQrCode={setWahaQrCode} setWhatsappModalVisible={setWhatsappModalVisible} wahaPairingCode={wahaPairingCode} wahaPhone={wahaPhone} wahaQrCode={wahaQrCode} whatsappModalVisible={whatsappModalVisible} />

        {/* Google Drive Wizard Modalı */}
        <DriveModal connectedFolderId={connectedFolderId} disconnectingFolder={disconnectingFolder} driveLink={driveLink} driveModalVisible={driveModalVisible} handleDisconnectFolder={handleDisconnectFolder} handleSyncFolder={handleSyncFolder} setDriveLink={setDriveLink} setDriveModalVisible={setDriveModalVisible} syncing={syncing} />

        {/* Tehlikeli Bölge Onay Modalı (Veri Sıfırlama) */}
        <DangerModal RESET_CONFIRM_WORD={RESET_CONFIRM_WORD} dangerConfirmText={dangerConfirmText} dangerLoading={dangerLoading} dangerModal={dangerModal} handleDataReset={handleDataReset} setDangerConfirmText={setDangerConfirmText} setDangerModal={setDangerModal} />

      </View>
    </KeyboardAvoidingView>
  );
}

