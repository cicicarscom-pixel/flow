import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch,
  ImageBackground, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { GlobalAppBar , supabase , AnimatedBorderCard } from '../../../../shared';

import { container } from '../../../../core/container';
import { ManageBotUseCase } from '@application/useCases/ManageBotUseCase';

const botUseCase = container.resolve(ManageBotUseCase);
import { CustomButton } from '../../../../shared';
import { CustomInput } from '../../../../shared';



export default function BotYonetimiScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const [botActive, setBotActive] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [connectedFolderId, setConnectedFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnectingFolder, setDisconnectingFolder] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // WAHA Bağlantı State'leri
  const [loginMethod, setLoginMethod] = useState('qr'); // 'qr' veya 'phone'
  const [wahaQrCode, setWahaQrCode] = useState(null);
  const [wahaPhone, setWahaPhone] = useState('');
  const [wahaPairingCode, setWahaPairingCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);

  const fetchInitialData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Profil tablosundan diğer bilgileri (örn. Google Drive) al
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

        // WAHA Bot Ayarlarını (Prompt) al
        const { data: botSettingsData, error: botSettingsError } = await botUseCase.getSettings(session.user.id);
        if (!botSettingsError && botSettingsData) {
          setSystemPrompt(botSettingsData.system_prompt || '');
          setBotActive(botSettingsData.is_active !== false); // Eğer tanımlı değilse varsayılan aktif
        }

        // WAHA durumunu kontrol et
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
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const result = await botUseCase.updateSettings(session.user.id, { 
          system_prompt: systemPrompt,
          is_active: botActive 
        });

        if (result.error) {
          throw result.error;
        }
        Alert.alert(t('sosyalMedya.alerts.success'), t('sosyalMedya.alerts.settingsSaved'));
      } else {
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
      }
    } catch (err) {
      console.error('Error saving system prompt:', err);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.settingsSaveError') + ' ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshQr = async () => {
    setQrLoading(true);
    setWahaQrCode(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");
      const merchantId = session.user.id;

      // 1. Session Başlat
      const sessionRes = await botUseCase.startSession(merchantId);
      if (sessionRes.error) {
        console.log("StartSession Hatası:", sessionRes.error);
        // Zaten var olan bir session olabilir, devam etmeyi deneyelim
      }

      // 2. QR Kod İste
      const qrRes = await botUseCase.getQrCode(merchantId);
      if (qrRes.error) {
        throw qrRes.error;
      }
      
      // WAHA genellikle base64 data döndürür. Yanıt formatını kontrol ediyoruz.
      if (qrRes.data && qrRes.data.data) {
        setWahaQrCode(qrRes.data.data); // data:image/png;base64,...
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

      // 1. Session Başlat
      const sessionRes = await botUseCase.startSession(merchantId);
      if (sessionRes.error) {
        console.log("StartSession Hatası:", sessionRes.error);
      }

      // 2. Eşleşme Kodu İste
      const pairingRes = await botUseCase.getPairingCode(merchantId, wahaPhone.trim());
      if (pairingRes.error) {
        throw pairingRes.error;
      }

      // Gelen kodu ekranda göster
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
    if (foldersMatch && foldersMatch[1]) {
      return foldersMatch[1];
    }
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
    if (/^[a-zA-Z0-9-_]+$/.test(url)) {
      return url;
    }
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

      // Edge Function'ı çağırarak Google Drive anlık bildirimlerini (watch channel) otomatik kuruyoruz
      const { data, error } = await supabase.functions.invoke('drive-watch-setup', {
        body: { folderId }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        throw new Error(error.message || 'Bilinmeyen bir hata oluştu');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      setConnectedFolderId(folderId);
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

        if (error) {
          throw error;
        }

        setConnectedFolderId(null);
        setDriveLink('');
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
      <View className="flex-1 bg-[#0A0A0B]">
        <ImageBackground 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.85)' }]} />
        </ImageBackground>
        
        <GlobalAppBar level={2} module="ai" title={t('sosyalMedya.bot.title')} showProfile={true} />
        
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#00f0ff" />
          </View>
        ) : (
          <ScrollView 
            className="px-4 pt-2" 
            contentContainerStyle={{ paddingBottom: 130 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Bot Durumu (Only shown when WhatsApp is connected) */}
            {/* Bot Durumu (Her Zaman Görünür) */}
            <View 
              className="rounded-[24px] p-5 mb-5 border border-white/5 relative overflow-hidden"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-semibold text-white mb-1">{t('sosyalMedya.bot.status')}</Text>
                  <Text className="text-sm text-gray-400">
                    {botActive ? t('sosyalMedya.bot.statusActive') : t('sosyalMedya.bot.statusInactive')}
                  </Text>
                </View>
                <Switch
                  value={botActive}
                  onValueChange={setBotActive}
                  trackColor={{ false: '#3b494b', true: '#bc13fe' }}
                  thumbColor={'#ffffff'}
                />
              </View>
              <LinearGradient
                colors={['#ffffff', '#bc13fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 3, borderRadius: 2, marginTop: 4, opacity: botActive ? 1 : 0.2 }}
              />
            </View>

            {/* WhatsApp Müşteri Asistanı (Bot Talimatları) Card */}
            <View 
              className="rounded-[24px] p-5 mb-5 border border-white/5 relative"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  <Text className="text-lg font-semibold text-white">{t('sosyalMedya.bot.instructionsTitle')}</Text>
                </View>
                {isWhatsAppConnected ? (
                  <TouchableOpacity onPress={() => {}}>
                    <Text className="text-[#ff453a] text-xs font-semibold">{t('sosyalMedya.bot.disconnect')}</Text>
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="sparkles" size={20} color="#00f0ff" />
                )}
              </View>

              <Text className="text-gray-400 text-xs leading-5 mb-4">
                {t('sosyalMedya.bot.instructionsDesc')}
              </Text>
              
              <CustomInput
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder={t('sosyalMedya.bot.promptPlaceholder')}
                multiline
                textAlignVertical="top"
                className="leading-6"
                containerClassName="mb-4"
                style={{ minHeight: 120 }}
              />

              <CustomButton
                title={t('sosyalMedya.bot.saveSettings')}
                onPress={handleSave}
                isLoading={saving}
                leftIcon={<Ionicons name="save-outline" size={20} color="#fff" />}
              />
            </View>

            {/* WAHA Asistanı Bağla Card */}
            {!isWhatsAppConnected && (
              <View className="bg-surface rounded-small p-5 border border-white/5 mb-5">
                <Text className="text-lg font-semibold text-white mb-2 text-center">{t('sosyalMedya.bot.connectAssistant')}</Text>
                    <Text className="text-xs text-gray-400 text-center mb-6 px-2">
                      {t('sosyalMedya.bot.connectDesc')}
                    </Text>

                    {loginMethod === 'qr' ? (
                      <View className="items-center">
                        {/* QR Kod Alanı */}
                        <View className="w-48 h-48 bg-white rounded-xl items-center justify-center mb-6 overflow-hidden">
                          {wahaQrCode ? (
                            <ImageBackground 
                              source={{ uri: wahaQrCode.startsWith('data:image') ? wahaQrCode : `data:image/png;base64,${wahaQrCode}` }} 
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="contain"
                            />
                          ) : (
                            <View className="items-center justify-center">
                              <Ionicons name="qr-code-outline" size={64} color="#161B26" />
                              <Text className="text-[#161B26] text-xs font-semibold mt-2">{t('sosyalMedya.bot.waitingQr')}</Text>
                            </View>
                          )}
                        </View>

                        <CustomButton
                          title={t('sosyalMedya.bot.refreshQr')}
                          onPress={handleRefreshQr}
                          isLoading={qrLoading}
                          leftIcon={<Ionicons name="refresh" size={20} color="#161B26" />}
                          className="w-full mb-4"
                          textClassName="text-[#161B26]"
                        />

                        <TouchableOpacity onPress={() => setLoginMethod('phone')} className="py-2">
                          <Text className="text-[#00F2FE] text-sm font-semibold text-center underline">
                            {t('sosyalMedya.bot.connectWithPhone')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="items-center">
                        {/* Telefon ile Bağlantı Alanı */}
                        <CustomInput
                          value={wahaPhone}
                          onChangeText={setWahaPhone}
                          placeholder={t('sosyalMedya.bot.phonePlaceholder')}
                          keyboardType="phone-pad"
                          leftIcon={<Ionicons name="call-outline" size={20} color="#00F2FE" />}
                          containerClassName="w-full mb-4"
                        />

                        <CustomButton
                          title={t('sosyalMedya.bot.getPairingCode')}
                          onPress={handleGetPairingCode}
                          isLoading={pairingLoading}
                          leftIcon={<Ionicons name="key-outline" size={20} color="#161B26" />}
                          className="w-full mb-6"
                          textClassName="text-[#161B26]"
                        />

                        {wahaPairingCode && (
                          <View className="w-full bg-[#161B26] border border-[#00F2FE]/30 rounded-xl p-6 items-center justify-center mb-6">
                            <Text className="text-gray-400 text-xs mb-2">{t('sosyalMedya.bot.pairingCodeLabel')}</Text>
                            <Text className="text-[#00F2FE] text-3xl font-bold tracking-widest">{wahaPairingCode}</Text>
                          </View>
                        )}

                        <TouchableOpacity onPress={() => setLoginMethod('qr')} className="py-2">
                          <Text className="text-gray-400 text-sm text-center underline">
                            {t('sosyalMedya.bot.cancelToQr')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
              </View>
            )}

            {/* Veri Seti Senkronizasyonu */}
            <View 
              className="rounded-[24px] p-5 mb-5 border border-white/5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            >
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center mr-4">
                  <Ionicons name="layers-outline" size={24} color="#fff" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-white mb-0.5">{t('sosyalMedya.bot.datasetSyncTitle')}</Text>
                  <Text className="text-xs text-gray-400">{t('sosyalMedya.bot.datasetSyncDesc')}</Text>
                </View>
              </View>

              {connectedFolderId ? (
                <View>
                  <View className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="folder-outline" size={20} color="#bc13fe" style={{ marginRight: 10 }} />
                      <Text className="text-white text-xs flex-1" numberOfLines={1}>
                        {t('sosyalMedya.bot.folderId')} {connectedFolderId}
                      </Text>
                    </View>
                    <Text className="text-[#00f0ff] font-bold text-xs">{t('sosyalMedya.bot.connected')}</Text>
                  </View>

                  <CustomButton
                    title={t('sosyalMedya.bot.disconnect')}
                    onPress={handleDisconnectFolder}
                    isLoading={disconnectingFolder}
                    leftIcon={<Ionicons name="close-circle-outline" size={20} color="#fff" />}
                    className="w-full bg-red-500/20 border border-red-500/50"
                    textClassName="text-red-400"
                  />
                </View>
              ) : (
                <View>
                  <View className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 mb-4">
                    <Text className="text-gray-400 text-xs mb-2">
                      {t('sosyalMedya.bot.driveStep1')}
                    </Text>
                    <Text selectable={true} className="text-[#00f0ff] font-medium text-xs bg-[#2A2A2A] p-2 rounded-lg mb-4 text-center">
                      {t('sosyalMedya.bot.serviceAccountEmail', 'esnaf-drive-bot@gen-lang-client-0889039852.iam.gserviceaccount.com')}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {t('sosyalMedya.bot.driveStep2')}
                    </Text>
                  </View>

                  <CustomInput
                    value={driveLink}
                    onChangeText={setDriveLink}
                    placeholder={t('sosyalMedya.bot.drivePlaceholder')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon={<Ionicons name="logo-google" size={20} color="#00F2FE" />}
                    containerClassName="mb-4"
                  />
                  <AnimatedBorderCard 
                    style={styles.glowBorderCyan} 
                    colors={['#00f0ff', '#131314', '#00f0ff', '#131314']}
                    padding={0}
                    borderRadius={12}
                  >
                    <CustomButton
                      title={t('sosyalMedya.bot.connectAndSync')}
                      onPress={handleSyncFolder}
                      isLoading={syncing}
                      className="bg-transparent py-3 px-4"
                      textClassName="text-[#00f0ff] text-[12px] font-bold uppercase tracking-widest"
                      leftIcon={<Ionicons name="sync" size={16} color="#00f0ff" />}
                    />
                  </AnimatedBorderCard>
                </View>
              )}
            </View>

            {/* Stat Cards */}
            <View className="flex-row justify-between mb-8">
              <View 
                className="flex-1 rounded-[24px] p-5 mr-2 border border-white/5"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                <Text className="text-xs text-gray-400 mb-6">{t('sosyalMedya.bot.processedData')}</Text>
                <Text className="text-2xl font-bold text-white">{t('sosyalMedya.bot.mockDataSize', '1.2 GB')}</Text>
              </View>

              <View 
                className="flex-1 rounded-[24px] p-5 ml-2 border border-white/5 relative overflow-hidden"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              >
                {/* Soft pink/purple glow in background */}
                <View className="absolute right-0 bottom-0 w-24 h-24 bg-[#bc13fe] opacity-10 rounded-full blur-xl" style={{ transform: [{ translateX: 20 }, { translateY: 20 }] }} />
                <Text className="text-xs text-gray-400 mb-6">{t('sosyalMedya.bot.errorRate')}</Text>
                <Text className="text-2xl font-bold text-[#fbcfe8]">%0.02</Text>
              </View>
            </View>

            {/* AI Hesap Button */}
            <View className="mb-4 px-[20px]">
              <AnimatedBorderCard 
                style={styles.glowBorderCyan} 
                colors={['#00f0ff', '#131314', '#00f0ff', '#131314']}
                padding={0}
                borderRadius={12}
              >
                <CustomButton
                  title={t('sosyalMedya.bot.aiAccount')}
                  onPress={() => navigation.navigate('AiHesap')}
                  className="bg-transparent py-3 px-4"
                  textClassName="text-[#00f0ff] text-[12px] font-bold uppercase tracking-widest"
                  leftIcon={<Ionicons name="settings-outline" size={16} color="#00f0ff" />}
                />
              </AnimatedBorderCard>
            </View>

            {/* Randevu Sistemi Button */}
            <View className="mb-8 px-[20px]">
              <AnimatedBorderCard 
                style={[styles.glowBorderCyan, { shadowColor: '#4edea3', borderColor: 'rgba(78, 222, 163, 0.5)' }]} 
                colors={['#4edea3', '#131314', '#4edea3', '#131314']}
                padding={0}
                borderRadius={12}
              >
                <CustomButton
                  title={"Randevu Yonetimi"}
                  onPress={() => navigation.navigate('RandevuMain')}
                  className="bg-transparent py-3 px-4"
                  textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
                  leftIcon={<Ionicons name="calendar-outline" size={16} color="#4edea3" />}
                />
              </AnimatedBorderCard>
            </View>
            
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  glowBorderCyan: {
    borderColor: 'rgba(0, 240, 255, 0.5)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  }
});
