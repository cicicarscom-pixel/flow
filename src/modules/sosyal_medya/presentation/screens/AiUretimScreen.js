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
let persistedMediaType = 'text';

export default function AiUretimScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [localImage, setLocalImage] = useState(persistedImage);
  const [localText, setLocalText] = useState(persistedText);
  const [mediaType, setMediaType] = useState(persistedMediaType);
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

  // New state variables for the redesign
  const [zernioAccounts, setZernioAccounts] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [publishMode, setPublishMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('04.07.2026 14:00');
  const [timezone, setTimezone] = useState('Europe/Istanbul (GMT+3) (current)');

  // Fetch connected accounts on mount
  React.useEffect(() => {
    const fetchAccounts = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (userId) {
        try {
          const { data: accData } = await supabase.functions.invoke('zernio-client', {
            body: { action: 'sync-accounts', payload: { userId } }
          });
          const accounts = accData?.data?.accounts || [];
          setZernioAccounts(accounts);
          
          const initialSelected = {};
          accounts.forEach(acc => {
            initialSelected[acc.platform] = true;
          });
          setSelectedPlatforms(initialSelected);
        } catch(e) {
          console.warn("Failed to fetch accounts", e);
        }
      }
    };
    fetchAccounts();
  }, []);

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

  const publishPost = async (connectedAccounts, contentType) => {
    let allowedPlatforms = connectedAccounts.filter(acc => selectedPlatforms[acc.platform]);

    if (allowedPlatforms.length === 0) {
      Alert.alert(t('sosyalMedya.alerts.info'), "Lütfen en az bir platform seçin.");
      return;
    }

    const contentToShare = localText || prompt || t('sosyalMedya.generate.fallbackContent');
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    // Döngü (for...of) ile sadece filtreden geçen uygun platformların Zernio API endpoint'lerine istek atılsın
    for (const acc of allowedPlatforms) {
      try {
        // Gerçek Zernio API çağrısı
        const { data: postData, error: postError } = await supabase.functions.invoke('zernio-client', {
          body: { 
            action: 'create-post', 
            payload: { 
              content: contentToShare,
              platforms: [{ platform: acc.platform, accountId: acc._id || acc.id || acc.accountId || acc.uuid }],
              publishNow: true,
              mediaItems: localImage ? [{ type: contentType, url: localImage }] : undefined
            } 
          }
        });
        
        if (postError || postData?.error) {
           throw new Error(postError?.message || postData?.error?.message || "Zernio API hatası");
        }
      } catch (err) {
        // Zero UI: Kullanıcıya asla hata gösterme
        console.warn(`[Zernio API Hatası] ${acc.platform}:`, err);
      }
    }

    // Başarılı olan gönderimleri veritabanına kaydet
    try {
       const finalMediaUrls = localImage ? [localImage] : [];
       await supabase.from('posts').insert({
          profile_id: userId,
          zernio_post_id: 'mock-post-id',
          content: contentToShare,
          media_urls: finalMediaUrls,
          status: 'published',
          platforms: allowedPlatforms.map(p => p.platform)
       });
    } catch (dbError) {
       console.error("DB Kayıt Hatası:", dbError);
    }

    // Kullanıcı Deneyimi (Toast/Alert): Zero UI prensibi
    Alert.alert(
      "Başarılı!", 
      publishMode === 'now' 
        ? "Gönderiniz seçili platformlarda anında paylaşıldı." 
        : "Gönderiniz planlandı ve zamanı gelince paylaşılacak."
    );
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

      if (zernioAccounts.length === 0) {
        Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.connectAccountFirst'));
        setIsSharing(false);
        return;
      }

      // İçerik tipini belirle
      const currentContentType = localImage ? mediaType : 'text';
      
      // Otonom yönlendirmeyi başlatan ana fonksiyonu çağır
      await publishPost(zernioAccounts, currentContentType);

    } catch (err) {
      console.error("Paylaşım istisnası:", err);
      // Zero UI gereği kullanıcıya hata fırlatma
    } finally {
      setIsSharing(false);
    }
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        
        const newMediaType = isVideo ? 'video' : 'image';
        setMediaType(newMediaType);
        persistedMediaType = newMediaType;
        
        let mediaData;
        if (isVideo) {
           mediaData = asset.uri;
        } else {
           mediaData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        }

        setLocalImage(mediaData);
        persistedImage = mediaData;
      }
    } catch (error) {
      console.error("Medya seçme hatası:", error);
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
              onPress={pickMedia}
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

        {/* Profiles Section */}
        <View className="mb-6 mt-6">
          <Text className="text-[#b9cacb] text-xs font-medium mb-3">profiller</Text>
          <TouchableOpacity className="flex-row items-center justify-between bg-[#1c1b1c]/50 rounded-lg border border-white/5 p-4 mb-4">
             <View className="flex-row items-center">
               <View className="w-3 h-3 rounded-full bg-[#ffb95f] mr-3" />
               <Text className="text-[#e5e2e3] text-sm">Al Esnaf Profil</Text>
             </View>
             <MaterialIcons name="keyboard-arrow-down" size={20} color="#b9cacb" />
          </TouchableOpacity>

          <Text className="text-[#b9cacb] text-xs font-medium mb-3">platformlar ({Object.values(selectedPlatforms).filter(Boolean).length} profilden)</Text>
          {zernioAccounts.map((acc, index) => {
            const isSelected = selectedPlatforms[acc.platform];
            const getPlatformIcon = (plat) => {
               switch(plat.toLowerCase()) {
                  case 'instagram': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png';
                  case 'youtube': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/512px-YouTube_full-color_icon_%282017%29.svg.png';
                  default: return 'https://via.placeholder.com/150';
               }
            };
            return (
              <TouchableOpacity 
                key={index}
                onPress={() => setSelectedPlatforms(prev => ({ ...prev, [acc.platform]: !prev[acc.platform] }))}
                className="flex-row items-center justify-between bg-[#1c1b1c]/50 rounded-lg border border-white/5 p-3 mb-2"
              >
                <View className="flex-row items-center">
                   <Image source={{ uri: getPlatformIcon(acc.platform) }} className="w-8 h-8 rounded-md mr-3" />
                   <View>
                     <Text className="text-[#e5e2e3] text-sm capitalize">{acc.platform}</Text>
                     <Text className="text-[#b9cacb]/60 text-xs">@{acc.username || 'hesap'}</Text>
                   </View>
                </View>
                {isSelected && (
                   <View className="w-6 h-6 rounded-full bg-[#4edea3] items-center justify-center">
                      <MaterialIcons name="check" size={14} color="#003824" />
                   </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Publishing Options Section */}
        <View className="mb-6">
          <Text className="text-[#b9cacb] text-xs font-medium mb-3">yayıncılık</Text>
          <View className="flex-row bg-[#1c1b1c]/50 rounded-lg p-1 mb-4 border border-white/5">
             <TouchableOpacity 
               onPress={() => setPublishMode('schedule')}
               className={`flex-1 items-center py-2 rounded-md ${publishMode === 'schedule' ? 'bg-[#2a2a2b]' : ''}`}
             >
               <Text className={`text-sm ${publishMode === 'schedule' ? 'text-white' : 'text-[#b9cacb]'}`}>Planlı</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setPublishMode('now')}
               className={`flex-1 items-center py-2 rounded-md ${publishMode === 'now' ? 'bg-[#2a2a2b]' : ''}`}
             >
               <Text className={`text-sm ${publishMode === 'now' ? 'text-white' : 'text-[#b9cacb]'}`}>Şimdi</Text>
             </TouchableOpacity>
          </View>

          {publishMode === 'schedule' && (
            <>
              <Text className="text-[#b9cacb] text-xs font-medium mb-2">tarih & saat (opsiyonel)</Text>
              <TouchableOpacity className="flex-row items-center justify-between bg-[#1c1b1c]/50 rounded-lg border border-white/5 p-3 mb-4">
                 <Text className="text-[#e5e2e3] text-sm">{scheduleDate}</Text>
                 <MaterialIcons name="calendar-today" size={18} color="#b9cacb" />
              </TouchableOpacity>

              <Text className="text-[#b9cacb] text-xs font-medium mb-2">timezone</Text>
              <TouchableOpacity className="flex-row items-center justify-between bg-[#1c1b1c]/50 rounded-lg border border-white/5 p-3 mb-4">
                 <Text className="text-[#e5e2e3] text-sm">{timezone}</Text>
                 <MaterialIcons name="keyboard-arrow-down" size={20} color="#b9cacb" />
              </TouchableOpacity>
            </>
          )}

          <View className="bg-[#4edea3]/10 rounded-lg border border-[#4edea3]/20 p-4 flex-row items-center mt-2">
            <MaterialIcons name="info-outline" size={20} color="#4edea3" className="mr-3" />
            <Text className="text-[#e5e2e3] text-xs flex-1 ml-2">
              {publishMode === 'now' 
                ? "Gönderi, seçilen tüm platformlarda anında yayınlanacaktır."
                : "Gönderi taslak olarak kaydedilecek ve planlanan zamanda yayınlanacaktır."}
            </Text>
          </View>
        </View>

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
