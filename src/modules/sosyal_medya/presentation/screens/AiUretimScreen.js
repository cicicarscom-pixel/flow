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
  Keyboard,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

const TIMEZONES = [
  "Pacific/Midway (GMT-11)",
  "Pacific/Honolulu (GMT-10)",
  "America/Anchorage (GMT-9)",
  "America/Los_Angeles (GMT-8)",
  "America/Denver (GMT-7)",
  "America/Chicago (GMT-6)",
  "America/New_York (GMT-5)",
  "America/Caracas (GMT-4)",
  "America/Buenos_Aires (GMT-3)",
  "Atlantic/South_Georgia (GMT-2)",
  "Atlantic/Azores (GMT-1)",
  "Europe/London (GMT+0)",
  "Europe/Paris (GMT+1)",
  "Europe/Athens (GMT+2)",
  "Europe/Istanbul (GMT+3)",
  "Asia/Dubai (GMT+4)",
  "Asia/Karachi (GMT+5)",
  "Asia/Dhaka (GMT+6)",
  "Asia/Jakarta (GMT+7)",
  "Asia/Shanghai (GMT+8)",
  "Asia/Tokyo (GMT+9)",
  "Australia/Sydney (GMT+10)",
  "Pacific/Noumea (GMT+11)",
  "Pacific/Auckland (GMT+12)"
];

let persistedImage = null;
let persistedText = null;
let persistedMediaType = 'text';

