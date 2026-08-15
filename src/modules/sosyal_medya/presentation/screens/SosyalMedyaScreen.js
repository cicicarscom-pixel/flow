import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  ImageBackground,
  Animated,
  Easing,
  Alert, 
  ActivityIndicator,
  Share,
  Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase , AnimatedBorderCard , GlobalAppBar } from '../../../../shared';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { CustomButton } from '../../../../shared';
const { width } = Dimensions.get('window');
const PLATFORMS_DATA = [
  { id: "facebook", name: "Facebook", color: "#1877F2", glow: "rgba(24,119,242,0.3)", icon: "👥" },
  { id: "instagram", name: "Instagram", color: "#E1306C", glow: "rgba(225,48,108,0.3)", icon: "📸" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", glow: "rgba(10,102,194,0.3)", icon: "💼" },
  { id: "twitter", name: "X", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "✖️" },
  { id: "tiktok", name: "TikTok", color: "#010101", glow: "rgba(105,201,208,0.3)", icon: "🎵" },
  { id: "youtube", name: "YouTube", color: "#FF0000", glow: "rgba(255,0,0,0.3)", icon: "▶️" },
  { id: "pinterest", name: "Pinterest", color: "#E60023", glow: "rgba(230,0,35,0.3)", icon: "📌" },
  { id: "googlebusiness", name: "GBP", color: "#4285F4", glow: "rgba(66,133,244,0.3)", icon: "🏢" },
  { id: "reddit", name: "Reddit", color: "#FF4500", glow: "rgba(255,69,0,0.3)", icon: "🤖" },
  { id: "telegram", name: "Telegram", color: "#2AABEE", glow: "rgba(42,171,238,0.3)", icon: "✈️" },
  { id: "bluesky", name: "Bluesky", color: "#0085ff", glow: "rgba(0,133,255,0.3)", icon: "☁️" },
  { id: "threads", name: "Threads", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "🧵" },
  { id: "snapchat", name: "Snapchat", color: "#fffc00", glow: "rgba(255,252,0,0.3)", icon: "👻" },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", glow: "rgba(37,211,102,0.3)", icon: "💬" },
  { id: "discord", name: "Discord", color: "#5865F2", glow: "rgba(88,101,242,0.3)", icon: "👾" },
  { id: "meta_ads", name: "Meta Ads", color: "#0668E1", glow: "rgba(6,104,225,0.3)", icon: "📈", isAd: true },
  { id: "google_ads", name: "Google Ads", color: "#EA4335", glow: "rgba(234,67,53,0.3)", icon: "📊", isAd: true },
  { id: "linkedin_ads", name: "LinkedIn Ads", color: "#0A66C2", glow: "rgba(10,102,194,0.3)", icon: "💼", isAd: true },
  { id: "tiktok_ads", name: "TikTok Ads", color: "#010101", glow: "rgba(255,255,255,0.3)", icon: "📱", isAd: true },
  { id: "pinterest_ads", name: "Pinterest Ads", color: "#E60023", glow: "rgba(230,0,35,0.3)", icon: "📌", isAd: true },
  { id: "x_ads", name: "X Ads", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "✖️", isAd: true },
];



export default function SosyalMedyaScreen({ navigation }) {
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const [isConnecting, setIsConnecting] = useState(false);
  const deepLinkUrl = Linking.useURL();
  
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [socialBotActive, setSocialBotActive] = useState(false);
  const [systemBotActive, setSystemBotActive] = useState(true);
  const [isUpdatingBot, setIsUpdatingBot] = useState(false);
  
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isProfilesDropdownOpen, setIsProfilesDropdownOpen] = useState(false);

  const fetchProfilesFromZernio = async () => {
    try {
      const { data } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'get-zernio-profiles', payload: {} }
      });
      if (data?.data?.profiles) {
        const fetchedProfiles = data.data.profiles;
        setProfiles(fetchedProfiles);
        const aiEsnaf = fetchedProfiles.find((p) => p.name === 'AI Esnaf Profil');
        if (aiEsnaf) setActiveProfile(aiEsnaf);
        else if (fetchedProfiles.length > 0) setActiveProfile(fetchedProfiles[0]);
      }
    } catch (err) {
      console.warn("Failed to fetch profiles", err);
    }
  };

  const handleCreateProfile = () => {
    Alert.prompt(
      "Yeni Profil",
      "Yeni profilin adını giriniz:",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Oluştur", 
          onPress: async (name) => {
            if (!name?.trim()) return;
            try {
              const { data } = await supabase.functions.invoke('zernio-client', {
                body: { action: 'add-zernio-profile', payload: { name: name.trim() } }
              });
              if (data?.data?.profile) {
                setProfiles(prev => [...prev, data.data.profile]);
                setActiveProfile(data.data.profile);
              } else if (data?.error) {
                Alert.alert("Hata", data.error);
              }
            } catch (err) {
              Alert.alert("Hata", "Profil oluşturulurken hata oluştu.");
            }
          }
        }
      ],
      "plain-text"
    );
  };

  const fetchAccountsFromZernio = async (showSuccessAlert = false) => {
    try {
      setIsLoadingAccounts(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        if (showSuccessAlert) Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        setIsLoadingAccounts(false);
        return;
      }

      await fetchProfilesFromZernio();

      // Fetch Bot Settings
      const { data: botSettings } = await supabase
        .from('bot_settings')
        .select('social_bot_active, is_active')
        .eq('merchant_id', userId)
        .single();
      
      if (botSettings) {
        if (botSettings.social_bot_active !== undefined) setSocialBotActive(botSettings.social_bot_active);
        if (botSettings.is_active !== undefined) setSystemBotActive(botSettings.is_active);
      }

      const { data, error } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'sync-accounts', payload: { userId } }
      });
      
      if (error || data?.error) {
        console.error("Fetch Error:", error || data?.error);
        if (showSuccessAlert) Alert.alert(t('sosyalMedya.alerts.error'), error?.message || data?.error);
        setIsLoadingAccounts(false);
        return;
      }

      const zernioAccounts = data?.data?.accounts || [];
      
      // Gelen veriyi arayüz için uygun formata çevir
      const formattedAccounts = zernioAccounts.map(acc => ({
        id: acc._id || acc.id || acc.accountId || acc.uuid,
        platform: acc.platform || 'unknown',
        account_name: acc.username || acc.displayName || acc.name || acc.platform,
        status: 'active'
      }));

      setSocialAccounts(formattedAccounts);
      
      if (showSuccessAlert) {
         if (formattedAccounts.length > 0) {
           Alert.alert(t('sosyalMedya.alerts.success'), t('sosyalMedya.alerts.accountsFetched'));
         } else {
           Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.noAccounts'));
         }
      }
    } catch (err) {
      console.log('Hesapları çekerken hata:', err);
      if (showSuccessAlert) Alert.alert(t('sosyalMedya.alerts.error'), err.message);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const saveZernioAccount = useCallback(async (params) => {
    try {
      const accountId = params.accountId;
      const platform = params.platform || params.connected;
      const username = params.username;
      
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) {
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        return;
      }
      
      const { error: upsertError } = await supabase.from('social_accounts').upsert({
        profile_id: userId,
        zernio_account_id: accountId,
        platform: platform || 'unknown',
        account_name: username || 'User',
        status: 'active'
      }, { onConflict: 'zernio_account_id' });
      
      let error = upsertError;
      
      if (error) {
        Alert.alert(t('sosyalMedya.alerts.dbError'), error.message || JSON.stringify(error));
      } else {
        Alert.alert(t('sosyalMedya.alerts.successExclamation'), t('sosyalMedya.alerts.accountConnected', { platform: platform || 'Hesap' }));
        fetchAccountsFromZernio();
      }
    } catch (err) {
      Alert.alert(t('sosyalMedya.alerts.saveError'), err.message);
    }
  }, []);

  useEffect(() => {
    if (deepLinkUrl) {
      const { queryParams } = Linking.parse(deepLinkUrl);
      if (queryParams?.accountId) {
        setTimeout(() => {
          saveZernioAccount(queryParams);
        }, 0);
      }
      // Sessizce yoksay: Expo Go ilk açılışta da bir deepLinkUrl gönderir.
    }
  }, [deepLinkUrl, saveZernioAccount]);
  
  const handleConnectZernio = async (platform) => {
    setIsConnecting(true);
    try {
      const redirectUrl = Linking.createURL('/sosyalmedya');
      const profileId = activeProfile?.id || activeProfile?._id || activeProfile?.profileId;
      const { data, error } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'get-connect-url', payload: { platform, redirectUrl, profileId } }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const resultData = data?.data;

      if (resultData?.authUrl) {
        if (platform === 'instagram') {
           Alert.alert(
             "Instagram Uygulaması Çakışması",
             "Cihazınızdaki Instagram uygulaması araya girip bağlantıyı engelliyor olabilir. En kesin çözüm linki kopyalayıp tarayıcınızda 'Gizli Sekme' (Incognito) üzerinden açmaktır.",
             [
               {
                 text: "Linki Paylaş / Kopyala",
                 onPress: () => Share.share({ message: resultData.authUrl })
               },
               {
                 text: "Yine de Uygulama İçi Dene",
                 onPress: async () => {
                    const browserResult = await WebBrowser.openAuthSessionAsync(resultData.authUrl, redirectUrl);
                    if (browserResult.type === 'success' && browserResult.url) {
                       const { queryParams } = Linking.parse(browserResult.url);
                       if (queryParams?.accountId) saveZernioAccount(queryParams);
                    }
                 }
               }
             ]
           );
        } else {
           const browserResult = await WebBrowser.openAuthSessionAsync(resultData.authUrl, redirectUrl);
           if (browserResult.type === 'success' && browserResult.url) {
              const { queryParams } = Linking.parse(browserResult.url);
              if (queryParams?.accountId) {
                saveZernioAccount(queryParams);
              }
           }
        }
      } else {
        Alert.alert(t('sosyalMedya.alerts.connectionError'), t('sosyalMedya.alerts.authUrlError'));
      }
    } catch (err) {
      Alert.alert(t('sosyalMedya.alerts.zernioConnectionError'), err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (accountId, platform) => {
    Alert.alert(
      t('sosyalMedya.alerts.disconnectTitle', 'Bağlantıyı Kes'),
      t('sosyalMedya.alerts.disconnectConfirm', `${platform} hesabınızın bağlantısını kesmek istediğinize emin misiniz?`),
      [
        { text: t('common.cancel', 'İptal'), style: 'cancel' },
        { 
          text: t('common.disconnect', 'Kes'), 
          style: 'destructive',
          onPress: async () => {
            try {
               setIsLoadingAccounts(true);
               
               // UI'dan anında kaldır (Optimistic Update)
               setSocialAccounts(prev => prev.filter(acc => acc.id !== accountId));
               
               await supabase.functions.invoke('zernio-client', {
                  body: { action: 'disconnect-account', payload: { accountId } }
               });
               await supabase.from('social_accounts').delete().eq('zernio_account_id', accountId);
               
               // Zernio ile eşitle
               await fetchAccountsFromZernio();
               
               Alert.alert(t('sosyalMedya.alerts.success', 'Başarılı'), t('sosyalMedya.alerts.disconnected', 'Hesap bağlantısı kesildi.'));
            } catch (err) {
               Alert.alert(t('sosyalMedya.alerts.error', 'Hata'), t('sosyalMedya.alerts.disconnectError', 'Bağlantı kesilirken bir sorun oluştu.'));
            } finally {
               setIsLoadingAccounts(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleBot = async (val) => {
    setSocialBotActive(val);
    setIsUpdatingBot(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (userId) {
         const { error } = await supabase
           .from('bot_settings')
           .update({ social_bot_active: val })
           .eq('merchant_id', userId);
         
         if (error) throw error;
      }
    } catch (error) {
       console.error("Bot ayarı güncellenirken hata:", error);
       Alert.alert("Hata", "Asistan ayarı güncellenemedi.");
       setSocialBotActive(!val); // Revert
    } finally {
       setIsUpdatingBot(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccountsFromZernio(false);
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Cybernetic Background */}
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>

      <GlobalAppBar 
        level={1} 
        module="sosyal" 
        title={t('sosyalMedya.ui.title')} 
        showProfile={true} 
        actions={[{ icon: 'auto-awesome', onPress: () => {} }]} 
      />

      <ScrollView 
        className="flex-1 w-full z-10" 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Top Buttons Grid */}
        <View className="flex-row justify-between mb-6">
          <View style={[styles.glassCard, { flex: 1, marginRight: 4, borderRadius: 12 }]}>
            <TouchableOpacity 
              className="py-3 px-1 flex-row items-center justify-center"
              onPress={() => navigation.navigate('Gönderiler')}
            >
              <Text className="text-[#4edea3] text-[10px] font-semibold text-center" numberOfLines={1}>{t('sosyalMedya.ui.allPosts')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.glassCard, { flex: 1, marginLeft: 4, borderRadius: 12 }]}>
            <TouchableOpacity 
              className="py-3 px-1 flex-row items-center justify-center"
              onPress={() => navigation.navigate('Inbox')}
            >
              <Text className="text-[#4edea3] text-[10px] font-semibold text-center" numberOfLines={1}>{t('sosyalMedya.ui.inbox')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sosyal Medya Asistanı Toggle (Taşındı) */}
        <View style={[styles.glassCard, { padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
           <View className="flex-row items-center">
             <Ionicons name="logo-instagram" size={24} color={socialBotActive ? "#4edea3" : "#666"} />
             <View className="ml-3">
               <Text className="text-[#e5e1e4] text-[14px] font-semibold">Sosyal Medya Asistanı</Text>
               <Text className="text-[10px] text-[#849495]">Yapay zeka DM ve yorumlara yanıt versin</Text>
             </View>
           </View>
           {isUpdatingBot ? (
             <ActivityIndicator size="small" color="#4edea3" />
           ) : (
             <Switch
                 value={socialBotActive}
                 onValueChange={handleToggleBot}
                 trackColor={{ false: '#2c2b2e', true: '#4edea3' }}
                 thumbColor={'#ffffff'}
                 disabled={!systemBotActive}
               />
           )}
        </View>

        {/* Analytics Button (Full Width) */}
        <View style={[styles.glassCard, { borderRadius: 12, marginBottom: 24 }]}>
          <CustomButton 
            onPress={() => navigation.navigate('Analytics')}
            title={t('sosyalMedya.ui.analytics')}
            className="bg-transparent py-3 px-4"
            textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
            leftIcon={<MaterialIcons name="insights" size={16} color="#4edea3" />}
          />
        </View>

        {/* Share Center Button (Full Width) */}
        <AnimatedBorderCard 
          style={styles.glowBorderMagenta} 
          colors={['#bc13fe', '#131314', '#bc13fe', '#131314']}
          padding={0}
          borderRadius={12}
          marginBottom={24}
        >
          <CustomButton 
            onPress={() => navigation.navigate('AiUretim')}
            title={t('sosyalMedya.ui.shareCenter')}
            className="bg-transparent py-3 px-4"
            textClassName="text-[#ebb2ff] text-[12px] font-bold uppercase tracking-widest"
            leftIcon={<MaterialIcons name="auto-awesome" size={16} color="#ebb2ff" />}
          />
        </AnimatedBorderCard>

        {/* Zernio Profile Management */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: '#b9cacb', fontSize: 12, fontWeight: '500', marginBottom: 8 }}>Platform Profiliniz (Zernio Workspace)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <TouchableOpacity 
              onPress={() => setIsProfilesDropdownOpen(!isProfilesDropdownOpen)}
              style={{ flex: 1, backgroundColor: 'rgba(28,27,28,0.8)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffb95f', marginRight: 12 }} />
                <Text style={{ color: '#e5e2e3', fontWeight: '500' }}>{activeProfile?.name || "Profil Seçin"}</Text>
              </View>
              <MaterialIcons name={isProfilesDropdownOpen ? "expand-less" : "expand-more"} size={20} color="#b9cacb" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCreateProfile}
              style={{ marginLeft: 12, backgroundColor: 'rgba(78,222,163,0.1)', borderColor: 'rgba(78,222,163,0.3)', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <MaterialIcons name="add" size={16} color="#4edea3" style={{ marginRight: 6 }} />
              <Text style={{ color: '#4edea3', fontWeight: '500', fontSize: 13 }}>Yeni Profil</Text>
            </TouchableOpacity>
          </View>
          
          {isProfilesDropdownOpen && (
            <View style={{ marginTop: 8, backgroundColor: '#1c1b1c', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                <Text style={{ color: '#b9cacb', fontSize: 10, fontWeight: '500' }}>All profiles</Text>
              </View>
              {profiles.map((p, idx) => {
                const isActive = activeProfile && (activeProfile.id === p.id || activeProfile._id === p._id);
                return (
                  <TouchableOpacity 
                    key={idx}
                    onPress={() => { setActiveProfile(p); setIsProfilesDropdownOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isActive ? 'rgba(78,222,163,0.05)' : 'transparent', borderBottomWidth: idx === profiles.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isActive ? '#4edea3' : 'rgba(229,226,227,0.4)', marginRight: 12 }} />
                      <Text style={{ color: isActive ? '#4edea3' : '#e5e2e3', fontWeight: isActive ? '600' : '400', fontSize: 14 }}>{p.name}</Text>
                    </View>
                    {isActive && <MaterialIcons name="check" size={16} color="#4edea3" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Add Account Panel */}
        <View style={{ marginBottom: 32 }}>
          <Text className="text-[#e5e1e4] text-[18px] font-semibold mb-4">{t('sosyalMedya.ui.addAccount')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingRight: 20, paddingLeft: 4 }}>
            {PLATFORMS_DATA.map((p) => {
               const isConnected = socialAccounts.some(acc => acc.platform.toLowerCase() === p.id);
               if (isConnected) return null; // Zaten bağlıysa gösterme
               return (
                 <View
                   key={p.id}
                   style={{
                     width: 140,
                     backgroundColor: 'rgba(32, 31, 34, 0.4)',
                     borderRadius: 16,
                     padding: 14,
                     marginRight: 12,
                     borderWidth: 1,
                     borderColor: p.glow.replace('0.3', '0.6'),
                     shadowColor: p.color,
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.5,
                     shadowRadius: 15,
                     elevation: 8,
                   }}
                 >
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                     <View style={{
                       width: 36, height: 36, borderRadius: 10,
                       backgroundColor: p.id === 'instagram' ? '#1c1b1c' : p.color,
                       alignItems: 'center', justifyContent: 'center',
                     }}>
                       {p.id === 'instagram' ? (
                          <LinearGradient
                            colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                            style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                             <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                          </LinearGradient>
                       ) : (
                         <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                       )}
                     </View>
                   </View>
                   
                   <Text style={{ fontWeight: '600', fontSize: 13, color: '#e5e2e3', marginBottom: 4 }}>{p.name}</Text>
                   <Text style={{ color: '#849495', fontSize: 10, marginBottom: 12 }}>Henüz bağlanmadı</Text>
                   
                   <TouchableOpacity 
                     onPress={() => handleConnectZernio(p.id)}
                     style={{ 
                       width: '100%', alignItems: 'center', justifyContent: 'center',
                       backgroundColor: p.glow.replace('0.3', '0.15'),
                       borderColor: p.glow.replace('0.3', '0.4'),
                       borderWidth: 1,
                       borderRadius: 8,
                       paddingVertical: 6,
                     }}
                   >
                     <Text style={{ color: p.color, fontSize: 10, fontWeight: '600' }}>Hesap Bağla</Text>
                   </TouchableOpacity>
                 </View>
               );
            })}
          </ScrollView>
        </View>

        <View className="flex-row justify-between items-center mt-2 mb-4">
          <Text className="text-[20px] font-semibold text-[#e5e2e3]">{t('sosyalMedya.ui.yourAccounts')}</Text>
          <CustomButton 
            onPress={() => fetchAccountsFromZernio(true)}
            title={t('sosyalMedya.ui.sync')}
            className="px-3 py-1.5 rounded-full bg-[#1c1b1c] border border-[#3b494b] p-0"
            textClassName="text-[#00f0ff] text-[12px] font-medium"
            leftIcon={<Ionicons name="sync" size={14} color="#00f0ff" />}
          />
        </View>

                {/* Main Platform Hub Panel */}
        <View style={{ marginBottom: 40 }}>
          {isLoadingAccounts ? (
            <ActivityIndicator size="small" color="#4edea3" style={{ marginVertical: 20 }} />
          ) : socialAccounts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingRight: 20, paddingLeft: 4 }}>
              {socialAccounts.map((acc, index) => {
                const platformInfo = PLATFORMS_DATA.find(p => p.id === acc.platform.toLowerCase()) || {
                  id: acc.platform, name: acc.platform, color: '#00f0ff', glow: 'rgba(0,240,255,0.3)', icon: 'logo-edge'
                };
                
                return (
                 <View
                   key={acc.id || index.toString()}
                   style={{
                     width: 140,
                     backgroundColor: 'rgba(32, 31, 34, 0.4)',
                     borderRadius: 16,
                     padding: 14,
                     marginRight: 12,
                     borderWidth: 1,
                     borderColor: platformInfo.glow.replace('0.3', '0.6'),
                     shadowColor: platformInfo.color,
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.5,
                     shadowRadius: 15,
                     elevation: 8,
                   }}
                 >
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                     <View style={{
                       width: 36, height: 36, borderRadius: 10,
                       backgroundColor: platformInfo.id === 'instagram' ? '#1c1b1c' : platformInfo.color,
                       alignItems: 'center', justifyContent: 'center',
                     }}>
                       {platformInfo.id === 'instagram' ? (
                          <LinearGradient
                            colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                            style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                             <Text style={{ fontSize: 18 }}>{platformInfo.icon}</Text>
                          </LinearGradient>
                       ) : (
                         <Text style={{ fontSize: 18 }}>{platformInfo.icon}</Text>
                       )}
                     </View>
                     
                     <View style={{ 
                       paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
                       backgroundColor: 'rgba(78,222,163,0.15)',
                       borderColor: 'rgba(78,222,163,0.3)', borderWidth: 1
                     }}>
                       <Text style={{ fontSize: 9, color: '#4edea3', fontWeight: '600' }}>✓ Bağlı</Text>
                     </View>
                   </View>
                   
                   <Text style={{ fontWeight: '600', fontSize: 13, color: '#e5e2e3', marginBottom: 4 }} numberOfLines={1}>
                     {acc.account_name ? `@${acc.account_name}` : platformInfo.name}
                   </Text>
                   <Text style={{ color: '#849495', fontSize: 10, marginBottom: 12 }}>Bağlı</Text>
                   
                   <TouchableOpacity 
                     onPress={() => handleDisconnect(acc.id, acc.platform)}
                     style={{ 
                       width: '100%', alignItems: 'center', justifyContent: 'center',
                       backgroundColor: 'rgba(255,255,255,0.05)',
                       borderColor: 'rgba(255,255,255,0.1)',
                       borderWidth: 1,
                       borderRadius: 8,
                       paddingVertical: 6,
                     }}
                   >
                     <Text style={{ color: '#b9cacb', fontSize: 10, fontWeight: '600' }}>Bağlantıyı Kes</Text>
                   </TouchableOpacity>
                 </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.glassCard, { padding: 20, borderRadius: 16 }]}>
              <Text className="text-[#849495] text-[12px] italic">{t('sosyalMedya.ui.noAccountsYet')}</Text>
            </View>
          )}
        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
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
  glowBorderCyan: {
    borderColor: 'rgba(0, 240, 255, 0.5)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  glowBorderMagenta: {
    borderColor: 'rgba(235, 178, 255, 0.5)',
    shadowColor: '#ebb2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  textShadowCyan: {
    textShadowColor: 'rgba(0, 219, 233, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  textShadowCyanSm: {
    textShadowColor: 'rgba(0, 240, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  shadowMagenta: {
    shadowColor: 'rgba(235, 178, 255, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  shadowCyan: {
    shadowColor: 'rgba(0, 240, 255, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  zernioPopup: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 192,
    backgroundColor: 'rgba(53, 52, 54, 0.95)',
    borderColor: '#b600f8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 15,
  },
  particleBottomRight: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    backgroundColor: '#00f0ff',
    borderRadius: 6,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  particleTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#00f0ff',
    borderRadius: 4,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  }
});


