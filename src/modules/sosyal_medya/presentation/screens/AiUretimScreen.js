import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  Animated,
  Easing,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase , GlobalAppBar } from '../../../../shared';
import { CustomButton } from '../../../../shared';


const { width } = Dimensions.get('window');

const AnimatedBorderCard = ({ children, style, colors, padding = 20, borderRadius = 16, marginBottom = 0 }) => {
  const [spinValue] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 2, 
        duration: 4000, 
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

      return () => {
        spinValue.stopAnimation();
      };
    }, [spinValue])
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <View style={[style, { overflow: 'hidden', padding: 3.5, borderRadius, marginBottom, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      <Animated.View style={{ 
        position: 'absolute',
        top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
        transform: [{ rotate: spin }],
      }}>
        <LinearGradient
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#bc13fe', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      
      <View style={{ flex: 1, backgroundColor: '#131314', borderRadius: borderRadius - 3.5, padding }}>
        {children}
      </View>
    </View>
  );
};

let persistedImage = null;
let persistedText = null;

export default function AiUretimScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [localImage, setLocalImage] = useState(persistedImage);
  const [localText, setLocalText] = useState(persistedText);
  const [isSharing, setIsSharing] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);

  // Update local and persisted state when route params change
  React.useEffect(() => {
    if (route?.params?.selectedImage) {
      setTimeout(() => {
        setLocalImage(route.params.selectedImage);
      }, 0);
      persistedImage = route.params.selectedImage;
    }
    if (route?.params?.selectedText) {
      setTimeout(() => {
        setLocalText(route.params.selectedText);
      }, 0);
      persistedText = route.params.selectedText;
    }
  }, [route?.params]);

  const generateCaption = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingText(true);
    try {
      const isBase64 = localImage?.startsWith('data:image');
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `SADECE bir sosyal medya gönderi metni (caption) üret. KESİNLİKLE yeni bir görsel üretme (imagePrompt boş kalsın). Eğer sana bir görsel verildiyse o görseli analiz et ve şu kullanıcı talimatına göre metin yaz: ${aiPrompt}`,
          image: isBase64 ? localImage : undefined,
          mode: 'social'
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error);
      }

      if (data?.text) {
        setLocalText(data.text);
        persistedText = data.text;
      }
    } catch (err) {
      console.error("AI Metin Hatası:", err);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.generationError'));
    } finally {
      setIsGeneratingText(false);
      setAiPrompt('');
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        setIsSharing(false);
        return;
      }

      // 1. Fetch connected accounts
      const { data: accData, error: accError } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'sync-accounts', payload: { userId } }
      });
      
      const zernioAccounts = accData?.data?.accounts || [];
      if (zernioAccounts.length === 0) {
        Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.connectAccountFirst'));
        setIsSharing(false);
        return;
      }

      // 2. Prepare platforms for Zernio
      const targetPlatforms = zernioAccounts.map(acc => ({
        platform: acc.platform,
        accountId: acc._id || acc.id || acc.accountId || acc.uuid
      }));

      // 3. Prepare Media Items if we have an image
      let mediaItems = undefined;
      if (localImage) {
         mediaItems = [{
           type: 'image',
           url: localImage
         }];
      }

      const contentToShare = localText || prompt || t('sosyalMedya.generate.fallbackContent');

      // 4. Create Post via Edge Function
      const { data: postData, error: postError } = await supabase.functions.invoke('zernio-client', {
        body: { 
          action: 'create-post', 
          payload: { 
            content: contentToShare,
            platforms: targetPlatforms,
            publishNow: true,
            mediaItems: mediaItems
          } 
        }
      });

      if (postError || postData?.error) {
        console.error("Paylaşım Hatası:", postError || postData?.error);
        Alert.alert(t('sosyalMedya.alerts.shareFailedTitle'), t('sosyalMedya.alerts.shareFailedMessage'));
      } else {
        // Profilin varlığından emin ol (Foreign Key hatasını engellemek için)
        const { data: hasProfile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
        if (!hasProfile) {
          const { error: profileError } = await supabase.functions.invoke('zernio-client', {
            body: { action: 'create-profile', payload: { userId } }
          });
          if (profileError) {
             console.error("Profile Oluşturma Hatası:", profileError);
             throw new Error(`Profil oluşturulamadı: ${profileError.message}`);
          }
        }

        const zPostId = postData?.data?.id || postData?.id || postData?.data?._id || 'unknown';
        
        // Extract media URLs if Zernio returned them, otherwise fallback to localImage (even if it's base64)
        let finalMediaUrls = localImage ? [localImage] : [];
        if (postData?.data?.mediaItems) {
           finalMediaUrls = postData.data.mediaItems.map(m => m.url).filter(Boolean);
        } else if (postData?.mediaItems) {
           finalMediaUrls = postData.mediaItems.map(m => m.url).filter(Boolean);
        }

        const { error: dbError } = await supabase.from('posts').insert({
           profile_id: userId,
           zernio_post_id: zPostId,
           content: contentToShare,
           media_urls: finalMediaUrls,
           status: 'published',
           platforms: targetPlatforms.map(p => p.platform)
        });

        if (dbError) {
           console.error("DB Kayıt Hatası:", dbError);
           // Sadece logla, kullanıcıya paylaşım başarılı oldu de çünkü Zernio'ya gitti
        }

        Alert.alert(t('sosyalMedya.alerts.successExclamation'), t('sosyalMedya.alerts.shareSuccessMessage'));
      }

    } catch (err) {
      console.error("Paylaşım istisnası:", err);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.unexpectedError'));
    } finally {
      setIsSharing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLocalImage(base64Image);
        persistedImage = base64Image;
      }
    } catch (error) {
      console.error("Resim seçme hatası:", error);
      Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.imageSelectError'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>

      <GlobalAppBar 
        level={3} 
        module="sosyal" 
        title={t('sosyalMedya.generate.title')} 
        showProfile={false} 
        actions={[{ icon: 'more-vert', onPress: () => {} }]} 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.Version < 30 ? 'padding' : undefined)}
      >
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        
        {/* Input Section */}
        <View className="mb-6">
          <Text className="text-[#b9cacb] text-xs font-medium uppercase tracking-wider mb-2 ml-1">{t('sosyalMedya.generate.whatToShare')}</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder={t('sosyalMedya.generate.promptPlaceholder')}
            placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="w-full bg-[#1c1b1c]/50 rounded-lg border border-white/10 text-[#e5e2e3] text-base p-3 min-h-[100px]"
            multiline={true}
            textAlignVertical="top"
          />
        </View>

        {/* Central Feature: Image Container */}
        <View className="items-center w-full mb-6 relative">
          <AnimatedBorderCard 
            style={{ width: '100%', aspectRatio: 1, maxWidth: 350 }} 
            colors={['#00f0ff', '#ffffff']} 
            padding={0} 
            borderRadius={24}
          >
            <TouchableOpacity 
              className="flex-1 items-center justify-center bg-[#2a2a2b]/50 overflow-hidden relative" 
              style={{ borderRadius: 24 }}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {localImage ? (
                <>
                  <Image source={{ uri: localImage }} className="w-full h-full" resizeMode="cover" />
                  <View className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2">
                    <MaterialIcons name="edit" size={20} color="#fff" />
                  </View>
                </>
              ) : (
                <>
                  <View className="mb-4 bg-[#00f0ff]/10 rounded-full p-4 border border-[#00f0ff]/30 border-dashed">
                    <MaterialIcons name="add-photo-alternate" size={48} color="#00f0ff" />
                  </View>
                  <Text className="text-[#b9cacb] text-base text-center px-4 font-medium mb-1">
                    {t('sosyalMedya.generate.selectOrGenerate')}
                  </Text>
                  <Text className="text-[#b9cacb]/60 text-xs text-center px-8">
                    {t('sosyalMedya.generate.imageHint')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </AnimatedBorderCard>
        </View>

        {/* Caption Editor */}
        <AnimatedBorderCard 
            style={{ width: '100%' }} 
            colors={['#bc13fe', '#ffffff']} 
            padding={20} 
            borderRadius={20}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#e5e2e3] text-lg font-semibold">{t('sosyalMedya.generate.contentTitle')}</Text>
            <TouchableOpacity 
              className="p-1"
              onPress={() => setIsEditingCaption(!isEditingCaption)}
            >
              <MaterialIcons name={isEditingCaption ? "check" : "edit"} size={20} color={isEditingCaption ? "#bc13fe" : "#00f0ff"} />
            </TouchableOpacity>
          </View>
          
          <View className={`bg-[#0e0e0f]/50 rounded-lg p-3 border ${isEditingCaption ? 'border-[#bc13fe]' : 'border-white/5'} min-h-[200px] mb-4`}>
            {isEditingCaption ? (
              <TextInput
                value={localText}
                onChangeText={(txt) => { setLocalText(txt); persistedText = txt; }}
                multiline
                autoFocus
                textAlignVertical="top"
                className="text-[#e5e2e3] text-sm leading-5 p-0 m-0 min-h-[180px]"
                placeholder={t('sosyalMedya.generate.contentPlaceholder')}
                placeholderTextColor="rgba(185, 202, 203, 0.5)"
              />
            ) : (
              <Text className="text-[#b9cacb]/80 text-sm leading-5">
                {localText ? localText : t('sosyalMedya.generate.contentEmpty')}
              </Text>
            )}
          </View>

          {/* AI Chat Input for Caption */}
          <View className="flex-row items-center mb-4">
            <TextInput
               value={aiPrompt}
               onChangeText={setAiPrompt}
               placeholder={t('sosyalMedya.generate.aiChatPlaceholder')}
               placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="flex-1 bg-[#1c1b1c] rounded-full px-4 py-2 text-[#e5e2e3] border border-[#3b494b]"
               multiline={false}
               onSubmitEditing={generateCaption}
            />
            <TouchableOpacity 
               onPress={generateCaption} 
               disabled={isGeneratingText}
               className={`ml-2 w-10 h-10 rounded-full bg-[#bc13fe] items-center justify-center ${isGeneratingText ? 'opacity-50' : ''}`}
            >
              {isGeneratingText ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-[#00f0ff]/10 px-3 py-1 rounded-full border border-[#00f0ff]/20">
              <Text className="text-[#00f0ff] text-xs font-medium">{t('sosyalMedya.generate.tagSummer')}</Text>
            </View>
            <View className="bg-[#00f0ff]/10 px-3 py-1 rounded-full border border-[#00f0ff]/20">
              <Text className="text-[#00f0ff] text-xs font-medium">{t('sosyalMedya.generate.tagNewSeason')}</Text>
            </View>
            <TouchableOpacity className="px-2 flex-row items-center">
              <MaterialIcons name="add" size={16} color="#b9cacb" />
              <Text className="text-[#b9cacb] text-xs font-medium ml-1">{t('sosyalMedya.generate.addTag')}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedBorderCard>

      </ScrollView>

      </KeyboardAvoidingView>
      
      {/* Action Button (Fixed Bottom) */}
      {!isKeyboardVisible && (
      <View className="absolute bottom-0 left-0 w-full px-5 pb-10 pt-4" pointerEvents="box-none">
        <LinearGradient
          colors={['transparent', '#0A0A0B', '#0A0A0B']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.4, 1]}
        />
        <TouchableOpacity 
          className="w-full" 
          onPress={handleShare}
          disabled={isSharing}
        >
          <LinearGradient
            colors={['#00f0ff', '#bc13fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className={`rounded-full py-4 px-6 flex-row items-center justify-center shadow-[0_4px_15px_rgba(0,240,255,0.3)] ${isSharing ? 'opacity-50' : ''}`}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#00363a" style={{ marginRight: 8 }} />
            ) : (
              <MaterialIcons name="send" size={20} color="#00363a" style={{ marginRight: 8 }} />
            )}
            <Text className="text-[#00363a] font-bold text-lg">
              {isSharing ? t('sosyalMedya.generate.sharing') : t('sosyalMedya.generate.shareSelected')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      )}
      
    </SafeAreaView>
  );
}
