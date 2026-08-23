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

// "Asistan çalışıyor" hissi — sadece görsel, diğer ekranlarla aynı desen.
const BreathingIcon = ({ active, children }) => {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => { if (loop) loop.stop(); };
  }, [active]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};
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
  
  const [organizationId, setOrganizationId] = useState(null);

  // --- Sadece görsel: ekran girişinde içerik yumuşakça belirir ---
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchOrganizationId = async (userId) => {
    if (!userId) return null;
    const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', userId).maybeSingle();
    return orgMember?.organization_id;
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

      let orgId = organizationId;
      if (!orgId) {
         orgId = await fetchOrganizationId(userId);
         setOrganizationId(orgId);
      }
      
      if (!orgId) {
         if (showSuccessAlert) Alert.alert(t('sosyalMedya.alerts.error'), 'Organizasyon bulunamadı.');
         setIsLoadingAccounts(false);
         return;
      }

      // Fetch Bot Settings
      const { data: botSettings } = await supabase
        .from('bot_settings')
        .select('social_bot_active, is_active')
        .eq('merchant_id', userId)
        .maybeSingle();
      
      if (botSettings) {
        if (botSettings.social_bot_active !== undefined) setSocialBotActive(botSettings.social_bot_active);
        if (botSettings.is_active !== undefined) setSystemBotActive(botSettings.is_active);
      }

      const { data, error } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'sync-accounts', payload: { organizationId: orgId } }
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
      
      let orgId = organizationId;
      if (!orgId) {
         orgId = await fetchOrganizationId(userId);
         setOrganizationId(orgId);
      }

      if (!orgId) return;

      const { error: upsertError } = await supabase.schema('integration').from('social_accounts').upsert({
        organization_id: orgId,
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
      
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) throw new Error(t('sosyalMedya.alerts.noSession'));

      let orgId = organizationId;
      if (!orgId) {
         orgId = await fetchOrganizationId(userId);
         setOrganizationId(orgId);
      }

      if (!orgId) throw new Error("Organizasyon bulunamadı");

      const { data, error } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'get-connect-url', payload: { platform, redirectUrl, organizationId: orgId } }
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
               await supabase.schema('integration').from('social_accounts').delete().eq('zernio_account_id', accountId);
               
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
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-5">
          <TouchableOpacity
            onPress={() => navigation.navigate('Gönderiler')}
            style={[styles.quickActionBtn, { marginRight: 8 }]}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIcon}>
              <MaterialIcons name="grid-view" size={16} color="#22B573" />
            </View>
            <Text style={styles.quickActionText} numberOfLines={1}>{t('sosyalMedya.ui.allPosts')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Inbox')}
            style={[styles.quickActionBtn, { marginLeft: 8 }]}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIcon}>
              <MaterialIcons name="forum" size={16} color="#22B573" />
            </View>
            <Text style={styles.quickActionText} numberOfLines={1}>{t('sosyalMedya.ui.inbox')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sosyal Medya Asistanı */}
        <View style={styles.aiCard}>
           <View className="flex-row items-center">
             <BreathingIcon active={socialBotActive && systemBotActive}>
               <View style={styles.aiIconWrapper}>
                 <Ionicons name="logo-instagram" size={20} color={socialBotActive ? "#22B573" : "#756D66"} />
               </View>
             </BreathingIcon>
             <View className="ml-3 flex-1">
               <Text className="text-[#F6F1EC] text-[14px] font-semibold">{t('sosyalMedya.assistant', { defaultValue: 'Sosyal Medya Asistanı' })}</Text>
               <Text className="text-[10px] text-[#A79E96] mt-0.5">{t('sosyalMedya.assistantDesc', { defaultValue: 'Yapay zeka DM ve yorumlara yanıt versin' })}</Text>
             </View>
           </View>
           {isUpdatingBot ? (
             <ActivityIndicator size="small" color="#22B573" />
           ) : (
             <Switch
                 value={socialBotActive}
                 onValueChange={handleToggleBot}
                 trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(34, 181, 115, 0.4)' }}
                 thumbColor={socialBotActive ? '#22B573' : '#ffffff'}
                 disabled={!systemBotActive}
               />
           )}
        </View>

        {/* Analytics + Paylaşım Merkezi */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('Analytics')}
            style={[styles.featureCard, { marginRight: 8 }]}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(34, 181, 115, 0.14)' }]}>
              <MaterialIcons name="insights" size={20} color="#22B573" />
            </View>
            <Text style={styles.featureCardText}>{t('sosyalMedya.ui.analytics')}</Text>
          </TouchableOpacity>

          <AnimatedBorderCard 
            style={[styles.glowBorderMagenta, { flex: 1, marginLeft: 8 }]} 
            colors={['#C2478D', '#201D24', '#C2478D', '#201D24']}
            padding={0}
            borderRadius={20}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('AiUretim')}
              style={{ padding: 16, alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(194, 71, 141, 0.14)' }]}>
                <MaterialIcons name="auto-awesome" size={20} color="#E8A8CD" />
              </View>
              <Text style={[styles.featureCardText, { color: '#E8A8CD' }]}>{t('sosyalMedya.ui.shareCenter')}</Text>
            </TouchableOpacity>
          </AnimatedBorderCard>
        </View>


        {/* Add Account Panel */}
        <View style={{ marginBottom: 32 }}>
          <Text className="text-[#F6F1EC] text-[18px] font-semibold mb-4">{t('sosyalMedya.ui.addAccount')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingRight: 20, paddingLeft: 4 }}>
            {PLATFORMS_DATA.map((p) => {
               const isConnected = socialAccounts.some(acc => {
                 const pid = acc.platform.toLowerCase();
                 return (pid.includes('google') ? 'googlebusiness' : pid) === p.id;
               });
               if (isConnected) return null; // Zaten bağlıysa gösterme
               return (
                 <View
                   key={p.id}
                   style={{
                     width: 148,
                     backgroundColor: 'rgba(32, 31, 34, 0.5)',
                     borderRadius: 20,
                     padding: 14,
                     marginRight: 12,
                     borderWidth: 1,
                     borderColor: p.glow.replace('0.3', '0.6'),
                     shadowColor: p.color,
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.35,
                     shadowRadius: 15,
                     elevation: 0,
                   }}
                 >
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                     <View style={{
                       width: 36, height: 36, borderRadius: 12,
                       backgroundColor: p.id === 'instagram' ? '#2A2631' : p.color,
                       alignItems: 'center', justifyContent: 'center',
                     }}>
                       {p.id === 'instagram' ? (
                          <LinearGradient
                            colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                            style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
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
                   
                   <Text style={{ fontWeight: '600', fontSize: 13, color: '#F6F1EC', marginBottom: 4 }}>{p.name}</Text>
                   <Text style={{ color: '#A79E96', fontSize: 10, marginBottom: 12 }}>{t('sosyalMedya.notConnected', { defaultValue: 'Henüz bağlanmadı' })}</Text>
                   
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
                     <Text style={{ color: p.color, fontSize: 10, fontWeight: '600' }}>{t('sosyalMedya.connectAccount', { defaultValue: 'Hesap Bağla' })}</Text>
                   </TouchableOpacity>
                 </View>
               );
            })}
          </ScrollView>
        </View>

        <View className="flex-row justify-between items-center mt-2 mb-4">
          <Text className="text-[20px] font-semibold text-[#F6F1EC]">{t('sosyalMedya.ui.yourAccounts')}</Text>
          <CustomButton 
            onPress={() => fetchAccountsFromZernio(true)}
            title={t('sosyalMedya.ui.sync')}
            className="px-3 py-1.5 rounded-full bg-[#2A2631] border border-[#3A3540] p-0"
            textClassName="text-[#22B573] text-[12px] font-medium"
            leftIcon={<Ionicons name="sync" size={14} color="#22B573" />}
          />
        </View>

                {/* Main Platform Hub Panel */}
        <View style={{ marginBottom: 40 }}>
          {isLoadingAccounts ? (
            <ActivityIndicator size="small" color="#22B573" style={{ marginVertical: 20 }} />
          ) : socialAccounts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingRight: 20, paddingLeft: 4 }}>
              {socialAccounts.map((acc, index) => {
                const rawPid = acc.platform.toLowerCase();
                const normalizedPid = rawPid.includes('google') ? 'googlebusiness' : rawPid;
                const platformInfo = PLATFORMS_DATA.find(p => p.id === normalizedPid) || {
                  id: acc.platform, name: acc.platform, color: '#22B573', glow: 'rgba(34, 181, 115,0.3)', icon: 'logo-edge'
                };
                
                return (
                 <View
                   key={acc.id || index.toString()}
                   style={{
                     width: 148,
                     backgroundColor: 'rgba(32, 31, 34, 0.5)',
                     borderRadius: 20,
                     padding: 14,
                     marginRight: 12,
                     borderWidth: 1,
                     borderColor: platformInfo.glow.replace('0.3', '0.6'),
                     shadowColor: platformInfo.color,
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.35,
                     shadowRadius: 15,
                     elevation: 0,
                   }}
                 >
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                     <View style={{
                       width: 36, height: 36, borderRadius: 12,
                       backgroundColor: platformInfo.id === 'instagram' ? '#2A2631' : platformInfo.color,
                       alignItems: 'center', justifyContent: 'center',
                     }}>
                       {platformInfo.id === 'instagram' ? (
                          <LinearGradient
                            colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                            style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
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
                       backgroundColor: 'rgba(34, 181, 115,0.15)',
                       borderColor: 'rgba(34, 181, 115,0.3)', borderWidth: 1
                     }}>
                       <Text style={{ fontSize: 9, color: '#22B573', fontWeight: '600' }}>✓ {t('sosyalMedya.connected', { defaultValue: 'Bağlı' })}</Text>
                     </View>
                   </View>
                   
                   <Text style={{ fontWeight: '600', fontSize: 13, color: '#F6F1EC', marginBottom: 4 }} numberOfLines={1}>
                     {acc.account_name ? `@${acc.account_name}` : platformInfo.name}
                   </Text>
                   <Text style={{ color: '#A79E96', fontSize: 10, marginBottom: 12 }}>{t('sosyalMedya.connected', { defaultValue: 'Bağlı' })}</Text>
                   
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
                     <Text style={{ color: '#A79E96', fontSize: 10, fontWeight: '600' }}>{t('sosyalMedya.disconnect', { defaultValue: 'Bağlantıyı Kes' })}</Text>
                   </TouchableOpacity>
                 </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.glassCard, { padding: 20, borderRadius: 16 }]}>
              <Text className="text-[#A79E96] text-[12px] italic">{t('sosyalMedya.ui.noAccountsYet')}</Text>
            </View>
          )}
        </View>

        </Animated.View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17151A',
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
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 38, 49, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,247,240,0.06)',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  quickActionIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(34, 181, 115, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#22B573',
    fontSize: 12,
    fontWeight: '700',
  },
  aiCard: {
    backgroundColor: 'rgba(42, 38, 49, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.2)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  aiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(34, 181, 115, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(42, 38, 49, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,247,240,0.06)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureCardText: {
    color: '#22B573',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  glowBorderCyan: {
    borderColor: 'rgba(34, 181, 115, 0.5)',
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 0,
  },
  glowBorderMagenta: {
    borderColor: 'rgba(235, 178, 255, 0.5)',
    shadowColor: '#E8A8CD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 0,
  },
  textShadowCyan: {
    textShadowColor: 'rgba(0, 219, 233, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  textShadowCyanSm: {
    textShadowColor: 'rgba(34, 181, 115, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  shadowMagenta: {
    shadowColor: 'rgba(235, 178, 255, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 0,
  },
  shadowCyan: {
    shadowColor: 'rgba(34, 181, 115, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 0,
  },
  zernioPopup: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 192,
    backgroundColor: 'rgba(53, 52, 54, 0.95)',
    borderColor: '#C2478D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 10,
  },
  particleBottomRight: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    backgroundColor: '#22B573',
    borderRadius: 8,
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  particleTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#22B573',
    borderRadius: 4,
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  }
});


