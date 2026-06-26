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
  Easing
, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase , AnimatedBorderCard , GlobalAppBar } from '../../../../shared';
import * as Linking from 'expo-linking';

import { CustomButton } from '../../../../shared';



const { width } = Dimensions.get('window');


export default function SosyalMedyaScreen({ navigation }) {
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const [isConnecting, setIsConnecting] = useState(false);
  const deepLinkUrl = Linking.useURL();
  
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

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
        Linking.openURL(resultData.authUrl);
      } else {
        Alert.alert(t('sosyalMedya.alerts.connectionError'), t('sosyalMedya.alerts.authUrlError'));
      }
    } catch (err) {
      Alert.alert(t('sosyalMedya.alerts.zernioConnectionError'), err.message);
    } finally {
      setIsConnecting(false);
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
          <AnimatedBorderCard 
            style={[styles.glowBorderCyan, { flex: 1, marginRight: 4 }]} 
            colors={['#00f0ff', '#131314', '#00f0ff', '#131314']}
            padding={0}
            borderRadius={12}
          >
            <TouchableOpacity 
              className="py-3 px-1 flex-row items-center justify-center"
              onPress={() => navigation.navigate('DigitalAssistant')}
            >
              <Text className="text-[#00f0ff] text-[10px] font-semibold text-center" numberOfLines={1}>{t('sosyalMedya.ui.createPost')}</Text>
            </TouchableOpacity>
          </AnimatedBorderCard>

          <AnimatedBorderCard 
            style={[styles.glowBorderCyan, { flex: 1, marginHorizontal: 4 }]} 
            colors={['#bc13fe', '#131314', '#bc13fe', '#131314']}
            padding={0}
            borderRadius={12}
          >
            <TouchableOpacity 
              className="py-3 px-1 flex-row items-center justify-center"
              onPress={() => navigation.navigate('AiUretim')}
            >
              <Text className="text-[#00f0ff] text-[10px] font-semibold text-center" numberOfLines={1}>{t('sosyalMedya.ui.shareCenter')}</Text>
            </TouchableOpacity>
          </AnimatedBorderCard>
          
          <AnimatedBorderCard 
            style={[styles.glowBorderMagenta, { flex: 1, marginLeft: 4 }]} 
            colors={['#ebb2ff', '#131314', '#ebb2ff', '#131314']}
            padding={0}
            borderRadius={12}
          >
            <TouchableOpacity 
              className="py-3 px-1 flex-row items-center justify-center"
              onPress={() => navigation.navigate('Inbox')}
            >
              <Text className="text-[#00f0ff] text-[10px] font-semibold text-center" numberOfLines={1}>{t('sosyalMedya.ui.inbox')}</Text>
            </TouchableOpacity>
          </AnimatedBorderCard>
        </View>

        {/* Analytics Button (Full Width) */}
        <AnimatedBorderCard 
          style={styles.glowBorderCyan} 
          colors={['#00f0ff', '#131314', '#00f0ff', '#131314']}
          padding={0}
          borderRadius={12}
          marginBottom={24}
        >
          <CustomButton 
            onPress={() => navigation.navigate('Analytics')}
            title={t('sosyalMedya.ui.analytics')}
            className="bg-transparent py-3 px-4"
            textClassName="text-[#00f0ff] text-[12px] font-bold uppercase tracking-widest"
            leftIcon={<MaterialIcons name="insights" size={16} color="#00f0ff" />}
          />
        </AnimatedBorderCard>

        {/* Posts Button (Full Width) */}
        <AnimatedBorderCard 
          style={styles.glowBorderCyan} 
          colors={['#00f0ff', '#131314', '#00f0ff', '#131314']}
          padding={0}
          borderRadius={12}
          marginBottom={24}
        >
          <CustomButton 
            onPress={() => navigation.navigate('Gönderiler')}
            title={t('sosyalMedya.ui.allPosts')}
            className="bg-transparent py-3 px-4"
            textClassName="text-[#00f0ff] text-[12px] font-bold uppercase tracking-widest"
            leftIcon={<MaterialIcons name="dynamic-feed" size={16} color="#00f0ff" />}
          />
        </AnimatedBorderCard>

        {/* Add Account Panel */}
        <AnimatedBorderCard 
          style={styles.glowBorderCyan} 
          colors={['#00f0ff', '#bc13fe', '#00f0ff', '#bc13fe']}
          padding={20} 
          borderRadius={16} 
          marginBottom={24}
        >
          <Text className="text-[#7df4ff] text-[20px] font-semibold mb-4">{t('sosyalMedya.ui.addAccount')}</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <View className="flex-row items-center">
              {/* Facebook */}
              <TouchableOpacity 
                onPress={() => handleConnectZernio('facebook')}
                className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mr-3"
              >
                <Ionicons name="logo-facebook" size={24} color="#b9cacb" />
              </TouchableOpacity>
              
              {/* Instagram */}
              <TouchableOpacity 
                onPress={() => handleConnectZernio('instagram')}
                className="w-14 h-14 rounded-full bg-[#2a2a2b] items-center justify-center mr-3 border border-[#ebb2ff]/50" style={styles.glowBorderMagenta}
              >
                <Ionicons name="logo-instagram" size={24} color="#ebb2ff" />
              </TouchableOpacity>

              {/* LinkedIn */}
              <TouchableOpacity 
                onPress={() => handleConnectZernio('linkedin')}
                className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mr-3"
              >
                <Ionicons name="logo-linkedin" size={24} color="#b9cacb" />
              </TouchableOpacity>

              {/* Twitter/X (Not supported yet) */}
              <TouchableOpacity 
                onPress={() => Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.twitterSoon'))}
                className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mr-3 opacity-60"
              >
                <Ionicons name="close" size={24} color="#b9cacb" />
              </TouchableOpacity>

              {/* TikTok (Not supported yet) */}
              <TouchableOpacity 
                onPress={() => Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.tiktokSoon'))}
                className="w-14 h-14 rounded-full border border-[#3b494b] bg-[#1c1b1c] items-center justify-center mr-3 opacity-60"
              >
                <Ionicons name="musical-notes" size={24} color="#b9cacb" />
              </TouchableOpacity>
              
              {isConnecting && (
                <View className="ml-2">
                  <ActivityIndicator size="small" color="#00f0ff" />
                </View>
              )}
            </View>
          </ScrollView>
        </AnimatedBorderCard>

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
        <AnimatedBorderCard 
          style={styles.glowBorderCyan} 
          colors={['#00f0ff', '#bc13fe', '#00f0ff', '#bc13fe']}
          padding={20} 
          borderRadius={16}
          marginBottom={40}
        >
          <View className="flex-row flex-wrap justify-start">
            {isLoadingAccounts ? (
              <ActivityIndicator size="small" color="#00f0ff" />
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
                      <Text className="text-[10px] text-[#00f0ff] mt-0.5" style={styles.textShadowCyanSm}>{t('sosyalMedya.ui.active')}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text className="text-[#849495] text-[12px] italic">{t('sosyalMedya.ui.noAccountsYet')}</Text>
            )}
          </View>

          {/* Decorative particles */}
          <View style={styles.particleBottomRight} />
          <View style={styles.particleTopRight} />
        </AnimatedBorderCard>

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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
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
