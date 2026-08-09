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
      const { accountId, platform, username } = params;
      
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) {
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        return;
      }
      
      // Önce bu zernio_account_id ile kayıt var mı kontrol et
      const { data: existingAccounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('zernio_account_id', accountId);

      let error = null;
      if (existingAccounts && existingAccounts.length > 0) {
        // Zaten var, güncelle
        const { error: updateError } = await supabase.from('social_accounts')
          .update({
            platform: platform || 'unknown',
            account_name: username || 'User',
            status: 'active'
          })
          .eq('zernio_account_id', accountId);
        error = updateError;
      } else {
        // Yeni ekle
        const { error: insertError } = await supabase.from('social_accounts').insert({
          profile_id: userId,
          zernio_account_id: accountId,
          platform: platform || 'unknown',
          account_name: username || 'User',
          status: 'active'
        });
        error = insertError;
      }
      
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
      const { data, error } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'get-connect-url', payload: { platform, redirectUrl } }
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
              onPress={() => navigation.navigate('DigitalAssistant')}
            >
              <Text className="text-[#4edea3] text-[10px] font-semibold text-center" numberOfLines={1}>{t('sosyalMedya.ui.createPost')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.glassCard, { flex: 1, marginHorizontal: 4, borderRadius: 12 }]}>
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

        {/* Add Account Panel */}
        <View style={[styles.glassCard, { padding: 20, borderRadius: 16, marginBottom: 24 }]}>
          <Text className="text-[#e5e1e4] text-[18px] font-semibold mb-4">{t('sosyalMedya.ui.addAccount')}</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <View className="flex-row items-center">
              {/* Facebook */}
              <TouchableOpacity onPress={() => handleConnectZernio('facebook')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Facebook</Text>
              </TouchableOpacity>
              
              {/* Instagram */}
              <TouchableOpacity onPress={() => handleConnectZernio('instagram')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full bg-[#2a2a2b] items-center justify-center mb-1 border border-[#ebb2ff]/50" style={styles.glowBorderMagenta}>
                  <Ionicons name="logo-instagram" size={24} color="#ebb2ff" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Instagram</Text>
              </TouchableOpacity>

              {/* LinkedIn */}
              <TouchableOpacity onPress={() => handleConnectZernio('linkedin')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">LinkedIn</Text>
              </TouchableOpacity>

              {/* Twitter/X */}
              <TouchableOpacity onPress={() => handleConnectZernio('twitter')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-twitter" size={24} color="#fff" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">X</Text>
              </TouchableOpacity>

              {/* TikTok */}
              <TouchableOpacity onPress={() => handleConnectZernio('tiktok')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-tiktok" size={24} color="#fff" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">TikTok</Text>
              </TouchableOpacity>

              {/* YouTube */}
              <TouchableOpacity onPress={() => handleConnectZernio('youtube')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">YouTube</Text>
              </TouchableOpacity>

              {/* Pinterest */}
              <TouchableOpacity onPress={() => handleConnectZernio('pinterest')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-pinterest" size={24} color="#E60023" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Pinterest</Text>
              </TouchableOpacity>

              {/* Google Business */}
              <TouchableOpacity onPress={() => handleConnectZernio('googlebusiness')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="business" size={24} color="#4285F4" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">GBP</Text>
              </TouchableOpacity>

              {/* Reddit */}
              <TouchableOpacity onPress={() => handleConnectZernio('reddit')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-reddit" size={24} color="#FF4500" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Reddit</Text>
              </TouchableOpacity>

              {/* Telegram */}
              <TouchableOpacity onPress={() => handleConnectZernio('telegram')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="paper-plane" size={24} color="#2AABEE" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Telegram</Text>
              </TouchableOpacity>

              {/* Bluesky */}
              <TouchableOpacity onPress={() => handleConnectZernio('bluesky')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="cloud" size={24} color="#0085ff" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Bluesky</Text>
              </TouchableOpacity>

              {/* Threads */}
              <TouchableOpacity onPress={() => handleConnectZernio('threads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="at" size={24} color="#fff" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Threads</Text>
              </TouchableOpacity>

              {/* Snapchat */}
              <TouchableOpacity onPress={() => handleConnectZernio('snapchat')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-snapchat" size={24} color="#fffc00" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Snapchat</Text>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity onPress={() => handleConnectZernio('whatsapp')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">WhatsApp</Text>
              </TouchableOpacity>

              {/* Discord */}
              <TouchableOpacity onPress={() => handleConnectZernio('discord')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1">
                  <Ionicons name="logo-discord" size={24} color="#5865F2" />
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Discord</Text>
              </TouchableOpacity>

              {/* Meta Ads */}
              <TouchableOpacity onPress={() => handleConnectZernio('meta_ads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1 relative">
                  <Ionicons name="megaphone" size={20} color="#0668E1" />
                  <Text className="text-[8px] text-[#0668E1] absolute bottom-2">Ads</Text>
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Meta Ads</Text>
              </TouchableOpacity>

              {/* Google Ads */}
              <TouchableOpacity onPress={() => handleConnectZernio('google_ads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1 relative">
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                  <Text className="text-[8px] text-[#EA4335] absolute bottom-2">Ads</Text>
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Google Ads</Text>
              </TouchableOpacity>

              {/* LinkedIn Ads */}
              <TouchableOpacity onPress={() => handleConnectZernio('linkedin_ads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1 relative">
                  <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                  <Text className="text-[8px] text-[#0A66C2] absolute bottom-2">Ads</Text>
                </View>
                <Text className="text-[10px] text-[#b9cacb]">LinkedIn Ads</Text>
              </TouchableOpacity>

              {/* TikTok Ads */}
              <TouchableOpacity onPress={() => handleConnectZernio('tiktok_ads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1 relative">
                  <Ionicons name="logo-tiktok" size={20} color="#fff" />
                  <Text className="text-[8px] text-[#fff] absolute bottom-2">Ads</Text>
                </View>
                <Text className="text-[10px] text-[#b9cacb]">TikTok Ads</Text>
              </TouchableOpacity>

              {/* Pinterest Ads */}
              <TouchableOpacity onPress={() => handleConnectZernio('pinterest_ads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1 relative">
                  <Ionicons name="logo-pinterest" size={20} color="#E60023" />
                  <Text className="text-[8px] text-[#E60023] absolute bottom-2">Ads</Text>
                </View>
                <Text className="text-[10px] text-[#b9cacb]">Pinterest Ads</Text>
              </TouchableOpacity>

              {/* X Ads */}
              <TouchableOpacity onPress={() => handleConnectZernio('x_ads')} className="items-center mr-3">
                <View className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mb-1 relative">
                  <Ionicons name="close" size={20} color="#fff" />
                  <Text className="text-[8px] text-[#fff] absolute bottom-2">Ads</Text>
                </View>
                <Text className="text-[10px] text-[#b9cacb]">X Ads</Text>
              </TouchableOpacity>

              {isConnecting && (
                <View className="ml-2">
                  <ActivityIndicator size="small" color="#4edea3" />
                </View>
              )}
            </View>
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
        <View style={[styles.glassCard, { padding: 20, borderRadius: 16, marginBottom: 40 }]}>
          <View className="flex-row flex-wrap justify-start">
            {isLoadingAccounts ? (
              <ActivityIndicator size="small" color="#4edea3" />
            ) : socialAccounts.length > 0 ? (
              socialAccounts.map((acc, index) => {
                const platformColor = acc.platform.toLowerCase() === 'instagram' ? '#ebb2ff' : 
                                      acc.platform.toLowerCase() === 'facebook' ? '#00f0ff' : '#0077b5';
                const borderColor = acc.platform.toLowerCase() === 'instagram' ? 'border-[#b600f8]' : 'border-[#00f0ff]';
                
                return (
                  <View key={acc.id || index.toString()} className="items-center mr-6 mb-4">
                    <View className={`w-20 h-20 rounded-full border-2 ${borderColor} items-center justify-center bg-[#1c1b1c] mb-3`}>
                      <Ionicons name={`logo-${acc.platform.toLowerCase()}`} size={32} color={platformColor} />
                    </View>
                    <View className="items-center">
                      <Text className="text-[10px] text-[#e5e2e3] w-20 text-center" numberOfLines={1}>
                        {acc.account_name ? `@${acc.account_name}` : acc.platform}
                      </Text>
                      <Text className="text-[10px] text-[#4edea3] mt-0.5">{t('sosyalMedya.ui.active')}</Text>
                      
                      <TouchableOpacity 
                         onPress={() => handleDisconnect(acc.id, acc.platform)}
                         className="mt-2 py-1 px-3 border border-[#ff0050]/50 rounded-full bg-[#ff0050]/10"
                      >
                         <Text className="text-[9px] text-[#ff0050] font-semibold uppercase">{t('common.disconnect', 'Kaldır')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text className="text-[#849495] text-[12px] italic">{t('sosyalMedya.ui.noAccountsYet')}</Text>
            )}
          </View>
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