export default function AiUretimScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
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
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [timezone, setTimezone] = useState('Europe/Istanbul (GMT+3)');
  const [isTimezoneModalVisible, setTimezoneModalVisible] = useState(false);

  // YouTube Settings
  const [ytTitle, setYtTitle] = useState('');
  const [ytTags, setYtTags] = useState('');
  const [ytVisibility, setYtVisibility] = useState('Public');
  const [ytCategory, setYtCategory] = useState('People & Blogs');
  const [ytCustomCaption, setYtCustomCaption] = useState('');
  const [isYtCategoryModalVisible, setYtCategoryModalVisible] = useState(false);

  // Facebook Settings
  const [fbFormat, setFbFormat] = useState('Feed');
  const [fbFirstComment, setFbFirstComment] = useState('');
  const [fbCustomCaption, setFbCustomCaption] = useState('');

  // Instagram Settings
  const [igFormat, setIgFormat] = useState('Feed');
  const [igAiLabel, setIgAiLabel] = useState(false);
  const [igFirstComment, setIgFirstComment] = useState('');
  const [igCustomCaption, setIgCustomCaption] = useState('');

  // LinkedIn Settings
  const [liMentionUsername, setLiMentionUsername] = useState('');
  const [liMentionDisplayName, setLiMentionDisplayName] = useState('');
  const [liRepostLink, setLiRepostLink] = useState('');
  const [liDisableLinkPreview, setLiDisableLinkPreview] = useState(false);
  const [liFirstComment, setLiFirstComment] = useState('');
  const [liCustomCaption, setLiCustomCaption] = useState('');
  const [showLiMentionTooltip, setShowLiMentionTooltip] = useState(false);
  const [showLiRepostTooltip, setShowLiRepostTooltip] = useState(false);

  // Twitter (X) Settings
  const [twIsThread, setTwIsThread] = useState(false);
  const [twThreadTweets, setTwThreadTweets] = useState([{ id: 1, content: '' }]);
  const [twCustomCaption, setTwCustomCaption] = useState('');

  const addTweet = () => {
    setTwThreadTweets(prev => [...prev, { id: Date.now(), content: '' }]);
  };
  
  const removeTweet = (id) => {
    setTwThreadTweets(prev => prev.filter(t => t.id !== id));
  };
  
  const updateTweet = (id, content) => {
    setTwThreadTweets(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  // TikTok Settings
  const [ttPrivacyLevel, setTtPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
  const [ttAllowComment, setTtAllowComment] = useState(true);
  const [ttAllowDuet, setTtAllowDuet] = useState(true);
  const [ttAllowStitch, setTtAllowStitch] = useState(true);
  const [ttCommercialContent, setTtCommercialContent] = useState('none');
  const [ttVideoMadeWithAi, setTtVideoMadeWithAi] = useState(false);

  // Google Business Profile Settings
  const [gbpPostType, setGbpPostType] = useState('STANDARD');
  const [gbpCallToAction, setGbpCallToAction] = useState('NONE');
  const [gbpCtaUrl, setGbpCtaUrl] = useState('');
  const [gbpEventTitle, setGbpEventTitle] = useState('');
  const [gbpEventStartDate, setGbpEventStartDate] = useState('');
  const [gbpEventEndDate, setGbpEventEndDate] = useState('');
  const [gbpOfferTitle, setGbpOfferTitle] = useState('');
  const [gbpOfferCoupon, setGbpOfferCoupon] = useState('');
  const [gbpOfferUrl, setGbpOfferUrl] = useState('');
  const [gbpOfferTerms, setGbpOfferTerms] = useState('');

  // Pinterest Settings
  const [pinBoardId, setPinBoardId] = useState('');
  const [pinTitle, setPinTitle] = useState('');
  const [pinLink, setPinLink] = useState('');

  // Reddit Settings
  const [redditSubreddit, setRedditSubreddit] = useState('');
  const [redditTitle, setRedditTitle] = useState('');
  const [redditNsfw, setRedditNsfw] = useState(false);
  const [redditSpoiler, setRedditSpoiler] = useState(false);
  const [redditSendReplies, setRedditSendReplies] = useState(true);

  // Telegram Settings
  const [tgChatId, setTgChatId] = useState('');
  const [tgDisableNotification, setTgDisableNotification] = useState(false);

  const YOUTUBE_CATEGORIES = [
    "Film & Animation", "Autos & Vehicles", "Music", "Pets & Animals", "Sports", 
    "Travel & Events", "Gaming", "People & Blogs", "Comedy", "Entertainment", 
    "News & Politics", "Howto & Style", "Education", "Science & Technology", "Nonprofits & Activism"
  ];

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
      const base64Data = isBase64 ? localImage.split(',')[1] : undefined;
      const mimeType = isBase64 ? localImage.match(/data:(.*?);/)[1] : undefined;
      
      const wantsImageEdit = aiPrompt.toLowerCase().match(/resm|görsel|düzenle|çiz|ekle|değiştir|yap/i);
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: wantsImageEdit 
            ? `Şu anki görseli kullanarak şu kullanıcı talimatına göre yeni bir görsel üret/düzenle: ${aiPrompt}`
            : `SADECE bir sosyal medya gönderi metni (caption) üret. KESİNLİKLE yeni bir görsel üretme (imagePrompt boş kalsın). Eğer sana bir görsel verildiyse o görseli analiz et ve şu kullanıcı talimatına göre metin yaz: ${aiPrompt}`,
          image: isBase64 ? base64Data : undefined,
          mimeType: isBase64 ? mimeType : undefined,
          mode: 'social'
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error);
      }

      if (data?.generatedImage) {
        const newImage = `data:image/jpeg;base64,${data.generatedImage}`;
        setLocalImage(newImage);
        persistedImage = newImage;
      } else if (data?.text) {
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

    let finalScheduledFor = undefined;
    let finalTimezone = timezone.split(' ')[0];

    if (publishMode === 'schedule') {
      try {
        const parts = scheduleDate.trim().split(' ');
        if (parts.length !== 2) throw new Error();
        const dateParts = parts[0].split('.');
        const timeParts = parts[1].split(':');
        finalScheduledFor = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}T${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00`;
      } catch (err) {
        Alert.alert("Hata", "Tarih formatı hatalı. Lütfen 'GÜN.AY.YIL SAAT:DAKİKA' (örn: 16.08.2026 16:26) şeklinde girin.");
        setIsSharing(false);
        return;
      }
    }

    let successCount = 0;
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
              publishNow: publishMode === 'now',
              scheduledFor: finalScheduledFor,
              timezone: finalTimezone,
              mediaItems: localImage ? [{ type: contentType, url: localImage }] : undefined
            } 
          }
        });
        
        if (postError || postData?.error) {
          const actualError = postError?.message || (typeof postData?.error === 'string' ? postData.error : postData?.error?.message) || "Zernio API hatası";
          throw new Error(actualError);
        }
        successCount++;
      } catch (err) {
        // Zero UI: Kullanıcıya asla hata gösterme
        console.warn(`[Zernio API Hatası] ${acc.platform}:`, err);
      }
    }

    if (successCount === 0) {
      Alert.alert("Hata", "Gönderi paylaşılamadı. Lütfen bildirimleri kontrol edin.");
      return;
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

  const saveImageToGallery = async () => {
    if (!localImage || !localImage.startsWith('data:image')) {
      Alert.alert('Hata', 'Paylaşılacak bir resim bulunamadı.');
      return;
    }
    try {
      const base64Data = localImage.replace(/^data:image\/\w+;base64,/, '');
      const filename = FileSystem.documentDirectory + 'ai_generated_' + Date.now() + '.jpg';
      
      await FileSystem.writeAsStringAsync(filename, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filename, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Resmi Paylaş veya Kaydet'
        });
      } else {
        Alert.alert('Hata', 'Cihazınızda paylaşım özelliği desteklenmiyor.');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Hata', 'Resim paylaşılırken bir sorun oluştu.');
    }
  };

  const pickMedia = async () => {
    const isInstagramSelected = selectedPlatforms['instagram'] || selectedPlatforms['Instagram'];
    
    const launchPicker = async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsEditing: true,
          aspect: isInstagramSelected ? [4, 5] : undefined,
          quality: 0.5,
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
        console.error("Resim secerken hata:", error);
      }
    };

    if (isInstagramSelected) {
      Alert.alert(
        'Instagram Boyut Kısıtlaması',
        'Instagram\'ın yayın kuralları gereği, resimlerin dikey formata (en fazla 4:5) uygun olması zorunludur. Lütfen açılacak ekranda resminizi bu alana göre ayarlayın.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Anladım', onPress: () => launchPicker() }
        ]
      );
    } else {
      launchPicker();
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

          <Text className="text-[#b9cacb] text-xs font-medium mb-3">Seçilen platformlarda paylaş</Text>
          <View className="flex-row flex-wrap justify-between">
          {zernioAccounts.map((acc, index) => {
            const isSelected = selectedPlatforms[acc.platform];
            const platformColor = acc.platform.toLowerCase() === 'instagram' ? '#bc13fe' : 
                                  acc.platform.toLowerCase() === 'facebook' ? '#1877F2' : 
                                  acc.platform.toLowerCase() === 'youtube' ? '#ff0000' : 
                                  acc.platform.toLowerCase() === 'twitter' ? '#1DA1F2' : 
                                  acc.platform.toLowerCase() === 'linkedin' ? '#0A66C2' : '#b9cacb';
            return (
              <TouchableOpacity 
                key={index}
                onPress={() => setSelectedPlatforms(prev => ({ ...prev, [acc.platform]: !prev[acc.platform] }))}
                className={`flex-row items-center justify-between rounded-lg border p-2 mb-3 w-[31%] ${isSelected ? 'bg-[#4edea3]/10 border-[#4edea3]/50' : 'bg-[#1c1b1c]/50 border-white/5'}`}
              >
                <View className="flex-row items-center flex-1">
                   <Ionicons name={`logo-${acc.platform.toLowerCase()}`} size={16} color={platformColor} style={{ marginRight: 6 }} />
                   <View className="flex-1">
                     <Text className="text-[#e5e2e3] text-[10px] capitalize font-medium" numberOfLines={1}>{acc.platform}</Text>
                     <Text className="text-[#b9cacb]/60 text-[8px]" numberOfLines={1}>@{acc.username || 'hesap'}</Text>
                   </View>
                </View>
                {isSelected && (
                   <View className="w-3.5 h-3.5 rounded-full bg-[#4edea3] items-center justify-center ml-1">
                      <MaterialIcons name="check" size={10} color="#003824" />
                   </View>
                )}
              </TouchableOpacity>
            )
          })}
          </View>
        </View>

        {/* --- YOUTUBE SETTINGS --- */}
        {selectedPlatforms['youtube'] && (
          <View className="mb-6 bg-[#1c1b1c]/50 rounded-xl p-4 border border-[#ff0000]/30">
            <View className="flex-row items-center mb-4">
               <Ionicons name="logo-youtube" size={20} color="#ff0000" className="mr-2" />
               <Text className="text-[#e5e2e3] text-sm font-semibold ml-2">YouTube</Text>
            </View>
            
            <Text className="text-[#b9cacb] text-xs font-medium mb-1">title (optional)</Text>
            <TextInput 
               value={ytTitle} onChangeText={setYtTitle}
               placeholder="Custom title for your video..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1"
               maxLength={100}
            />
            <Text className="text-[#b9cacb]/50 text-[10px] text-right mb-2">{ytTitle.length}/100</Text>

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">tags (optional)</Text>
            <TextInput 
               value={ytTags} onChangeText={setYtTags}
               placeholder="Type a tag and press Enter..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-4"
            />

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">visibility</Text>
            <View className="flex-row rounded-lg border border-white/5 mb-4 overflow-hidden">
               {['Public', 'Unlisted', 'Private'].map((opt) => (
                 <TouchableOpacity 
                    key={opt}
                    onPress={() => setYtVisibility(opt)}
                    className={`flex-1 items-center py-2 border-r border-white/5 ${ytVisibility === opt ? 'bg-[#2a2a2b]' : 'bg-[#0e0e0f]/50'}`}
                 >
                    <Text className={`text-[13px] ${ytVisibility === opt ? 'text-white' : 'text-[#b9cacb]'}`}>{opt}</Text>
                    <Text className="text-[#b9cacb]/50 text-[10px]">{opt === 'Public' ? 'Anyone' : opt === 'Unlisted' ? 'Link only' : 'Only you'}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">category</Text>
            <TouchableOpacity 
               onPress={() => setYtCategoryModalVisible(true)}
               className="flex-row items-center justify-between bg-[#0e0e0f]/50 rounded-lg border border-white/5 px-3 py-3 mb-4"
            >
               <Text className="text-[#e5e2e3] text-sm">{ytCategory}</Text>
               <MaterialIcons name="keyboard-arrow-down" size={18} color="#b9cacb" />
            </TouchableOpacity>

            <Text className="text-[#b9cacb] text-xs font-medium mb-1 mt-2">custom caption</Text>
            <TextInput 
               value={ytCustomCaption} onChangeText={setYtCustomCaption}
               placeholder="Leave blank to use main content..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 min-h-[80px]"
               multiline textAlignVertical="top" maxLength={5000}
            />
            <Text className="text-[#b9cacb]/50 text-[10px] text-right mt-1">{ytCustomCaption.length}/5000</Text>
          </View>
        )}

        {/* --- FACEBOOK SETTINGS --- */}
        {selectedPlatforms['facebook'] && (
          <View className="mb-6 bg-[#1c1b1c]/50 rounded-xl p-4 border border-[#1877F2]/30">
            <View className="flex-row items-center justify-between mb-4">
               <View className="flex-row items-center">
                 <Ionicons name="logo-facebook" size={20} color="#1877F2" className="mr-2" />
                 <Text className="text-[#e5e2e3] text-sm font-semibold ml-2">Facebook</Text>
               </View>
               <View className="flex-row bg-[#0e0e0f]/50 rounded-lg overflow-hidden border border-white/5">
                 {['Feed', 'Story', 'Reel'].map((opt) => (
                   <TouchableOpacity 
                      key={opt} onPress={() => setFbFormat(opt)}
                      className={`px-2 py-1 border-r border-white/5 ${fbFormat === opt ? 'bg-[#2a2a2b]' : ''}`}
                   >
                     <Text className={`text-[10px] ${fbFormat === opt ? 'text-white' : 'text-[#b9cacb]'}`}>{opt}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            {fbFormat === 'Story' && (
               <Text className="text-[#b9cacb]/70 text-[11px] mb-4">İçerik 24 saat sonra kaybolur. Medya (görsel veya video) gerektirir.</Text>
            )}

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">first comment</Text>
            <TextInput 
               value={fbFirstComment} onChangeText={setFbFirstComment}
               placeholder="Drop any extra context or a CTA here." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={8000}
            />
            <Text className="text-[#b9cacb]/50 text-[10px] text-right mb-4">{fbFirstComment.length}/8000</Text>

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">custom caption</Text>
            <TextInput 
               value={fbCustomCaption} onChangeText={setFbCustomCaption}
               placeholder="Leave blank to use main content..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={63206}
            />
            <Text className="text-[#b9cacb]/50 text-[10px] text-right">{fbCustomCaption.length}/63206</Text>
          </View>
        )}

        {/* --- INSTAGRAM SETTINGS --- */}
        {selectedPlatforms['instagram'] && (
          <View className="mb-6 bg-[#1c1b1c]/50 rounded-xl p-4 border border-[#bc13fe]/30">
            <View className="flex-row items-center justify-between mb-4">
               <View className="flex-row items-center">
                 <Ionicons name="logo-instagram" size={20} color="#bc13fe" className="mr-2" />
                 <Text className="text-[#e5e2e3] text-sm font-semibold ml-2">Instagram</Text>
               </View>
               <View className="flex-row bg-[#0e0e0f]/50 rounded-lg overflow-hidden border border-white/5">
                 {['Feed', 'Story', 'Reel', 'Carousel'].map((opt) => (
                   <TouchableOpacity 
                      key={opt} onPress={() => setIgFormat(opt)}
                      className={`px-2 py-1 border-r border-white/5 ${igFormat === opt ? 'bg-[#2a2a2b]' : ''}`}
                   >
                     <Text className={`text-[10px] ${igFormat === opt ? 'text-white' : 'text-[#b9cacb]'}`}>{opt}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            <Text className="text-[#b9cacb]/70 text-[11px] mb-4">İçerik 24 saat sonra kaybolur. Sınırlı metin desteği.</Text>

            <TouchableOpacity 
               onPress={() => setIgAiLabel(!igAiLabel)}
               className="flex-row items-start mb-4"
            >
               <View className={`w-4 h-4 rounded-sm border mr-3 items-center justify-center mt-1 ${igAiLabel ? 'bg-[#4edea3] border-[#4edea3]' : 'border-[#849495]/50 bg-transparent'}`}>
                  {igAiLabel && <MaterialIcons name="check" size={12} color="#003824" />}
               </View>
               <View className="flex-1">
                 <Text className="text-[#e5e2e3] text-[13px] font-medium">AI ile üretildi olarak işaretle</Text>
                 <Text className="text-[#b9cacb]/70 text-[11px] mt-1">Instagram'ın AI içerik etiketini ekler. Medya tamamen veya büyük oranda AI ile oluşturulduğunda kullanın.</Text>
               </View>
            </TouchableOpacity>

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">first comment</Text>
            <TextInput 
               value={igFirstComment} onChangeText={setIgFirstComment}
               placeholder="Drop any extra context or a CTA here." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={2200}
            />
            <Text className="text-[#b9cacb]/50 text-[10px] text-right mb-4">{igFirstComment.length}/2200</Text>

            <Text className="text-[#b9cacb] text-xs font-medium mb-1">custom caption</Text>
            <TextInput 
               value={igCustomCaption} onChangeText={setIgCustomCaption}
               placeholder="Leave blank to use main content..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={2200}
            />
            <Text className="text-[#b9cacb]/50 text-[10px] text-right">{igCustomCaption.length}/2200</Text>
          </View>
        )}

        {/* --- LINKEDIN SETTINGS --- */}
        {selectedPlatforms['linkedin'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#0A66C2] items-center justify-center mr-2">
                 <Ionicons name="logo-linkedin" size={14} color="#fff" />
               </View>
               <Text className="text-[#e5e2e3] font-semibold">LinkedIn</Text>
             </View>

             {/* Mention section */}
             <View className="flex-row items-center mb-1 z-20">
                <Text className="text-[#b9cacb] text-xs font-medium mr-1">@mention</Text>
                <TouchableOpacity onPress={() => setShowLiMentionTooltip(!showLiMentionTooltip)}>
                   <MaterialIcons name="info-outline" size={14} color="#849495" />
                </TouchableOpacity>
             </View>
             {showLiMentionTooltip && (
                <View className="bg-[#1c1b1c] border border-white/10 rounded-lg p-3 mb-2 z-20">
                   <Text className="text-white text-[11px] mb-2 leading-4">
                     Kişi etiketlemeleri (person mentions) LinkedIn hesabınızın en az bir organizasyonun yöneticisi olmasını gerektirir (LinkedIn API kısıtlaması).
                   </Text>
                   <Text className="text-white text-[11px] mb-2 leading-4">
                     Organizasyon etiketlemeleri (örn. @Microsoft) bu gereksinim olmadan çalışır.
                   </Text>
                   <Text className="text-white text-[11px] leading-4">
                     Görünen isim (display name), etiketin tıklanabilir olması için profilleriyle tam olarak eşleşmelidir.
                   </Text>
                </View>
             )}
             <View className="flex-row mb-3 space-x-2">
                <TextInput 
                  value={liMentionUsername} onChangeText={setLiMentionUsername}
                  placeholder="username or profile URL" placeholderTextColor="rgba(185, 202, 203, 0.5)"
                  className="flex-1 bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mr-2"
                />
                <TextInput 
                  value={liMentionDisplayName} onChangeText={setLiMentionDisplayName}
                  placeholder="display name" placeholderTextColor="rgba(185, 202, 203, 0.5)"
                  className="flex-1 bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mr-2"
                />
                <TouchableOpacity className="bg-[#849495]/20 px-3 py-2 rounded-lg items-center justify-center">
                  <Text className="text-white text-xs font-medium">Insert</Text>
                </TouchableOpacity>
             </View>

             {/* Repost section */}
             <View className="flex-row items-center mb-1 z-10 mt-2">
                <Text className="text-[#b9cacb] text-xs font-medium mr-1">Repost a LinkedIn post</Text>
                <TouchableOpacity onPress={() => setShowLiRepostTooltip(!showLiRepostTooltip)}>
                   <MaterialIcons name="info-outline" size={14} color="#849495" />
                </TouchableOpacity>
             </View>
             {showLiRepostTooltip && (
                <View className="bg-[#1c1b1c] border border-white/10 rounded-lg p-3 mb-2 z-10">
                   <Text className="text-white text-[11px] mb-2 leading-4">
                     Gönderinin "Gönderi bağlantısını kopyala" (Copy link to post) seçeneği ile bağlantıyı alın (adres çubuğundaki bağlantı çalışmaz).
                   </Text>
                   <Text className="text-white text-[11px] leading-4">
                     Orijinal gönderi, metninizin altına gömülür. Medya, bir yeniden paylaşımda (repost) desteklenmez.
                   </Text>
                </View>
             )}
             <TextInput 
                value={liRepostLink} onChangeText={setLiRepostLink}
                placeholder="Paste the post link" placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-4"
             />

             {/* Disable link preview */}
             <TouchableOpacity 
                activeOpacity={0.8} onPress={() => setLiDisableLinkPreview(!liDisableLinkPreview)}
                className="flex-row items-center mb-4"
             >
                <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${liDisableLinkPreview ? 'bg-[#4edea3] border-[#4edea3]' : 'border-[#849495]/50 bg-transparent'}`}>
                   {liDisableLinkPreview && <MaterialIcons name="check" size={12} color="#003824" />}
                </View>
                <Text className="text-[#e5e2e3] text-[13px]">Disable link preview</Text>
             </TouchableOpacity>

             <Text className="text-[#b9cacb] text-xs font-medium mb-1 mt-2">first comment</Text>
             <TextInput 
                value={liFirstComment} onChangeText={setLiFirstComment}
                placeholder="Add a first comment to boost engagement." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
                multiline textAlignVertical="top" maxLength={1250}
             />
             <Text className="text-[#b9cacb]/50 text-[10px] text-right mb-4">{liFirstComment.length}/1250</Text>

             <Text className="text-[#b9cacb] text-xs font-medium mb-1">custom caption</Text>
             <TextInput 
                value={liCustomCaption} onChangeText={setLiCustomCaption}
                placeholder="Leave blank to use main content..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
                multiline textAlignVertical="top" maxLength={3000}
             />
             <Text className="text-[#b9cacb]/50 text-[10px] text-right">{liCustomCaption.length}/3000</Text>
          </View>
        )}

        {/* --- TWITTER (X) SETTINGS --- */}
        {selectedPlatforms['twitter'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#000] items-center justify-center mr-2 border border-white/10">
                 <Ionicons name="close" size={14} color="#fff" /> {/* Fallback if logo-x is not available, close looks somewhat like X */}
               </View>
               <Text className="text-[#e5e2e3] font-semibold">X (Twitter)</Text>
             </View>

             {/* Thread Toggle */}
             <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#b9cacb] text-xs font-medium">thread</Text>
                <TouchableOpacity 
                   activeOpacity={0.8} onPress={() => setTwIsThread(!twIsThread)}
                   className={`w-9 h-5 rounded-full px-0.5 justify-center ${twIsThread ? 'bg-[#4edea3]' : 'bg-[#849495]/50'}`}
                >
                   <View className={`w-4 h-4 rounded-full bg-white ${twIsThread ? 'self-end' : 'self-start'}`} />
                </TouchableOpacity>
             </View>
             
             {twIsThread && (
                <View className="mb-4">
                   <Text className="text-[#b9cacb]/70 text-[10px] mb-3">Main content + media become tweet 1. Add more below.</Text>
                   
                   {twThreadTweets.map((tweet, index) => (
                      <View key={tweet.id} className="bg-[#1c1b1c] border border-white/5 rounded-lg p-3 mb-2">
                         <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-[#b9cacb] text-xs font-medium text-dashed">Tweet {index + 2}</Text>
                            <View className="flex-row items-center">
                               <Text className="text-[#b9cacb]/50 text-[10px] mr-2">{tweet.content.length}/280</Text>
                               <TouchableOpacity onPress={() => removeTweet(tweet.id)}>
                                  <Text className="text-[#ffb95f] text-[10px]">remove</Text>
                               </TouchableOpacity>
                            </View>
                         </View>
                         <TextInput 
                            value={tweet.content} onChangeText={(txt) => updateTweet(tweet.id, txt)}
                            placeholder={`Tweet ${index + 2} content...`} placeholderTextColor="rgba(185, 202, 203, 0.5)"
                            className="text-[#e5e2e3] text-sm mb-3 min-h-[40px] p-0"
                            multiline textAlignVertical="top" maxLength={280}
                         />
                         <TouchableOpacity className="w-8 h-8 rounded border border-dashed border-white/20 items-center justify-center">
                            <Ionicons name="image-outline" size={14} color="#849495" />
                         </TouchableOpacity>
                      </View>
                   ))}
                   
                   <TouchableOpacity onPress={addTweet} className="py-2">
                      <Text className="text-[#b9cacb] text-xs">+ add tweet {twThreadTweets.length + 2}</Text>
                   </TouchableOpacity>
                </View>
             )}

             <Text className="text-[#b9cacb] text-xs font-medium mb-1 mt-2">custom caption</Text>
             <TextInput 
                value={twCustomCaption} onChangeText={setTwCustomCaption}
                placeholder="Leave blank to use main content..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1 min-h-[60px]"
                multiline textAlignVertical="top" maxLength={280}
             />
             <Text className="text-[#b9cacb]/50 text-[10px] text-right">{twCustomCaption.length}/280</Text>
          </View>
        )}


         {/* --- TIKTOK SETTINGS --- */}
        {selectedPlatforms['tiktok'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#000] items-center justify-center mr-2 border border-white/10">
                 <Ionicons name="logo-tiktok" size={14} color="#fff" />
               </View>
               <Text className="text-[#e5e2e3] font-semibold">TikTok</Text>
             </View>

             <Text className="text-[#b9cacb] text-xs font-medium mb-1">Privacy Level</Text>
             <View className="flex-row flex-wrap mb-3 gap-2">
                {['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'].map(level => (
                  <TouchableOpacity 
                    key={level} onPress={() => setTtPrivacyLevel(level)}
                    className={`px-3 py-1.5 rounded-lg border ${ttPrivacyLevel === level ? 'bg-[#4edea3]/10 border-[#4edea3]' : 'bg-[#1c1b1c] border-white/10'}`}
                  >
                    <Text className={`text-[10px] ${ttPrivacyLevel === level ? 'text-[#4edea3]' : 'text-[#849495]'}`}>
                      {level.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
             </View>

             <View className="flex-row justify-between mb-3">
               <View className="flex-1 mr-2">
                 <TouchableOpacity activeOpacity={0.8} onPress={() => setTtAllowComment(!ttAllowComment)} className="flex-row items-center mb-2">
                    <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${ttAllowComment ? 'bg-[#4edea3] border-[#4edea3]' : 'border-[#849495]/50 bg-transparent'}`}>
                       {ttAllowComment && <MaterialIcons name="check" size={12} color="#003824" />}
                    </View>
                    <Text className="text-[#e5e2e3] text-xs">Allow Comment</Text>
                 </TouchableOpacity>
                 <TouchableOpacity activeOpacity={0.8} onPress={() => setTtAllowDuet(!ttAllowDuet)} className="flex-row items-center mb-2">
                    <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${ttAllowDuet ? 'bg-[#4edea3] border-[#4edea3]' : 'border-[#849495]/50 bg-transparent'}`}>
                       {ttAllowDuet && <MaterialIcons name="check" size={12} color="#003824" />}
                    </View>
                    <Text className="text-[#e5e2e3] text-xs">Allow Duet</Text>
                 </TouchableOpacity>
               </View>
               <View className="flex-1">
                 <TouchableOpacity activeOpacity={0.8} onPress={() => setTtAllowStitch(!ttAllowStitch)} className="flex-row items-center mb-2">
                    <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${ttAllowStitch ? 'bg-[#4edea3] border-[#4edea3]' : 'border-[#849495]/50 bg-transparent'}`}>
                       {ttAllowStitch && <MaterialIcons name="check" size={12} color="#003824" />}
                    </View>
                    <Text className="text-[#e5e2e3] text-xs">Allow Stitch</Text>
                 </TouchableOpacity>
                 <TouchableOpacity activeOpacity={0.8} onPress={() => setTtVideoMadeWithAi(!ttVideoMadeWithAi)} className="flex-row items-center mb-2">
                    <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${ttVideoMadeWithAi ? 'bg-[#4edea3] border-[#4edea3]' : 'border-[#849495]/50 bg-transparent'}`}>
                       {ttVideoMadeWithAi && <MaterialIcons name="check" size={12} color="#003824" />}
                    </View>
                    <Text className="text-[#e5e2e3] text-xs">AI Generated</Text>
                 </TouchableOpacity>
               </View>
             </View>
          </View>
        )}

        {/* --- GOOGLE BUSINESS PROFILE SETTINGS --- */}
        {selectedPlatforms['googlebusiness'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#4285F4] items-center justify-center mr-2">
                 <Ionicons name="business" size={14} color="#fff" />
               </View>
               <Text className="text-[#e5e2e3] font-semibold">Google Business</Text>
             </View>

             <View className="flex-row mb-3 bg-[#1c1b1c] rounded-lg p-1 border border-white/5">
                {['STANDARD', 'EVENT', 'OFFER'].map(type => (
                  <TouchableOpacity 
                    key={type} onPress={() => setGbpPostType(type)}
                    className={`flex-1 py-1.5 rounded justify-center items-center ${gbpPostType === type ? 'bg-[#4285F4]' : 'bg-transparent'}`}
                  >
                    <Text className={`text-[11px] font-medium ${gbpPostType === type ? 'text-white' : 'text-[#849495]'}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
             </View>

             {(gbpPostType === 'STANDARD' || gbpPostType === 'EVENT') && (
               <View className="mb-3">
                 <Text className="text-[#b9cacb] text-xs font-medium mb-1">Call To Action</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
                    {['NONE', 'LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL'].map(cta => (
                      <TouchableOpacity 
                        key={cta} onPress={() => setGbpCallToAction(cta)}
                        className={`px-3 py-1.5 rounded-lg border mr-2 ${gbpCallToAction === cta ? 'bg-[#4285F4]/10 border-[#4285F4]' : 'bg-[#1c1b1c] border-white/10'}`}
                      >
                        <Text className={`text-[10px] ${gbpCallToAction === cta ? 'text-[#4285F4]' : 'text-[#849495]'}`}>
                          {cta.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
                 {gbpCallToAction !== 'NONE' && gbpCallToAction !== 'CALL' && (
                    <TextInput 
                      value={gbpCtaUrl} onChangeText={setGbpCtaUrl}
                      placeholder="https://..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                      className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2"
                    />
                 )}
               </View>
             )}

             {gbpPostType === 'EVENT' && (
               <View className="mb-2 bg-[#1c1b1c]/30 p-2 rounded-lg border border-white/5">
                  <Text className="text-[#b9cacb] text-[10px] font-medium mb-1">Event Details</Text>
                  <TextInput value={gbpEventTitle} onChangeText={setGbpEventTitle} placeholder="Event Title" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#0e0e0f]/50 border border-white/5 rounded text-[#e5e2e3] text-xs px-2 py-1.5 mb-2" />
                  <View className="flex-row space-x-2">
                    <TextInput value={gbpEventStartDate} onChangeText={setGbpEventStartDate} placeholder="Start YYYY-MM-DD" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="flex-1 bg-[#0e0e0f]/50 border border-white/5 rounded text-[#e5e2e3] text-xs px-2 py-1.5 mr-1" />
                    <TextInput value={gbpEventEndDate} onChangeText={setGbpEventEndDate} placeholder="End YYYY-MM-DD" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="flex-1 bg-[#0e0e0f]/50 border border-white/5 rounded text-[#e5e2e3] text-xs px-2 py-1.5" />
                  </View>
               </View>
             )}
          </View>
        )}

        {/* --- PINTEREST SETTINGS --- */}
        {selectedPlatforms['pinterest'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#E60023] items-center justify-center mr-2">
                 <Ionicons name="logo-pinterest" size={14} color="#fff" />
               </View>
               <Text className="text-[#e5e2e3] font-semibold">Pinterest</Text>
             </View>

             <TextInput value={pinBoardId} onChangeText={setPinBoardId} placeholder="Board ID (Required)" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-2" />
             <TextInput value={pinTitle} onChangeText={setPinTitle} placeholder="Pin Title (Max 100 chars)" placeholderTextColor="rgba(185, 202, 203, 0.5)" maxLength={100} className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-2" />
             <TextInput value={pinLink} onChangeText={setPinLink} placeholder="Destination Link" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-1" />
          </View>
        )}

        {/* --- REDDIT SETTINGS --- */}
        {selectedPlatforms['reddit'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#FF4500] items-center justify-center mr-2">
                 <Ionicons name="logo-reddit" size={14} color="#fff" />
               </View>
               <Text className="text-[#e5e2e3] font-semibold">Reddit</Text>
             </View>

             <View className="flex-row space-x-2 mb-2">
               <View className="flex-row items-center bg-[#0e0e0f]/50 border border-white/5 rounded-lg px-3 py-2 flex-1 mr-2">
                 <Text className="text-[#849495] mr-1">r/</Text>
                 <TextInput value={redditSubreddit} onChangeText={setRedditSubreddit} placeholder="subreddit" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="text-[#e5e2e3] text-sm flex-1 p-0" />
               </View>
               <TextInput value={redditTitle} onChangeText={setRedditTitle} placeholder="Post Title" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 flex-1" />
             </View>

             <View className="flex-row mt-2">
                <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditNsfw(!redditNsfw)} className="flex-row items-center mr-4">
                   <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditNsfw ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#849495]/50 bg-transparent'}`}>
                      {redditNsfw && <MaterialIcons name="check" size={12} color="#fff" />}
                   </View>
                   <Text className="text-[#e5e2e3] text-xs">NSFW</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditSpoiler(!redditSpoiler)} className="flex-row items-center mr-4">
                   <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditSpoiler ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#849495]/50 bg-transparent'}`}>
                      {redditSpoiler && <MaterialIcons name="check" size={12} color="#fff" />}
                   </View>
                   <Text className="text-[#e5e2e3] text-xs">Spoiler</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditSendReplies(!redditSendReplies)} className="flex-row items-center">
                   <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditSendReplies ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#849495]/50 bg-transparent'}`}>
                      {redditSendReplies && <MaterialIcons name="check" size={12} color="#fff" />}
                   </View>
                   <Text className="text-[#e5e2e3] text-xs">Inbox Replies</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}

        {/* --- TELEGRAM SETTINGS --- */}
        {selectedPlatforms['telegram'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#2AABEE] items-center justify-center mr-2">
                 <Ionicons name="paper-plane" size={14} color="#fff" />
               </View>
               <Text className="text-[#e5e2e3] font-semibold">Telegram</Text>
             </View>

             <TextInput value={tgChatId} onChangeText={setTgChatId} placeholder="@channelname or Chat ID" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#0e0e0f]/50 border border-white/5 rounded-lg text-[#e5e2e3] text-sm px-3 py-2 mb-2" />
             
             <TouchableOpacity activeOpacity={0.8} onPress={() => setTgDisableNotification(!tgDisableNotification)} className="flex-row items-center mb-1">
                <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${tgDisableNotification ? 'bg-[#2AABEE] border-[#2AABEE]' : 'border-[#849495]/50 bg-transparent'}`}>
                   {tgDisableNotification && <MaterialIcons name="check" size={12} color="#fff" />}
                </View>
                <Text className="text-[#e5e2e3] text-xs">Send Silently (No Notification)</Text>
             </TouchableOpacity>
          </View>
        )}

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
              <TouchableOpacity 
                onPress={() => setTimezoneModalVisible(true)}
                className="flex-row items-center justify-between bg-[#1c1b1c]/50 rounded-lg border border-white/5 p-3 mb-4"
              >
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
        
        {/* Action Button (Fixed Bottom) */}
        {!isKeyboardVisible && (
        <View 
          className="w-full px-5 pt-4 bg-[#0A0A0B] border-t border-white/5"
          style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
        >
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
      </KeyboardAvoidingView>
      
      {/* YouTube Category Modal */}
      <Modal
        visible={isYtCategoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setYtCategoryModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#1c1b1c] rounded-t-3xl h-[60%]">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-[#e5e2e3] text-lg font-semibold">Kategori Seçin</Text>
              <TouchableOpacity onPress={() => setYtCategoryModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#b9cacb" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
              {YOUTUBE_CATEGORIES.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setYtCategory(cat);
                    setYtCategoryModalVisible(false);
                  }}
                  className={`flex-row justify-between items-center p-4 border-b border-white/5 ${ytCategory === cat ? 'bg-[#4edea3]/10' : ''}`}
                >
                  <Text className={`text-base ${ytCategory === cat ? 'text-[#4edea3] font-bold' : 'text-[#e5e2e3]'}`}>{cat}</Text>
                  {ytCategory === cat && (
                    <MaterialIcons name="check" size={20} color="#4edea3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Timezone Modal */}
      <Modal
        visible={isTimezoneModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimezoneModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#1c1b1c] rounded-t-3xl h-[60%]">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-[#e5e2e3] text-lg font-semibold">Timezone Seçin</Text>
              <TouchableOpacity onPress={() => setTimezoneModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#b9cacb" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
              {TIMEZONES.map((tz, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setTimezone(tz);
                    setTimezoneModalVisible(false);
                  }}
                  className={`flex-row justify-between items-center p-4 border-b border-white/5 ${timezone === tz ? 'bg-[#4edea3]/10' : ''}`}
                >
                  <Text className={`text-base ${timezone === tz ? 'text-[#4edea3] font-bold' : 'text-[#e5e2e3]'}`}>{tz}</Text>
                  {timezone === tz && (
                    <MaterialIcons name="check" size={20} color="#4edea3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
