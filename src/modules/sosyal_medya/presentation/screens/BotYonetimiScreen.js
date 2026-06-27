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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { GlobalAppBar, supabase, CustomButton, CustomInput } from '../../../../shared';

import { container } from '../../../../core/container';
import { ManageBotUseCase } from '@application/useCases/ManageBotUseCase';

const botUseCase = container.resolve(ManageBotUseCase);

export default function BotYonetimiScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Core states
  const [botActive, setBotActive] = useState(true);

  const [botRole, setBotRole] = useState('');
  const [botInstruction, setBotInstruction] = useState('');
  const [isSaveBtnActive, setIsSaveBtnActive] = useState(false);
  const [selectedRuleKey, setSelectedRuleKey] = useState('');
  const [selectedRoleKey, setSelectedRoleKey] = useState('');
  const [selectedCharKey, setSelectedCharKey] = useState('');
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

  // Simulated Test Chat states
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'user', text: 'Merhaba, randevu almak istiyorum.' },
    { id: '2', sender: 'bot', text: 'Merhaba 👋 Tabii ki yardımcı olabilirim. Hangi hizmetimiz için randevu oluşturmak istersiniz?' }
  ]);
  const [testInput, setTestInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatListRef = useRef(null);

  // Feature checkboxes state
  const [features, setFeatures] = useState({
    appointment: true,
    catalog: true,
    faq: false
  });

  const getRuleText = (key) => {
    if (key === 'drive') return "ÖNCELİKLİ KURAL: Müşteriye yanıt vermeden önce sana sağlanan sistem veritabanındaki (Google Drive belgeleri) bilgileri analiz et. Fiyat, menü, iade koşulları gibi konularda SADECE bu belgelerdeki gerçek verilere dayanarak cevap ver. Belgede olmayan bir bilgiyi asla uydurma.";
    if (key === 'documents') return "ÖNCELİKLİ KURAL: Sana sağlanan dökümanlar dışındaki bilgilere dayanma. Bilgi dökümanda yoksa uydurma cevap verme.";
    return "";
  };

  const getRoleText = (key) => {
    if (key === 'restoran') return "Sen profesyonel bir restoran asistanısın. Müşterilerimizin rezervasyon taleplerini al, menü detaylarını sun.";
    if (key === 'berber') return "Sen saç/sakal tıraşı hizmeti veren esnaf bir berber asistanısın. Randevu ve müsaitlik saatlerimizi bildir.";
    if (key === 'eticaret') return "Sen e-ticaret müşteri destek botusun. Sipariş durumu sorgulamalarına ve kargo süreçlerine yardımcı ol.";
    if (key === 'oto') return "Sen bir oto tamir servisi asistanısın. Servis randevuları ve bakım hizmetleri hakkında bilgilendirme yap.";
    return "";
  };

  const getCharText = (key) => {
    if (key === 'dedikoducu') return "Müşterilerle konuşurken mahallenin dedikoducu teyzesi gibi samimi, hafif meraklı ve bol emojili konuş.";
    if (key === 'sinirliUsta') return "Cevapların kısa, net ve hafif huysuz bir sanayi ustası tavrında olsun. Çok fazla detaya girme.";
    if (key === 'nazik') return "Müşteriye karşı son derece saygılı, eski İstanbul beyefendisi/hanımefendisi kibarlığında ve resmiyetinde hitap et.";
    if (key === 'abartili') return "Ürünleri ve hizmetleri anlatırken dünyanın en iyi şeyiymiş gibi inanılmaz coşkulu ve abartılı bir pazarlamacı dili kullan.";
    return "";
  };

  const handlePresetPress = (type, key) => {
    if (type === 'role') {
      const nextRole = selectedRoleKey === key ? '' : key;
      setSelectedRoleKey(nextRole);
      setBotRole(getRoleText(nextRole));
    } else if (type === 'char') {
      const nextChar = selectedCharKey === key ? '' : key;
      setSelectedCharKey(nextChar);
      setBotInstruction(getCharText(nextChar));
    }
    setIsSaveBtnActive(true);
  };

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
          const splitIndex = fullPrompt.indexOf('\n\n');
          if (splitIndex !== -1) {
            setBotRole(fullPrompt.substring(0, splitIndex));
            setBotInstruction(fullPrompt.substring(splitIndex + 2));
          } else {
            setBotRole(fullPrompt);
            setBotInstruction('');
          }
          setBotActive(botSettingsData.is_active !== false);
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
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const mergedPrompt = [botRole, botInstruction].filter(Boolean).join('\n\n');
        const result = await botUseCase.updateSettings(session.user.id, { 
          system_prompt: mergedPrompt,
          is_active: botActive 
        });

        if (result.error) throw result.error;
        
        // Trigger drive-watch-setup to sync/scan Google Drive contents immediately in the background
        if (connectedFolderId) {
          supabase.functions.invoke('drive-watch-setup', {
            body: { folderId: connectedFolderId }
          }).catch(err => console.warn('Background drive sync warning:', err));
        }

        setIsSaveBtnActive(false);
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

  // Chat simulator action
  const handleSendTestMessage = async () => {
    if (!testInput.trim()) return;
    
    const userMsg = { id: Date.now().toString(), sender: 'user', text: testInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = testInput;
    setTestInput('');
    setIsTyping(true);

    try {
      // Build structured prompt embedding the user's settings
      const mergedSystemPrompt = [botRole, botInstruction].filter(Boolean).join('\n\n') || 'Yardımsever bir asistan ol.';
      const promptText = `Sen WhatsApp asistanısın. Müşteriyle konuşuyorsun. 
Sana verilen sistem talimatlarına/asistan ruhuna/karakterine göre tam olarak o kimliğe bürünmeli ve o doğrultuda cevap vermelisin. Kısa, samimi ve net WhatsApp mesajları yaz. Emojiler kullanabilirsin.

SİSTEM TALİMATIN (BU KİMLİĞE BÜRÜNÜP BUNLARI UYGULA):
${mergedSystemPrompt}

MÜŞTERİ MESAJI:
${currentInput}

Asistan Cevabı:`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: promptText,
          mode: 'chat'
        }
      });

      if (error) throw error;
      
      const replyText = data?.text || data?.generatedText || "Merhaba! Ayarladığınız talimatlara göre size yardımcı olmaya çalışıyorum. Sistem promptunuza göre şu anda tam performans çalışıyorum. 👍";

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText
      }]);
    } catch (err) {
      console.warn("Simulator api error, using smart fallback", err);
      // Smart fallback using local pattern matching if API is offline
      let replyText = "Merhaba! Ayarladığınız talimatlara göre size yardımcı olmaya çalışıyorum. Sistem promptunuza göre şu anda tam performans çalışıyorum. 👍";
      
      const mergedSystemPrompt = [botRole, botInstruction].filter(Boolean).join('\n\n');
      const promptLower = mergedSystemPrompt.toLowerCase();
      const inputLower = currentInput.toLowerCase();

      if (inputLower.includes('randevu') || inputLower.includes('saat')) {
        if (promptLower.includes('berber') || promptLower.includes('tıraş')) {
          replyText = "Tıraş randevusu almak için hemen Randevu panelimizi açabilir veya size müsait saatleri listeleyebilirim. Hangi gün istersiniz?";
        } else {
          replyText = "Randevu işlemlerinizi başlatıyorum. Hangi hizmet için randevu oluşturmak istersiniz?";
        }
      } else if (inputLower.includes('fiyat') || inputLower.includes('ücret') || inputLower.includes('kaç para')) {
        replyText = "Hizmetlerimizin fiyat listesi bilgi kaynağımızda mevcuttur. Detaylı bilgi almak istediğiniz bir ürün veya hizmet var mı?";
      } else if (inputLower.includes('menü') || inputLower.includes('yemek') || inputLower.includes('cafe')) {
        replyText = "Güncel menümüzü bilgi kaynağımızdan çektim! Size lezzetli kahve ve yemek seçeneklerimizi sunabilirim.";
      }
      
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleFeature = (key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
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
          <ScrollView 
            className="px-4 pt-2" 
            contentContainerStyle={{ paddingBottom: 130 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Bot Durumu */}
            <View style={styles.glassCard} className="p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-[#4edea3]/10 rounded-xl items-center justify-center">
                  <Ionicons name="hardware-chip-outline" size={22} color="#4edea3" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white">{t('sosyalMedya.bot.status')}</Text>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <View className={`w-2 h-2 rounded-full ${botActive ? 'bg-[#4edea3] bg-emerald-500' : 'bg-red-500'}`} style={botActive ? styles.pulseGlow : null} />
                    <Text className={`text-[10px] font-bold tracking-widest uppercase ${botActive ? 'text-[#4edea3]' : 'text-red-500'}`}>
                      {botActive ? 'AKTİF' : 'DEVRE DIŞI'}
                    </Text>
                  </View>
                </View>
              </View>
              <Switch
                value={botActive}
                onValueChange={setBotActive}
                trackColor={{ false: '#2c2b2e', true: '#4edea3' }}
                thumbColor={'#ffffff'}
              />
            </View>

            {/* Bot Prompt Explanation Info Box */}
            <View 
              style={{
                borderColor: 'rgba(0, 240, 255, 0.2)',
                borderWidth: 1,
                borderRadius: 18,
                padding: 12,
                marginBottom: 16,
                backgroundColor: 'rgba(32, 31, 34, 0.4)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color="#4edea3" style={{ flexShrink: 0 }} />
              <Text className="text-gray-300 text-xs flex-1 leading-5">
                {t('sosyalMedya.bot.promptInstructionInfo')}
              </Text>
            </View>

            {/* 2. Sistem Talimatı (AI Instructions) */}
            <View style={styles.glassCard} className="p-4 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="sparkles-outline" size={18} color="#4edea3" />
                    <Text className="text-sm font-semibold text-white">{t('sosyalMedya.bot.systemInstruction')}</Text>
                  </View>
                  <TouchableOpacity className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={14} color="#849495" />
                    <Text className="text-xs text-gray-400 font-medium">{t('sosyalMedya.bot.history')}</Text>
                  </TouchableOpacity>
                </View>

                {/* 1. 👔 Roller (Sektör) */}
                <View className="mb-3">
                  <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    👔 Roller (Sektör) <Text className="text-gray-500 font-normal lowercase">(karekter eklemeden de kullanabilirsiniz Ai standart cevaplar verir)</Text>
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('role', 'restoran')}
                      className={`px-3 py-1.5 rounded-full mr-2 ${selectedRoleKey === 'restoran' ? 'bg-[#00f0ff]/30 border-2 border-[#00f0ff]' : 'bg-white/5 border border-white/10'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedRoleKey === 'restoran' ? 'text-[#00f0ff]' : 'text-gray-300'}`}>🍽️ Restoran Asistanı</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('role', 'berber')}
                      className={`px-3 py-1.5 rounded-full mr-2 ${selectedRoleKey === 'berber' ? 'bg-[#00f0ff]/30 border-2 border-[#00f0ff]' : 'bg-white/5 border border-white/10'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedRoleKey === 'berber' ? 'text-[#00f0ff]' : 'text-gray-300'}`}>💈 Berber Asistanı</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('role', 'eticaret')}
                      className={`px-3 py-1.5 rounded-full mr-2 ${selectedRoleKey === 'eticaret' ? 'bg-[#00f0ff]/30 border-2 border-[#00f0ff]' : 'bg-white/5 border border-white/10'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedRoleKey === 'eticaret' ? 'text-[#00f0ff]' : 'text-gray-300'}`}>🛍️ E-Ticaret Destek</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('role', 'oto')}
                      className={`px-3 py-1.5 rounded-full ${selectedRoleKey === 'oto' ? 'bg-[#00f0ff]/30 border-2 border-[#00f0ff]' : 'bg-white/5 border border-white/10'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedRoleKey === 'oto' ? 'text-[#00f0ff]' : 'text-gray-300'}`}>🚗 Oto Tamir Servisi</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* 2. 🎭 Karakter (Üslup) */}
                <View className="mb-4">
                  <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">🎭 Karakter (Üslup)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('char', 'dedikoducu')}
                      className={`px-3 py-1.5 rounded-full mr-2 ${selectedCharKey === 'dedikoducu' ? 'bg-[#bc13fe]/30 border-2 border-[#bc13fe]' : 'bg-[#bc13fe]/5 border border-[#bc13fe]/20'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedCharKey === 'dedikoducu' ? 'text-[#ebb2ff]' : 'text-[#ebb2ff]/60'}`}>👵 Dedikoducu Teyze</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('char', 'sinirliUsta')}
                      className={`px-3 py-1.5 rounded-full mr-2 ${selectedCharKey === 'sinirliUsta' ? 'bg-[#bc13fe]/30 border-2 border-[#bc13fe]' : 'bg-[#bc13fe]/5 border border-[#bc13fe]/20'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedCharKey === 'sinirliUsta' ? 'text-[#ebb2ff]' : 'text-[#ebb2ff]/60'}`}>🔧 Sinirli Usta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('char', 'nazik')}
                      className={`px-3 py-1.5 rounded-full mr-2 ${selectedCharKey === 'nazik' ? 'bg-[#bc13fe]/30 border-2 border-[#bc13fe]' : 'bg-[#bc13fe]/5 border border-[#bc13fe]/20'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedCharKey === 'nazik' ? 'text-[#ebb2ff]' : 'text-[#ebb2ff]/60'}`}>🎩 Aşırı Nazik</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handlePresetPress('char', 'abartili')}
                      className={`px-3 py-1.5 rounded-full ${selectedCharKey === 'abartili' ? 'bg-[#bc13fe]/30 border-2 border-[#bc13fe]' : 'bg-[#bc13fe]/5 border border-[#bc13fe]/20'}`}
                    >
                      <Text className={`text-[11px] font-semibold ${selectedCharKey === 'abartili' ? 'text-[#ebb2ff]' : 'text-[#ebb2ff]/60'}`}>📣 Coşkulu Pazarlamacı</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* 3. Rol Kutucuğu (İşletme Tanımı / Rol) - 3 Lines high */}
                <View className="mb-3">
                  <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">👔 Rol / İşletme Tanımı</Text>
                  <View className="bg-black/40 border border-white/5 rounded-xl p-3 relative">
                    <TextInput
                      value={botRole}
                      onChangeText={(text) => {
                        setBotRole(text);
                        setIsSaveBtnActive(true);
                      }}
                      onFocus={() => setIsSaveBtnActive(true)}
                      placeholder="Örn: Sen Ayla Güzellik Salonu'nun müşteri hizmetleri görevinde bir asistanısın."
                      placeholderTextColor="#849495"
                      multiline
                      textAlignVertical="top"
                      style={{ minHeight: 75, color: '#e5e1e4', fontSize: 13, lineHeight: 18 }}
                      className="font-body-md"
                    />
                  </View>
                </View>

                {/* 4. Talimat Ekranı (Asistan Kuralları) - Larger */}
                <View className="mb-4">
                  <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">🤪 AI Karakter Talimatı</Text>
                  <View className="bg-black/40 border border-white/5 rounded-xl p-3 relative">
                    <TextInput
                      value={botInstruction}
                      onChangeText={(text) => {
                        setBotInstruction(text);
                        setIsSaveBtnActive(true);
                      }}
                      onFocus={() => setIsSaveBtnActive(true)}
                      placeholder="Asistanın müşteriye nasıl davranması gerektiğiyle ilgili ek talimatları buraya yazın..."
                      placeholderTextColor="#849495"
                      multiline
                      textAlignVertical="top"
                      style={{ height: 140, color: '#e5e1e4', fontSize: 13, lineHeight: 18 }}
                      className="font-body-md"
                      showsVerticalScrollIndicator={true}
                    />
                    <Text style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{"Geist Mono"}</Text>
                  </View>
                </View>

                {/* Save settings button using CustomButton */}
                <CustomButton
                  title={t('sosyalMedya.bot.saveSettings')}
                  onPress={handleSave}
                  isLoading={saving}
                  disabled={!isSaveBtnActive}
                  leftIcon={<Ionicons name="save-outline" size={16} color={isSaveBtnActive ? '#003824' : '#849495'} />}
                  className="w-full mt-2"
                  variant={isSaveBtnActive ? 'primary' : 'disabled'}
                />
            </View>

            {/* 3. Canlı Test */}
            <View style={styles.glassCard} className="mb-4 overflow-hidden">
              <View className="p-4 border-b border-white/5 flex-row justify-between items-center bg-white/2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4edea3" />
                  <Text className="text-sm font-semibold text-white">{t('sosyalMedya.bot.liveTest')}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                  <Text className="text-[9px] text-[#4edea3] font-bold uppercase tracking-wider">{t('sosyalMedya.bot.simulation')}</Text>
                </View>
              </View>

              {/* Chat Simulator View */}
              <View className="p-4 bg-black/20" style={{ height: 230 }}>
                <ScrollView 
                  ref={chatListRef}
                  nestedScrollEnabled={true}
                  onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {chatMessages.map((item) => (
                    <View key={item.id} className={`flex-row ${item.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                      {item.sender === 'bot' && (
                        <View className="w-7 h-7 rounded-full bg-[#4edea3]/10 items-center justify-center mr-2 flex-shrink-0">
                          <Ionicons name="logo-android" size={12} color="#4edea3" />
                        </View>
                      )}
                      <View 
                        style={{
                          backgroundColor: item.sender === 'user' ? 'rgba(78, 222, 163, 0.15)' : 'rgba(32, 31, 34, 0.9)',
                          borderWidth: 1,
                          borderColor: item.sender === 'user' ? 'rgba(78, 222, 163, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 14,
                          borderTopRightRadius: item.sender === 'user' ? 2 : 14,
                          borderTopLeftRadius: item.sender === 'bot' ? 2 : 14,
                          padding: 10,
                          maxWidth: '75%'
                        }}
                      >
                        <Text style={{ color: '#e5e1e4', fontSize: 12, lineHeight: 16 }}>{item.text}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                
                {isTyping && (
                  <View className="flex-row justify-start mb-3 items-center">
                    <View className="w-7 h-7 rounded-full bg-[#4edea3]/10 items-center justify-center mr-2">
                      <Ionicons name="logo-android" size={12} color="#4edea3" />
                    </View>
                    <ActivityIndicator size="small" color="#4edea3" style={{ marginLeft: 6 }} />
                  </View>
                )}

                {/* Input Bar */}
                <View className="relative mt-2">
                  <TextInput
                    value={testInput}
                    onChangeText={setTestInput}
                    placeholder={t('sosyalMedya.bot.sendTestMessage')}
                    placeholderTextColor="#849495"
                    onSubmitEditing={handleSendTestMessage}
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
                    onPress={handleSendTestMessage}
                    style={{ position: 'absolute', right: 8, top: 6 }}
                  >
                    <Ionicons name="send" size={18} color="#4edea3" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 4. AI Bilgi Kaynağı */}
            <View style={styles.glassCard} className="p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-amber-500/10 rounded-xl items-center justify-center">
                    <Ionicons name="server-outline" size={20} color="#ffb95f" />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-white">{t('sosyalMedya.bot.aiKnowledge')}</Text>
                    <Text className="text-xs text-gray-400">
                      {"Google Drive: "}<Text className={connectedFolderId ? 'text-[#4edea3] font-bold' : 'text-red-500'}>
                        {connectedFolderId ? '🟢 Bağlı' : '🔴 Bağlı Değil'}
                      </Text>
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setDriveModalVisible(true)}
                  className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full"
                >
                  <Text className="text-white text-xs font-semibold">{t('sosyalMedya.bot.change')}</Text>
                </TouchableOpacity>
              </View>

              {connectedFolderId && (
                <View className="bg-black/20 rounded-xl p-3 flex-row items-center justify-between border border-white/5">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="sync-outline" size={14} color="#849495" />
                    <Text className="text-gray-400 text-[11px]">{t('sosyalMedya.bot.lastSync')}</Text>
                  </View>
                  <Text className="text-[#4edea3] text-[11px] font-bold">{t('sosyalMedya.bot.upToDate')}</Text>
                </View>
              )}
            </View>

            {/* 5. WhatsApp Bağlantı Durumu */}
            <View style={styles.glassCard} className="p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-[#25D366]/10 rounded-xl items-center justify-center">
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-white">{t('sosyalMedya.bot.whatsappConnection')}</Text>
                    <Text className="text-xs text-gray-400">
                      {t('sosyalMedya.bot.status')} <Text className={isWhatsAppConnected ? 'text-[#4edea3] font-bold' : 'text-red-500'}>
                        {isWhatsAppConnected ? '🟢 Bağlı' : '🔴 Bağlı Değil'}
                      </Text>
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setWhatsappModalVisible(true);
                    if (!isWhatsAppConnected) {
                      handleRefreshQr();
                    }
                  }}
                  className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full"
                >
                  <Text className="text-white text-xs font-semibold">
                    {isWhatsAppConnected ? t('sosyalMedya.bot.change') : t('sosyalMedya.bot.connect')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 6. Performans / İstatistikler */}
            <View className="flex-row justify-between mb-4">
              <View style={styles.glassCard} className="flex-1 p-3 mr-1.5 items-center justify-center text-center">
                <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('sosyalMedya.bot.todayChats')}</Text>
                <Text className="text-white text-lg font-bold">{"142"}</Text>
              </View>
              <View style={styles.glassCard} className="flex-1 p-3 mx-1 items-center justify-center text-center">
                <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('sosyalMedya.bot.responseSpeed')}</Text>
                <Text className="text-white text-lg font-bold">{"1.1s"}</Text>
              </View>
              <View style={[styles.glassCard, { borderLeftWidth: 2, borderLeftColor: 'rgba(78, 222, 163, 0.5)' }]} className="flex-1 p-3 items-center justify-center text-center">
                <Text className="text-[#4edea3] text-[10px] uppercase font-bold tracking-wider mb-1">{t('sosyalMedya.bot.successRate')}</Text>
                <Text className="text-[#4edea3] text-lg font-bold">{"%98"}</Text>
              </View>
            </View>

            {/* 7. Özellikler / Modüller */}
            <View style={styles.glassCard} className="p-4 mb-4">
              <Text className="text-sm font-semibold text-white mb-3">🛠️ Hızlı Modül Yönetimi</Text>
              
              <View className="space-y-3">
                {/* Randevu Yönetimi */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('RandevuMain')}
                  style={{ backgroundColor: 'rgba(78, 222, 163, 0.1)', borderColor: 'rgba(78, 222, 163, 0.3)', borderWidth: 1 }}
                  className="flex-row items-center justify-between p-3.5 rounded-xl"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="calendar-outline" size={18} color="#4edea3" />
                    <Text className="text-xs text-[#4edea3] font-semibold">{t('sosyalMedya.bot.appointmentManagement')}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color="#4edea3" />
                </TouchableOpacity>

                {/* Katalog Modülü */}
                <TouchableOpacity 
                  className="flex-row items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="book-outline" size={18} color="#e5e1e4" />
                    <Text className="text-xs text-gray-300 font-semibold">{t('sosyalMedya.bot.catalogMenu')}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color="#849495" />
                </TouchableOpacity>

                {/* Otomatik SSS Modülü */}
                <TouchableOpacity 
                  className="flex-row items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="help-circle-outline" size={18} color="#e5e1e4" />
                    <Text className="text-xs text-gray-300 font-semibold">{t('sosyalMedya.bot.autoFaq')}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color="#849495" />
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
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
                <Text className="text-base font-bold text-white">{t('sosyalMedya.bot.whatsappConnection')}</Text>
                <TouchableOpacity onPress={() => setWhatsappModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {isWhatsAppConnected ? (
                <View className="items-center py-4">
                  <View className="w-16 h-16 bg-[#25D366]/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="checkmark-circle" size={40} color="#25D366" />
                  </View>
                  <Text className="text-white font-semibold text-sm mb-1">{t('sosyalMedya.bot.connectAssistant')}</Text>
                  {wahaPhone ? <Text className="text-gray-400 text-xs mb-6">{t('sosyalMedya.bot.phonePlaceholder')}{": +"}{wahaPhone}</Text> : null}

                  <CustomButton
                    title={t('sosyalMedya.bot.disconnect')}
                    onPress={async () => {
                      Alert.alert(t('sosyalMedya.bot.disconnect'), t('sosyalMedya.bot.disconnectConfirm', 'Bağlantıyı kesmek istediğinize emin misiniz?'), [
                        { text: t('sosyalMedya.bot.cancel', 'Vazgeç') },
                        { 
                          text: t('sosyalMedya.bot.disconnect', 'Bağlantıyı Kes'), 
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
                                Alert.alert(t('sosyalMedya.alerts.success'), t('sosyalMedya.alerts.settingsSaved'));
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
                      <Text className="text-white text-xs font-semibold">{t('sosyalMedya.bot.qrCode', 'QR Kod')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setLoginMethod('phone')}
                      style={{ flex: 1, backgroundColor: loginMethod === 'phone' ? 'rgba(78, 222, 163, 0.15)' : 'transparent' }}
                      className="py-2 rounded-lg items-center"
                    >
                      <Text className="text-white text-xs font-semibold">{t('sosyalMedya.bot.connectWithPhone')}</Text>
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
                            <Text className="text-black text-[10px] font-semibold mt-2">{t('sosyalMedya.bot.waitingQr')}</Text>
                          </View>
                        )}
                      </View>

                      <CustomButton
                        title={t('sosyalMedya.bot.refreshQr')}
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
                        placeholder={t('sosyalMedya.bot.phonePlaceholder')}
                        keyboardType="phone-pad"
                        leftIcon={<Ionicons name="call-outline" size={18} color="#4edea3" />}
                        containerClassName="mb-3"
                      />

                      <CustomButton
                        title={t('sosyalMedya.bot.getPairingCode')}
                        onPress={handleGetPairingCode}
                        isLoading={pairingLoading}
                        leftIcon={<Ionicons name="key-outline" size={16} color="#003824" />}
                        className="w-full mb-4"
                        textClassName="text-[#003824] font-bold"
                      />

                      {wahaPairingCode && (
                        <View className="bg-black/40 border border-[#4edea3]/30 rounded-xl p-4 items-center justify-center mb-4">
                          <Text className="text-gray-400 text-[10px] mb-1">{t('sosyalMedya.bot.pairingCodeLabel')}</Text>
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
                <Text className="text-base font-bold text-white">{t('sosyalMedya.bot.aiKnowledge')}</Text>
                <TouchableOpacity onPress={() => setDriveModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View className="bg-white/5 rounded-xl p-3 mb-4">
                  <Text className="text-gray-300 text-xs leading-5 mb-2">
                    {t('sosyalMedya.bot.driveStep1')}
                  </Text>
                  <Text selectable={true} className="text-[#4edea3] font-medium text-xs bg-black/40 p-2 rounded-lg mb-3 text-center">
                    {"esnaf-drive-bot@gen-lang-client-0889039852.iam.gserviceaccount.com"}
                  </Text>
                  <Text className="text-gray-300 text-xs">
                    {t('sosyalMedya.bot.driveStep2')}
                  </Text>
                </View>

                <CustomInput
                  value={driveLink}
                  onChangeText={setDriveLink}
                  placeholder={t('sosyalMedya.bot.drivePlaceholder')}
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
                      <Text className="text-red-400 text-xs font-bold">{t('sosyalMedya.bot.disconnect')}</Text>
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
                      <Text className="text-[#003824] text-xs font-bold">{t('sosyalMedya.bot.connectAndSync')}</Text>
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
