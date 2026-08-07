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
  PERSONAS, 
  MOODS, 
  RULES, 
  usePersonaEngine, 
  useSavePersona, 
  usePlayground 
} from '../../../persona_engine';

import { container } from '../../../../core/container';
import { ManageBotUseCase } from '@application/useCases/ManageBotUseCase';
const botUseCase = container.resolve(ManageBotUseCase);

export default function BotYonetimiScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();

  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom + 10, 20) + 64 + 14;
  const [rgbSpinValue] = useState(new Animated.Value(0));

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
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  // Hook Integration
  const { 
    config: promptConfig, 
    finalPrompt: botInstruction, 
    isV2Ready, 
    setRole, 
    setCustomRole, 
    setPersona, 
    setMood, 
    setAdvancedActive,
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

  // Simulated Test Chat states (Powered by usePlayground Hook)
  const { messages, chatInput, setChatInput, sendMessage, isTyping } = usePlayground(botInstruction, promptConfig);
  const chatListRef = useRef(null);

  // Feature checkboxes state
  const [features, setFeatures] = useState({
    appointment: true,
    catalog: true,
    faq: false
  });

  const fetchInitialData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profiles (like Google Drive details)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('google_drive_folder_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile data:', profileError);
        } else if (profileData) {
          if (profileData.google_drive_folder_id) {
            setConnectedFolderId(profileData.google_drive_folder_id);
            setDriveLink(`https://drive.google.com/drive/folders/${profileData.google_drive_folder_id}`);
          }
        }

        // Fetch WAHA settings (Prompt)
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
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchInitialData();
    }, 0);
  }, []);

  const handleSave = async () => {
    try {
      // 1. Supabase ve Infrastructure Katmanı (Yeni Sistem)
      await saveConfig(promptConfig, botInstruction, isV2Ready, botActive, whatsappBotActive, socialBotActive);

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
      <View className="flex-1 bg-[#131315]">
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
            <ActivityIndicator size="large" color="#4edea3" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView 
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 130 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* SECTION 1: AI Status (Always Visible) */}
              <View className="mb-6 px-1">
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-3 h-3 rounded-full ${botActive ? 'bg-[#4edea3]' : 'bg-red-500'}`} style={botActive ? styles.pulseGlow : {}} />
                      <Text className="text-white text-base font-bold">Ai Asistan</Text>
                  </View>

                  {/* Platform Toggles */}
                  {botActive && (
                    <View className="flex-row items-center justify-between bg-black/20 p-3 rounded-xl mt-1">
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="logo-whatsapp" size={16} color={whatsappBotActive ? "#25D366" : "#666"} />
                          <Text className="text-white text-xs font-semibold ml-2">WhatsApp Asistanı</Text>
                          <Switch
                            value={whatsappBotActive}
                            onValueChange={(val) => { setWhatsappBotActive(val); setIsSaveBtnActive(true); setIsEditing(true); }}
                            trackColor={{ false: '#2c2b2e', true: '#25D366' }}
                            thumbColor={'#ffffff'}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 'auto' }}
                          />
                        </View>
                      </View>
                  )}
              </View>

              {/* YENİ EKLENEN BASİT ALAN: Asistan Talimatı Oluştur */}
              <View className="mb-4 mt-2 px-1">
                <Text className="text-white text-sm font-bold mb-2">Asistan Talimatı Oluştur</Text>
                <View className="bg-black/20 border border-white/5 rounded-xl p-3">
                  <TextInput
                    value={promptConfig.roleId === 'custom' ? promptConfig.customRoleText : ''}
                    onChangeText={(text) => { 
                      setRole('custom'); // Otomatik olarak "Diğer" rolüne geçir ki bu metni kullansın
                      setCustomRole(text); 
                      setIsSaveBtnActive(true); 
                    }}
                    placeholder="Örn: Sen bir berber dükkanı asistanısın, fiyat bilgisi verip randevu alırsın..."
                    placeholderTextColor="#849495"
                    multiline
                    style={{ color: '#e5e1e4', fontSize: 13, minHeight: 60, textAlignVertical: 'top' }}
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
                       <Ionicons name="logo-google" size={20} color={connectedFolderId ? "#4edea3" : "#849495"} />
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
                       <Ionicons name="logo-whatsapp" size={20} color={isWhatsAppConnected ? "#25D366" : "#849495"} />
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
                  shadowColor: '#00a2ff',
                  shadowOpacity: 0.8,
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
                      colors={['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ff0000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>

                  <View style={{ backgroundColor: '#1c1b1d', borderRadius: 18 }} className="p-4">
                    <Text className="text-white text-sm font-bold mb-3">AI Kişiliği</Text>
                  
                  {/* 1. 👔 Roller (Sektör) */}
                  <View className="mb-3">
                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">👔 İşletme Rolü</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {ROLES.map(role => (
                        <TouchableOpacity 
                          key={role.id}
                          onPress={() => { setRole(role.id); setIsSaveBtnActive(true); }}
                          className={`px-3 py-1.5 rounded-full mr-2 ${promptConfig.roleId === role.id ? 'bg-[#00a2ff]/30 border-2 border-[#00a2ff]' : 'bg-white/5 border border-white/10'}`}
                        >
                          <Text className={`text-[11px] font-semibold ${promptConfig.roleId === role.id ? 'text-[#00a2ff]' : 'text-gray-300'}`}>
                            {role.icon} {role.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {/* Diğer (Custom Role) Chip */}
                      <TouchableOpacity 
                        onPress={() => { setRole('custom'); setIsSaveBtnActive(true); }}
                        className={`px-3 py-1.5 rounded-full mr-2 ${promptConfig.roleId === 'custom' ? 'bg-[#00a2ff]/30 border-2 border-[#00a2ff]' : 'bg-white/5 border border-white/10'}`}
                      >
                        <Text className={`text-[11px] font-semibold ${promptConfig.roleId === 'custom' ? 'text-[#00a2ff]' : 'text-gray-300'}`}>
                          ✨ Diğer
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>

                  {/* Custom Role Input (Conditionally Rendered) */}
                  {promptConfig.roleId === 'custom' && (
                    <View className="bg-black/40 border border-white/5 rounded-xl p-2 mb-3">
                      <TextInput
                        value={promptConfig.customRoleText}
                        onChangeText={(text) => { setCustomRole(text); setIsSaveBtnActive(true); }}
                        placeholder="Mesleğinizi yazın (Örn: Otomobil Tamircisi)..."
                        placeholderTextColor="#849495"
                        style={{ color: '#e5e1e4', fontSize: 12, paddingVertical: 4, paddingHorizontal: 8 }}
                      />
                    </View>
                  )}

                  {/* 2. 🧠 Personalar (Karakter) */}
                  <View className="mb-3">
                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">🧠 Karakter</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {PERSONAS.map(persona => (
                        <TouchableOpacity 
                          key={persona.id}
                          onPress={() => { setPersona(persona.id); setIsSaveBtnActive(true); }}
                          className={`px-3 py-1.5 rounded-full mr-2 ${promptConfig.personaId === persona.id ? 'bg-[#bc13fe]/30 border-2 border-[#bc13fe]' : 'bg-[#bc13fe]/5 border border-[#bc13fe]/20'}`}
                        >
                          <Text className={`text-[11px] font-semibold ${promptConfig.personaId === persona.id ? 'text-[#ebb2ff]' : 'text-[#ebb2ff]/60'}`}>
                            {persona.icon} {persona.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* 3. 🎭 Mood / Üslup */}
                  <View>
                    <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">🎭 Üslup</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {MOODS.map(mood => (
                        <TouchableOpacity 
                          key={mood.id}
                          onPress={() => { setMood(mood.id); setIsSaveBtnActive(true); }}
                          className={`px-3 py-1.5 rounded-full mr-2 ${promptConfig.moodId === mood.id ? 'bg-[#ffb95f]/30 border-2 border-[#ffb95f]' : 'bg-[#ffb95f]/5 border border-[#ffb95f]/20'}`}
                        >
                          <Text className={`text-[11px] font-semibold ${promptConfig.moodId === mood.id ? 'text-[#ffb95f]' : 'text-[#ffb95f]/60'}`}>
                            {mood.icon} {mood.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                </View>

                {/* SECTION 4: Advanced AI Configuration (Collapsed) - Moved here */}
                <View style={{
                  overflow: 'hidden',
                  padding: 2, 
                  borderRadius: 20,
                  marginBottom: 16,
                  shadowColor: '#00a2ff',
                  shadowOpacity: 0.8,
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
                      colors={['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ff0000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>

                  <View style={{ backgroundColor: '#1c1b1d', borderRadius: 18 }} className="p-4">
                    <TouchableOpacity 
                      onPress={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="code-slash-outline" size={18} color="#00a2ff" />
                        <Text className="text-sm font-bold text-white">İleri Seviye Ayarlar</Text>
                      </View>
                      <Ionicons name={isAdvancedExpanded ? "chevron-up" : "chevron-down"} size={20} color="#849495" />
                    </TouchableOpacity>

                    {isAdvancedExpanded && (
                      <View className="mt-4 pt-4 border-t border-white/10">
                        {/* Advanced Active Toggle */}
                        <View className="flex-row items-center justify-between bg-black/40 p-3 rounded-xl mb-4 border border-[#00a2ff]/30">
                          <Text className="text-[#00a2ff] text-[11px] font-bold uppercase tracking-widest">
                            ÖZEL KURALLARI AKTİFLEŞTİR
                          </Text>
                          <Switch
                            value={promptConfig.advancedActive}
                            onValueChange={(val) => { setAdvancedActive(val); setIsSaveBtnActive(true); }}
                            trackColor={{ false: '#2c2b2e', true: '#00a2ff' }}
                            thumbColor={'#ffffff'}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                          />
                        </View>

                        {/* AI Instruction / System Prompt */}
                        <View className="mb-2">
                          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">🤪 AI Karakter Talimatı (Prompt)</Text>
                          <View style={{
                            overflow: 'hidden',
                            padding: 2, 
                            borderRadius: 14,
                          }}>
                            <Animated.View style={{ 
                              position: 'absolute',
                              top: '50%', left: '50%',
                              width: 1500, height: 1500,
                              marginTop: -750, marginLeft: -750,
                              transform: [{ rotate: rgbSpin }],
                            }}>
                              <LinearGradient
                                colors={['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ff0000']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1 }}
                              />
                            </Animated.View>

                            <View className="bg-black/90 rounded-[12px] p-3 relative">
                              <TextInput
                                value={botInstruction}
                                editable={false}
                                placeholder="Asistanın müşteriye nasıl davranması gerektiğiyle ilgili ek talimatları buraya yazın..."
                                placeholderTextColor="#849495"
                                multiline
                                textAlignVertical="top"
                                style={{ height: 280, color: '#e5e1e4', fontSize: 13, lineHeight: 18 }}
                                className="font-body-md"
                                showsVerticalScrollIndicator={true}
                              />
                              <Text style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{"OrchestrationEngine"}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* INLINE SAVE BUTTON */}
                {isSaveBtnActive && (
                  <Animated.View style={{ 
                    marginBottom: 16,
                    shadowColor: '#4edea3',
                    shadowOpacity: 0.5,
                    shadowRadius: 15,
                    elevation: 10
                  }}>
                    <CustomButton
                      title="Değişiklikleri Kaydet"
                      onPress={handleSave}
                      isLoading={isSavingSettings}
                      leftIcon={<Ionicons name="save-outline" size={18} color="#003824" />}
                      className="w-full bg-[#4edea3]"
                      textClassName="text-[#003824] font-bold text-sm"
                    />
                  </Animated.View>
                )}

                {/* SECTION 3: Live AI Preview */}
                <View style={styles.glassCard} className="mb-4 overflow-hidden">
                  <View className="p-4 border-b border-white/5 flex-row justify-between items-center bg-white/2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4edea3" />
                      <Text className="text-sm font-semibold text-white">Canlı Test</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                      <Text className="text-[9px] text-[#4edea3] font-bold uppercase tracking-wider">SİMÜLASYON</Text>
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
                      {messages.map((item) => (
                        <View key={item.id} className={`flex-row ${item.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                          {item.sender === 'bot' && (
                            <View className="w-7 h-7 rounded-full bg-[#bc13fe]/20 items-center justify-center mr-2 flex-shrink-0 border border-[#bc13fe]/30">
                              <Ionicons name="sparkles" size={12} color="#ebb2ff" />
                            </View>
                          )}
                          <View 
                            style={{
                              backgroundColor: item.sender === 'user' ? 'rgba(78, 222, 163, 0.15)' : 'rgba(32, 31, 34, 0.9)',
                              borderWidth: 1,
                              borderColor: item.sender === 'user' ? 'rgba(78, 222, 163, 0.3)' : 'rgba(188, 19, 254, 0.3)',
                              borderRadius: 14,
                              borderTopRightRadius: item.sender === 'user' ? 2 : 14,
                              borderTopLeftRadius: item.sender === 'bot' ? 2 : 14,
                              padding: 10,
                              maxWidth: '75%',
                              shadowColor: item.sender === 'bot' ? '#bc13fe' : 'transparent',
                              shadowOpacity: 0.2,
                              shadowRadius: 5,
                              elevation: item.sender === 'bot' ? 3 : 0
                            }}
                          >
                            <Text style={{ color: item.sender === 'bot' ? '#ebb2ff' : '#e5e1e4', fontSize: 12, lineHeight: 16 }}>{item.text}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                    
                    {isTyping && (
                      <View className="flex-row justify-start mb-3 items-center">
                        <View className="w-7 h-7 rounded-full bg-[#bc13fe]/20 items-center justify-center mr-2 border border-[#bc13fe]/30">
                          <Ionicons name="sparkles" size={12} color="#ebb2ff" />
                        </View>
                        <ActivityIndicator size="small" color="#bc13fe" style={{ marginLeft: 6 }} />
                      </View>
                    )}

                    {/* Input Bar */}
                    <View className="relative mt-2">
                      <TextInput
                        value={chatInput}
                        onChangeText={setChatInput}
                        placeholder="Test mesajı gönder..."
                        placeholderTextColor="#849495"
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
                        <Ionicons name="send" size={18} color="#4edea3" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* SECTION 7: Business Modules */}
                <View style={styles.glassCard} className="p-4 mb-4">
                  <View className="space-y-3">
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('RandevuMain')}
                      style={{ backgroundColor: 'rgba(78, 222, 163, 0.1)', borderColor: 'rgba(78, 222, 163, 0.3)', borderWidth: 1 }}
                      className="flex-row items-center justify-between p-3.5 rounded-xl mb-3"
                    >
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="calendar-outline" size={18} color="#4edea3" />
                        <Text className="text-xs text-[#4edea3] font-semibold">Ai Randevu Yönetimi</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#4edea3" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => navigation.navigate('HizmetAyarlari')}
                      style={{ backgroundColor: 'rgba(0, 162, 255, 0.1)', borderColor: 'rgba(0, 162, 255, 0.3)', borderWidth: 1 }}
                      className="flex-row items-center justify-between p-3.5 rounded-xl"
                    >
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="briefcase-outline" size={18} color="#00a2ff" />
                        <Text className="text-xs text-[#00a2ff] font-semibold">Ai İşletme Hizmetleri</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="#00a2ff" />
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
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
            <View style={styles.modalContent} className="bg-[#1c1b1d] border border-white/10">
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
                                Alert.alert('Başarılı', 'Ayarlar kaydedildi');
                              }
                            } catch (e) {
                              console.error(e);
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
                      style={{ flex: 1, backgroundColor: loginMethod === 'qr' ? 'rgba(78, 222, 163, 0.15)' : 'transparent' }}
                      className="py-2 rounded-lg items-center"
                    >
                      <Text className="text-white text-xs font-semibold">QR Kod</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setLoginMethod('phone')}
                      style={{ flex: 1, backgroundColor: loginMethod === 'phone' ? 'rgba(78, 222, 163, 0.15)' : 'transparent' }}
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
                            <ActivityIndicator size="small" color="#4edea3" />
                            <Text className="text-black text-[10px] font-semibold mt-2">QR Kod Bekleniyor...</Text>
                          </View>
                        )}
                      </View>

                      <CustomButton
                        title="QR Kodu Yenile"
                        onPress={handleRefreshQr}
                        isLoading={qrLoading}
                        leftIcon={<Ionicons name="refresh" size={16} color="#003824" />}
                        className="w-full mb-2"
                        textClassName="text-[#003824] font-bold"
                      />
                    </View>
                  ) : (
                    <View className="py-2">
                      <CustomInput
                        value={wahaPhone}
                        onChangeText={setWahaPhone}
                        placeholder="Telefon numarası"
                        keyboardType="phone-pad"
                        leftIcon={<Ionicons name="call-outline" size={18} color="#4edea3" />}
                        containerClassName="mb-3"
                      />

                      <CustomButton
                        title="Eşleşme Kodu Al"
                        onPress={handleGetPairingCode}
                        isLoading={pairingLoading}
                        leftIcon={<Ionicons name="key-outline" size={16} color="#003824" />}
                        className="w-full mb-4"
                        textClassName="text-[#003824] font-bold"
                      />

                      {wahaPairingCode && (
                        <View className="bg-black/40 border border-[#4edea3]/30 rounded-xl p-4 items-center justify-center mb-4">
                          <Text className="text-gray-400 text-[10px] mb-1">Eşleşme Kodunuz</Text>
                          <Text className="text-[#4edea3] text-2xl font-bold tracking-widest">{wahaPairingCode}</Text>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent} className="bg-[#1c1b1d] border border-white/10">
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
                  <Text selectable={true} className="text-[#4edea3] font-medium text-xs bg-black/40 p-2 rounded-lg mb-3 text-center">
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
                  leftIcon={<Ionicons name="logo-google" size={18} color="#4edea3" />}
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
                    className="bg-[#4edea3] py-3 rounded-xl items-center justify-center"
                  >
                    {syncing ? (
                      <ActivityIndicator size="small" color="#003824" />
                    ) : (
                      <Text className="text-[#003824] text-xs font-bold">Bağla ve Senkronize Et</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(32, 31, 34, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  glowBorderCyanThick: {
    backgroundColor: '#1c1b1d', // Solid opaque dark grey to prevent Android elevation shadow bleed-through
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00a2ff',
    shadowColor: '#00a2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 28,
    elevation: 18,
  },
  pulseGlow: {
    shadowColor: '#4edea3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
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
