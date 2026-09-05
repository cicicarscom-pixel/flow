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
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#C2478D', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      
      <View style={{ flex: 1, backgroundColor: '#201D24', borderRadius: borderRadius - 3.5, padding }}>
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState(['yaz', 'yenisezon']);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
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
  const [ttSaveToInbox, setTtSaveToInbox] = useState(false);
  const [ttCustomCaption, setTtCustomCaption] = useState('');


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
  const [pinCustomCaption, setPinCustomCaption] = useState('');

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
      const userId = session?.session?.user?.id || session?.user?.id;
      if (!userId) return;

      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', userId).maybeSingle();
      const organizationId = orgMember?.organization_id || userId;

      if (organizationId) {
        try {
          const { data } = await supabase
            .schema('integration')
            .from('social_accounts')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true);
            
          const accounts = data || [];
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
      
      const { data, error } = await supabase.functions.invoke('flow-gemini-chat', {
        body: {
          prompt: `SADECE bir sosyal medya gönderi metni (caption) üret. KESİNLİKLE yeni bir görsel üretme. Eğer sana bir görsel verildiyse o görseli analiz et ve şu kullanıcı talimatına göre metin yaz: ${aiPrompt}`,
          image: isBase64 ? base64Data : undefined,
          mimeType: isBase64 ? mimeType : undefined
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

    let contentToShare = localText || prompt || t('sosyalMedya.generate.fallbackContent');
    if (tags.length > 0) {
      contentToShare += "\n\n" + tags.map(t => `#${t}`).join(" ");
    }

    const { data: session } = await supabase.auth.getSession();
    const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session?.session?.user?.id || session?.user?.id).maybeSingle();
    const organizationId = orgMember?.organization_id || session?.session?.user?.id || session?.user?.id;

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

    const platformsPayload = allowedPlatforms.map(acc => {
      const p = acc.platform.toLowerCase();
      let platformOptions = {};

      if (p === 'facebook') {
        platformOptions = {
          format: fbFormat,
          firstComment: fbFirstComment,
          caption: fbCustomCaption || undefined
        };
      } else if (p === 'instagram') {
        platformOptions = {
          contentType: igFormat.toLowerCase(),
          aiGenerated: igAiLabel,
          firstComment: igFirstComment,
          caption: igCustomCaption || undefined
        };
      } else if (p === 'linkedin') {
        platformOptions = {
          firstComment: liFirstComment,
          caption: liCustomCaption || undefined
        };
      } else if (p === 'twitter') {
        platformOptions = {
          isThread: twIsThread,
          caption: twCustomCaption || undefined
        };
      } else if (p === 'tiktok') {
        platformOptions = {
          saveToInboxAsDraft: ttSaveToInbox,
          caption: ttCustomCaption || undefined
        };
      } else if (p === 'pinterest') {
        platformOptions = {
          title: pinTitle || undefined,
          link: pinLink || undefined,
          caption: pinCustomCaption || undefined
        };
      } else if (p === 'youtube') {
        platformOptions = {
          title: ytTitle || undefined,
          privacyStatus: ytVisibility,
          caption: ytCustomCaption || undefined
        };
      }

      return {
        platform: acc.platform,
        accountId: acc._id || acc.id || acc.accountId || acc.uuid,
        platformSpecificData: Object.keys(platformOptions).length > 0 ? platformOptions : undefined
      };
    });

    try {
      const { data: postData, error: postError } = await supabase.functions.invoke('zernio-client', {
        body: { 
          action: 'create-post', 
          payload: { 
            content: contentToShare,
            platforms: platformsPayload,
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
    } catch (err) {
      console.warn(`[Zernio API Hatası]:`, err);
      throw err;
    }

    // Başarılı olan gönderimleri veritabanına kaydet
    try {
       const finalMediaUrls = localImage ? [localImage] : [];
       await supabase.from('posts').insert({
          profile_id: organizationId,
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
    let progressInterval;
    try {
      setIsSharing(true);
      setUploadProgress(0);
      
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 500);

      const { data: session } = await supabase.auth.getSession();
      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session?.session?.user?.id || session?.user?.id).maybeSingle();
      const organizationId = orgMember?.organization_id || session?.session?.user?.id || session?.user?.id;
      
      if (!organizationId) {
        clearInterval(progressInterval);
        Alert.alert(t('sosyalMedya.alerts.error'), t('sosyalMedya.alerts.noSession'));
        setIsSharing(false);
        setUploadProgress(0);
        return;
      }

      if (zernioAccounts.length === 0) {
        clearInterval(progressInterval);
        Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.connectAccountFirst'));
        setIsSharing(false);
        setUploadProgress(0);
        return;
      }

      // İçerik tipini belirle
      const currentContentType = localImage ? mediaType : 'text';
      
      // Otonom yönlendirmeyi başlatan ana fonksiyonu çağır
      await publishPost(zernioAccounts, currentContentType);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsSharing(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setIsSharing(false);
      setUploadProgress(0);
      console.error("Paylaşım istisnası:", err);
      // Zero UI gereği kullanıcıya hata fırlatma
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
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right']}>
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
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.Version < 30 ? 'padding' : undefined)}
      >
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        
        {/* Input Section */}
        <View className="mb-6">
          <Text className="text-[#A79E96] text-xs font-medium uppercase tracking-wider mb-2 ml-1">{t('sosyalMedya.generate.whatToShare')}</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder={t('sosyalMedya.generate.promptPlaceholder')}
            placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="w-full bg-[#2A2631]/50 rounded-lg border border-white/10 text-[#F6F1EC] text-base p-3 min-h-[100px]"
            multiline={true}
            textAlignVertical="top"
          />
        </View>

        {/* Central Feature: Image Container */}
        <View className="items-center w-full mb-6 relative">
          <AnimatedBorderCard 
            style={{ width: '100%', aspectRatio: 1, maxWidth: 350 }} 
            colors={['#22B573', '#ffffff']} 
            padding={0} 
            borderRadius={24}
          >
            <TouchableOpacity 
              className="flex-1 items-center justify-center bg-[#34303C]/50 overflow-hidden relative" 
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
                  <View className="mb-4 bg-[#22B573]/10 rounded-full p-4 border border-[#22B573]/30 border-dashed">
                    <MaterialIcons name="add-photo-alternate" size={48} color="#22B573" />
                  </View>
                  <Text className="text-[#A79E96] text-base text-center px-4 font-medium mb-1">
                    {t('sosyalMedya.generate.selectOrGenerate')}
                  </Text>
                  <Text className="text-[#A79E96]/60 text-xs text-center px-8">
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
            colors={['#C2478D', '#ffffff']} 
            padding={20} 
            borderRadius={20}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#F6F1EC] text-lg font-semibold">{t('sosyalMedya.generate.contentTitle')}</Text>
            <TouchableOpacity
              className="p-1"
              onPress={() => setIsEditingCaption(!isEditingCaption)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isEditingCaption ? "Düzenlemeyi onayla" : "Metni düzenle"}
            >
              <MaterialIcons name={isEditingCaption ? "check" : "edit"} size={20} color={isEditingCaption ? "#C2478D" : "#22B573"} />
            </TouchableOpacity>
          </View>
          
          <View className={`bg-[#201D24]/50 rounded-lg p-3 border ${isEditingCaption ? 'border-[#C2478D]' : 'border-white/5'} min-h-[200px] mb-4`}>
            {isEditingCaption ? (
              <TextInput
                value={localText}
                onChangeText={(txt) => { setLocalText(txt); persistedText = txt; }}
                multiline
                autoFocus
                textAlignVertical="top"
                className="text-[#F6F1EC] text-sm leading-5 p-0 m-0 min-h-[180px]"
                placeholder={t('sosyalMedya.generate.contentPlaceholder')}
                placeholderTextColor="rgba(185, 202, 203, 0.5)"
              />
            ) : (
              <Text className="text-[#A79E96]/80 text-sm leading-5">
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
               className="flex-1 bg-[#2A2631] rounded-full px-4 py-2 text-[#F6F1EC] border border-[#3A3540]"
               multiline={false}
               onSubmitEditing={generateCaption}
            />
            <TouchableOpacity 
               onPress={generateCaption} 
               disabled={isGeneratingText}
               className={`ml-2 w-10 h-10 rounded-full bg-[#C2478D] items-center justify-center ${isGeneratingText ? 'opacity-50' : ''}`}
            >
              {isGeneratingText ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap gap-2">
            {tags.map(tag => (
              <TouchableOpacity 
                key={tag} 
                onPress={() => setLocalText(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '') + '#' + tag)}
                className="bg-[#22B573]/10 px-3 py-1 rounded-full border border-[#22B573]/20"
              >
                <Text className="text-[#22B573] text-xs font-medium">#{tag}</Text>
              </TouchableOpacity>
            ))}
            
            {isAddingTag ? (
              <View className="flex-row items-center bg-[#2A2631] px-2 py-0 border border-[#22B573]/30 rounded-full h-7">
                <Text className="text-[#22B573] text-xs mr-1">#</Text>
                <TextInput
                  value={newTagText}
                  onChangeText={text => setNewTagText(text.replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, ''))}
                  onSubmitEditing={() => {
                    if (newTagText.trim() && !tags.includes(newTagText.trim())) {
                      setTags(prev => [...prev, newTagText.trim()]);
                    }
                    setNewTagText("");
                    setIsAddingTag(false);
                  }}
                  onBlur={() => {
                    if (newTagText.trim() && !tags.includes(newTagText.trim())) {
                      setTags(prev => [...prev, newTagText.trim()]);
                    }
                    setNewTagText("");
                    setIsAddingTag(false);
                  }}
                  autoFocus
                  placeholder="yaz"
                  placeholderTextColor="#A79E96"
                  className="text-[#F6F1EC] text-xs p-0 m-0 w-16"
                  returnKeyType="done"
                />
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsAddingTag(true)} className="px-2 flex-row items-center py-1 bg-[#2A2631]/50 rounded-full border border-white/5 h-7">
                <MaterialIcons name="add" size={14} color="#A79E96" />
                <Text className="text-[#A79E96] text-xs font-medium ml-1">{t('sosyalMedya.generate.addTag')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedBorderCard>

        {/* Platforms Section */}
        <View className="mb-6 mt-6">
          <Text className="text-[#A79E96] text-xs font-medium mb-3">Bağlantılı Hesaplar (Platformlar)</Text>
          
          {zernioAccounts.length === 0 ? (
            <View className="items-center p-4 bg-[#2A2631]/30 rounded-lg border border-white/5">
              <Text className="text-[#A79E96]/70 text-xs mb-2">Henüz bağlı bir hesap yok.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SosyalMedya')}>
                <Text className="text-[#22B573] text-xs font-medium">Hesap Bağla</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
            {zernioAccounts.map((acc, index) => {
              const isSelected = selectedPlatforms[acc.platform];
              const platformId = acc.platform.toLowerCase();
              const platformColor = platformId === 'instagram' ? '#C2478D' : 
                                    platformId === 'facebook' ? '#1877F2' : 
                                    platformId === 'youtube' ? '#ff0000' : 
                                    platformId === 'twitter' ? '#1DA1F2' : 
                                    platformId === 'linkedin' ? '#0A66C2' : 
                                    platformId.includes('google') ? '#4285F4' : '#A79E96';
              
              let iconName = `logo-${platformId}`;
              if (platformId.includes('google')) iconName = 'business';

              return (
                <TouchableOpacity 
                  key={index}
                  onPress={() => setSelectedPlatforms(prev => ({ ...prev, [acc.platform]: !prev[acc.platform] }))}
                  className={`flex-row items-center justify-between rounded-lg border p-3 mb-3 w-[48%] ${isSelected ? 'bg-[#22B573]/10 border-[#22B573]/50' : 'bg-[#2A2631]/50 border-white/5'}`}
                >
                  <View className="flex-row items-center flex-1 overflow-hidden">
                     <Ionicons name={iconName} size={18} color={platformColor} style={{ marginRight: 8 }} />
                     <View className="flex-1 overflow-hidden">
                       <Text className="text-[#F6F1EC] text-[12px] capitalize font-semibold" numberOfLines={1}>{acc.platform}</Text>
                       <Text className="text-[#A79E96]/60 text-[10px]" numberOfLines={1}>@{acc.username || 'hesap'}</Text>
                     </View>
                  </View>
                  {isSelected && (
                     <View className="w-4 h-4 rounded-full bg-[#22B573] items-center justify-center ml-2 shrink-0">
                        <MaterialIcons name="check" size={12} color="#1C3327" />
                     </View>
                  )}
                </TouchableOpacity>
              );
            })}
            </View>
          )}
        </View>

        {/* --- YOUTUBE SETTINGS --- */}
        {selectedPlatforms['youtube'] && (
          <View className="mb-6 bg-[#2A2631]/50 rounded-xl p-4 border border-[#ff0000]/30">
            <View className="flex-row items-center mb-4">
               <Ionicons name="logo-youtube" size={20} color="#ff0000" className="mr-2" />
               <Text className="text-[#F6F1EC] text-sm font-semibold ml-2">YouTube</Text>
            </View>
            
            <Text className="text-[#A79E96] text-xs font-medium mb-1">Başlık (Opsiyonel)</Text>
            <TextInput 
               value={ytTitle} onChangeText={setYtTitle}
               placeholder="Custom title for your video..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1"
               maxLength={100}
            />
            <Text className="text-[#A79E96]/50 text-[10px] text-right mb-2">{ytTitle.length}/100</Text>

            <Text className="text-[#A79E96] text-xs font-medium mb-1">tags (optional)</Text>
            <TextInput 
               value={ytTags} onChangeText={setYtTags}
               placeholder="Type a tag and press Enter..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-4"
            />

            <Text className="text-[#A79E96] text-xs font-medium mb-1">visibility</Text>
            <View className="flex-row rounded-lg border border-white/5 mb-4 overflow-hidden">
               {['Public', 'Unlisted', 'Private'].map((opt) => (
                 <TouchableOpacity 
                    key={opt}
                    onPress={() => setYtVisibility(opt)}
                    className={`flex-1 items-center py-2 border-r border-white/5 ${ytVisibility === opt ? 'bg-[#34303C]' : 'bg-[#201D24]/50'}`}
                 >
                    <Text className={`text-[13px] ${ytVisibility === opt ? 'text-white' : 'text-[#A79E96]'}`}>{opt}</Text>
                    <Text className="text-[#A79E96]/50 text-[10px]">{opt === 'Public' ? 'Anyone' : opt === 'Unlisted' ? 'Link only' : 'Only you'}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <Text className="text-[#A79E96] text-xs font-medium mb-1">category</Text>
            <TouchableOpacity 
               onPress={() => setYtCategoryModalVisible(true)}
               className="flex-row items-center justify-between bg-[#201D24]/50 rounded-lg border border-white/5 px-3 py-3 mb-4"
            >
               <Text className="text-[#F6F1EC] text-sm">{ytCategory}</Text>
               <MaterialIcons name="keyboard-arrow-down" size={18} color="#A79E96" />
            </TouchableOpacity>

            <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">Özel Açıklama (Opsiyonel)</Text>
            <TextInput 
               value={ytCustomCaption} onChangeText={setYtCustomCaption}
               placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 min-h-[80px]"
               multiline textAlignVertical="top" maxLength={5000}
            />
            <Text className="text-[#A79E96]/50 text-[10px] text-right mt-1">{ytCustomCaption.length}/5000</Text>
          </View>
        )}

        {/* --- FACEBOOK SETTINGS --- */}
        {selectedPlatforms['facebook'] && (
          <View className="mb-6 bg-[#2A2631]/50 rounded-xl p-4 border border-[#1877F2]/30">
            <View className="flex-row items-center justify-between mb-4">
               <View className="flex-row items-center">
                 <Ionicons name="logo-facebook" size={20} color="#1877F2" className="mr-2" />
                 <Text className="text-[#F6F1EC] text-sm font-semibold ml-2">Facebook</Text>
               </View>
               <View className="flex-row bg-[#201D24]/50 rounded-lg overflow-hidden border border-white/5">
                 {['Feed', 'Story', 'Reel'].map((opt) => (
                   <TouchableOpacity 
                      key={opt} onPress={() => setFbFormat(opt)}
                      className={`px-2 py-1 border-r border-white/5 ${fbFormat === opt ? 'bg-[#34303C]' : ''}`}
                   >
                     <Text className={`text-[10px] ${fbFormat === opt ? 'text-white' : 'text-[#A79E96]'}`}>{opt}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            {fbFormat === 'Story' && (
               <Text className="text-[#A79E96]/70 text-[11px] mb-4">İçerik 24 saat sonra kaybolur. Medya (görsel veya video) gerektirir.</Text>
            )}

            <Text className="text-[#A79E96] text-xs font-medium mb-1">İlk Yorum (Opsiyonel)</Text>
            <TextInput 
               value={fbFirstComment} onChangeText={setFbFirstComment}
               placeholder="İlk yoruma eklemek istediğiniz bağlantı veya notu girin..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={8000}
            />
            <Text className="text-[#A79E96]/50 text-[10px] text-right mb-4">{fbFirstComment.length}/8000</Text>

            <Text className="text-[#A79E96] text-xs font-medium mb-1">Özel Açıklama (Opsiyonel)</Text>
            <TextInput 
               value={fbCustomCaption} onChangeText={setFbCustomCaption}
               placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={63206}
            />
            <Text className="text-[#A79E96]/50 text-[10px] text-right">{fbCustomCaption.length}/63206</Text>
          </View>
        )}

        {/* --- INSTAGRAM SETTINGS --- */}
        {selectedPlatforms['instagram'] && (
          <View className="mb-6 bg-[#2A2631]/50 rounded-xl p-4 border border-[#C2478D]/30">
            <View className="flex-row items-center justify-between mb-4">
               <View className="flex-row items-center">
                 <Ionicons name="logo-instagram" size={20} color="#C2478D" className="mr-2" />
                 <Text className="text-[#F6F1EC] text-sm font-semibold ml-2">Instagram</Text>
               </View>
               <View className="flex-row bg-[#201D24]/50 rounded-lg overflow-hidden border border-white/5">
                 {['Feed', 'Story', 'Reel', 'Carousel'].map((opt) => (
                   <TouchableOpacity 
                      key={opt} onPress={() => setIgFormat(opt)}
                      className={`px-2 py-1 border-r border-white/5 ${igFormat === opt ? 'bg-[#34303C]' : ''}`}
                   >
                     <Text className={`text-[10px] ${igFormat === opt ? 'text-white' : 'text-[#A79E96]'}`}>{opt}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            <Text className="text-[#A79E96]/70 text-[11px] mb-4">İçerik 24 saat sonra kaybolur. Sınırlı metin desteği.</Text>

            <TouchableOpacity 
               onPress={() => setIgAiLabel(!igAiLabel)}
               className="flex-row items-start mb-4"
            >
               <View className={`w-4 h-4 rounded-sm border mr-3 items-center justify-center mt-1 ${igAiLabel ? 'bg-[#22B573] border-[#22B573]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                  {igAiLabel && <MaterialIcons name="check" size={12} color="#1C3327" />}
               </View>
               <View className="flex-1">
                 <Text className="text-[#F6F1EC] text-[13px] font-medium">AI ile üretildi olarak işaretle</Text>
                 <Text className="text-[#A79E96]/70 text-[11px] mt-1">Instagram'ın AI içerik etiketini ekler. Medya tamamen veya büyük oranda AI ile oluşturulduğunda kullanın.</Text>
               </View>
            </TouchableOpacity>

            <Text className="text-[#A79E96] text-xs font-medium mb-1">İlk Yorum (Opsiyonel)</Text>
            <TextInput 
               value={igFirstComment} onChangeText={setIgFirstComment}
               placeholder="İlk yoruma eklemek istediğiniz bağlantı veya notu girin..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={2200}
            />
            <Text className="text-[#A79E96]/50 text-[10px] text-right mb-4">{igFirstComment.length}/2200</Text>

            <Text className="text-[#A79E96] text-xs font-medium mb-1">Özel Açıklama (Opsiyonel)</Text>
            <TextInput 
               value={igCustomCaption} onChangeText={setIgCustomCaption}
               placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
               multiline textAlignVertical="top" maxLength={2200}
            />
            <Text className="text-[#A79E96]/50 text-[10px] text-right">{igCustomCaption.length}/2200</Text>
          </View>
        )}

        {/* --- LINKEDIN SETTINGS --- */}
        {selectedPlatforms['linkedin'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#0A66C2] items-center justify-center mr-2">
                 <Ionicons name="logo-linkedin" size={14} color="#fff" />
               </View>
               <Text className="text-[#F6F1EC] font-semibold">LinkedIn</Text>
             </View>

             {/* Mention section */}
             <View className="flex-row items-center mb-1 z-20">
                <Text className="text-[#A79E96] text-xs font-medium mr-1">@mention</Text>
                <TouchableOpacity onPress={() => setShowLiMentionTooltip(!showLiMentionTooltip)}>
                   <MaterialIcons name="info-outline" size={14} color="#A79E96" />
                </TouchableOpacity>
             </View>
             {showLiMentionTooltip && (
                <View className="bg-[#2A2631] border border-white/10 rounded-lg p-3 mb-2 z-20">
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
                  className="flex-1 bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mr-2"
                />
                <TextInput 
                  value={liMentionDisplayName} onChangeText={setLiMentionDisplayName}
                  placeholder="display name" placeholderTextColor="rgba(185, 202, 203, 0.5)"
                  className="flex-1 bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mr-2"
                />
                <TouchableOpacity
                  onPress={() => {
                    const mentionLabel = (liMentionDisplayName || liMentionUsername || '').trim();
                    if (!mentionLabel) return;
                    setLiCustomCaption((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@${mentionLabel} `);
                    setLiMentionUsername('');
                    setLiMentionDisplayName('');
                  }}
                  disabled={!liMentionUsername && !liMentionDisplayName}
                  className={`px-3 py-2 rounded-lg items-center justify-center ${(liMentionUsername || liMentionDisplayName) ? 'bg-[#A79E96]/20' : 'bg-[#A79E96]/10'}`}
                  accessibilityRole="button"
                  accessibilityLabel="Etiketi metne ekle"
                >
                  <Text className={`text-xs font-medium ${(liMentionUsername || liMentionDisplayName) ? 'text-white' : 'text-[#A79E96]/50'}`}>Insert</Text>
                </TouchableOpacity>
             </View>

             {/* Repost section */}
             <View className="flex-row items-center mb-1 z-10 mt-2">
                <Text className="text-[#A79E96] text-xs font-medium mr-1">Repost a LinkedIn post</Text>
                <TouchableOpacity onPress={() => setShowLiRepostTooltip(!showLiRepostTooltip)}>
                   <MaterialIcons name="info-outline" size={14} color="#A79E96" />
                </TouchableOpacity>
             </View>
             {showLiRepostTooltip && (
                <View className="bg-[#2A2631] border border-white/10 rounded-lg p-3 mb-2 z-10">
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
                className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-4"
             />

             {/* Disable link preview */}
             <TouchableOpacity 
                activeOpacity={0.8} onPress={() => setLiDisableLinkPreview(!liDisableLinkPreview)}
                className="flex-row items-center mb-4"
             >
                <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${liDisableLinkPreview ? 'bg-[#22B573] border-[#22B573]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                   {liDisableLinkPreview && <MaterialIcons name="check" size={12} color="#1C3327" />}
                </View>
                <Text className="text-[#F6F1EC] text-[13px]">Disable link preview</Text>
             </TouchableOpacity>

             <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">İlk Yorum (Opsiyonel)</Text>
             <TextInput 
                value={liFirstComment} onChangeText={setLiFirstComment}
                placeholder="Add a İlk Yorum (Opsiyonel) to boost engagement." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
                multiline textAlignVertical="top" maxLength={1250}
             />
             <Text className="text-[#A79E96]/50 text-[10px] text-right mb-4">{liFirstComment.length}/1250</Text>

             <Text className="text-[#A79E96] text-xs font-medium mb-1">Özel Açıklama (Opsiyonel)</Text>
             <TextInput 
                value={liCustomCaption} onChangeText={setLiCustomCaption}
                placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
                multiline textAlignVertical="top" maxLength={3000}
             />
             <Text className="text-[#A79E96]/50 text-[10px] text-right">{liCustomCaption.length}/3000</Text>
          </View>
        )}

        {/* --- TWITTER (X) SETTINGS --- */}
        {selectedPlatforms['twitter'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#000] items-center justify-center mr-2 border border-white/10">
                 <Ionicons name="close" size={14} color="#fff" /> {/* Fallback if logo-x is not available, close looks somewhat like X */}
               </View>
               <Text className="text-[#F6F1EC] font-semibold">X (Twitter)</Text>
             </View>

             {/* Thread Toggle */}
             <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#A79E96] text-xs font-medium">thread</Text>
                <TouchableOpacity
                   activeOpacity={0.8} onPress={() => setTwIsThread(!twIsThread)}
                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                   accessibilityRole="switch"
                   accessibilityLabel="Thread olarak paylaş"
                   accessibilityState={{ checked: twIsThread }}
                   className={`w-9 h-5 rounded-full px-0.5 justify-center ${twIsThread ? 'bg-[#22B573]' : 'bg-[#A79E96]/50'}`}
                >
                   <View className={`w-4 h-4 rounded-full bg-white ${twIsThread ? 'self-end' : 'self-start'}`} />
                </TouchableOpacity>
             </View>
             
             {twIsThread && (
                <View className="mb-4">
                   <Text className="text-[#A79E96]/70 text-[10px] mb-3">Ana metin ilk tweet olur. Altına zincir eklenebilir.</Text>
                   
                   {twThreadTweets.map((tweet, index) => (
                      <View key={tweet.id} className="bg-[#2A2631] border border-white/5 rounded-lg p-3 mb-2">
                         <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-[#A79E96] text-xs font-medium text-dashed">Tweet {index + 2}</Text>
                            <View className="flex-row items-center">
                               <Text className="text-[#A79E96]/50 text-[10px] mr-2">{tweet.content.length}/280</Text>
                               <TouchableOpacity onPress={() => removeTweet(tweet.id)}>
                                  <Text className="text-[#F59E0B] text-[10px]">remove</Text>
                               </TouchableOpacity>
                            </View>
                         </View>
                         <TextInput 
                            value={tweet.content} onChangeText={(txt) => updateTweet(tweet.id, txt)}
                            placeholder={`Tweet ${index + 2} content...`} placeholderTextColor="rgba(185, 202, 203, 0.5)"
                            className="text-[#F6F1EC] text-sm mb-3 min-h-[40px] p-0"
                            multiline textAlignVertical="top" maxLength={280}
                         />
                         <TouchableOpacity className="w-8 h-8 rounded border border-dashed border-white/20 items-center justify-center">
                            <Ionicons name="image-outline" size={14} color="#A79E96" />
                         </TouchableOpacity>
                      </View>
                   ))}
                   
                   <TouchableOpacity onPress={addTweet} className="py-2">
                      <Text className="text-[#A79E96] text-xs">+ add tweet {twThreadTweets.length + 2}</Text>
                   </TouchableOpacity>
                </View>
             )}

             <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">Özel Açıklama (Opsiyonel)</Text>
             <TextInput 
                value={twCustomCaption} onChangeText={setTwCustomCaption}
                placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
                multiline textAlignVertical="top" maxLength={280}
             />
             <Text className="text-[#A79E96]/50 text-[10px] text-right">{twCustomCaption.length}/280</Text>
          </View>
        )}


         {/* --- TIKTOK SETTINGS --- */}
        {selectedPlatforms['tiktok'] && (
          <View className="mb-4 bg-[#2A2631]/50 rounded-xl p-4 border border-[#00f0ff]/30">
             <View className="flex-row items-center mb-4">
               <View className="w-6 h-6 rounded bg-[#000] items-center justify-center mr-2 border border-white/10">
                 <Ionicons name="logo-tiktok" size={14} color="#00f0ff" />
               </View>
               <Text className="text-[#F6F1EC] font-semibold text-sm">TikTok</Text>
             </View>

             <TouchableOpacity 
               activeOpacity={0.8} 
               onPress={() => setTtSaveToInbox(!ttSaveToInbox)} 
               className="flex-row items-start mb-4 bg-[#201D24]/50 p-3 rounded-lg border border-white/5"
             >
                <View className={`w-4 h-4 rounded border mt-0.5 mr-3 items-center justify-center ${ttSaveToInbox ? 'bg-[#22B573] border-[#22B573]' : 'border-white/20 bg-transparent'}`}>
                   {ttSaveToInbox && <MaterialIcons name="check" size={12} color="#1C3327" />}
                </View>
                <View className="flex-1">
                  <Text className="text-[#F6F1EC] text-xs font-semibold mb-1">TikTok taslaklarına kaydet</Text>
                  <Text className="text-[#A79E96]/80 text-[10px] leading-4">Video direkt yayınlanmaz, taslak olarak yüklenir. İsterseniz TikTok üzerinden müzik ekleyip yayınlayabilirsiniz.</Text>
                </View>
             </TouchableOpacity>

             <Text className="text-[#A79E96] text-xs font-medium mb-1">Özel Açıklama (Opsiyonel)</Text>
             <TextInput 
               value={ttCustomCaption} onChangeText={setTtCustomCaption}
               placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
               multiline
               className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 min-h-[60px]"
               maxLength={2200}
             />
             <Text className="text-[#A79E96]/50 text-[10px] text-right mt-1">{ttCustomCaption.length}/2200</Text>
             </View>
          )}

          {/* --- PINTEREST SETTINGS --- */}
          {selectedPlatforms['pinterest'] && (
            <View className="mb-4 bg-[#2A2631]/50 rounded-xl p-4 border border-[#E60023]/30">
               <View className="flex-row items-center mb-4">
                 <View className="w-6 h-6 rounded bg-[#E60023]/10 items-center justify-center mr-2 border border-[#E60023]/20">
                   <Ionicons name="logo-pinterest" size={14} color="#E60023" />
                 </View>
                 <Text className="text-[#F6F1EC] font-semibold text-sm">Pinterest</Text>
               </View>

               <Text className="text-[#A79E96] text-xs font-medium mb-1">Başlık (Opsiyonel)</Text>
               <TextInput 
                 value={pinTitle} onChangeText={setPinTitle}
                 placeholder="Pin'iniz için özel bir başlık girin..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                 className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1"
               />
               <Text className="text-[#A79E96]/60 text-[10px] mb-4">Zorunlu değildir. Boş bırakılırsa ana metnin ilk satırı başlık yapılır.</Text>

               <Text className="text-[#A79E96] text-xs font-medium mb-1">Hedef Bağlantı (Opsiyonel)</Text>
               <TextInput 
                 value={pinLink} onChangeText={setPinLink}
                 placeholder="https://example.com" placeholderTextColor="rgba(185, 202, 203, 0.5)"
                 keyboardType="url"
                 autoCapitalize="none"
                 className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1"
               />
               <Text className="text-[#A79E96]/60 text-[10px] mb-4">Pin'e tıklandığında gidilecek URL bağlantısını belirler.</Text>

               <Text className="text-[#A79E96] text-xs font-medium mb-1">Özel Açıklama (Opsiyonel)</Text>
               <TextInput 
                 value={pinCustomCaption} onChangeText={setPinCustomCaption}
                 placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                 multiline
                 className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 min-h-[60px]"
                 maxLength={500}
               />
               <Text className="text-[#A79E96]/50 text-[10px] text-right mt-1">{pinCustomCaption.length}/500</Text>
            </View>
          )}

        {/* --- GOOGLE BUSINESS PROFILE SETTINGS --- */}
        {selectedPlatforms['googlebusiness'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#4285F4] items-center justify-center mr-2">
                 <Ionicons name="business" size={14} color="#fff" />
               </View>
               <Text className="text-[#F6F1EC] font-semibold">Google Business</Text>
             </View>

             <View className="flex-row mb-3 bg-[#2A2631] rounded-lg p-1 border border-white/5">
                {['STANDARD', 'EVENT', 'OFFER'].map(type => (
                  <TouchableOpacity 
                    key={type} onPress={() => setGbpPostType(type)}
                    className={`flex-1 py-1.5 rounded justify-center items-center ${gbpPostType === type ? 'bg-[#4285F4]' : 'bg-transparent'}`}
                  >
                    <Text className={`text-[11px] font-medium ${gbpPostType === type ? 'text-white' : 'text-[#A79E96]'}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
             </View>

             {(gbpPostType === 'STANDARD' || gbpPostType === 'EVENT') && (
               <View className="mb-3">
                 <Text className="text-[#A79E96] text-xs font-medium mb-1">Call To Action</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
                    {['NONE', 'LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL'].map(cta => (
                      <TouchableOpacity 
                        key={cta} onPress={() => setGbpCallToAction(cta)}
                        className={`px-3 py-1.5 rounded-lg border mr-2 ${gbpCallToAction === cta ? 'bg-[#4285F4]/10 border-[#4285F4]' : 'bg-[#2A2631] border-white/10'}`}
                      >
                        <Text className={`text-[10px] ${gbpCallToAction === cta ? 'text-[#4285F4]' : 'text-[#A79E96]'}`}>
                          {cta.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
                 {gbpCallToAction !== 'NONE' && gbpCallToAction !== 'CALL' && (
                    <TextInput 
                      value={gbpCtaUrl} onChangeText={setGbpCtaUrl}
                      placeholder="https://..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                      className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2"
                    />
                 )}
               </View>
             )}

             {gbpPostType === 'EVENT' && (
               <View className="mb-2 bg-[#2A2631]/30 p-2 rounded-lg border border-white/5">
                  <Text className="text-[#A79E96] text-[10px] font-medium mb-1">Event Details</Text>
                  <TextInput value={gbpEventTitle} onChangeText={setGbpEventTitle} placeholder="Event Title" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded text-[#F6F1EC] text-xs px-2 py-1.5 mb-2" />
                  <View className="flex-row space-x-2">
                    <TextInput value={gbpEventStartDate} onChangeText={setGbpEventStartDate} placeholder="Start YYYY-MM-DD" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="flex-1 bg-[#201D24]/50 border border-white/5 rounded text-[#F6F1EC] text-xs px-2 py-1.5 mr-1" />
                    <TextInput value={gbpEventEndDate} onChangeText={setGbpEventEndDate} placeholder="End YYYY-MM-DD" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="flex-1 bg-[#201D24]/50 border border-white/5 rounded text-[#F6F1EC] text-xs px-2 py-1.5" />
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
               <Text className="text-[#F6F1EC] font-semibold">Pinterest</Text>
             </View>

             <TextInput value={pinBoardId} onChangeText={setPinBoardId} placeholder="Board ID (Required)" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-2" />
             <TextInput value={pinTitle} onChangeText={setPinTitle} placeholder="Pin Title (Max 100 chars)" placeholderTextColor="rgba(185, 202, 203, 0.5)" maxLength={100} className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-2" />
             <TextInput value={pinLink} onChangeText={setPinLink} placeholder="Destination Link" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1" />
          </View>
        )}

        {/* --- REDDIT SETTINGS --- */}
        {selectedPlatforms['reddit'] && (
          <View className="mb-4">
             <View className="flex-row items-center mb-3">
               <View className="w-6 h-6 rounded bg-[#FF4500] items-center justify-center mr-2">
                 <Ionicons name="logo-reddit" size={14} color="#fff" />
               </View>
               <Text className="text-[#F6F1EC] font-semibold">Reddit</Text>
             </View>

             <View className="flex-row space-x-2 mb-2">
               <View className="flex-row items-center bg-[#201D24]/50 border border-white/5 rounded-lg px-3 py-2 flex-1 mr-2">
                 <Text className="text-[#A79E96] mr-1">r/</Text>
                 <TextInput value={redditSubreddit} onChangeText={setRedditSubreddit} placeholder="subreddit" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="text-[#F6F1EC] text-sm flex-1 p-0" />
               </View>
               <TextInput value={redditTitle} onChangeText={setRedditTitle} placeholder="Post Title" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 flex-1" />
             </View>

             <View className="flex-row mt-2">
                <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditNsfw(!redditNsfw)} className="flex-row items-center mr-4">
                   <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditNsfw ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                      {redditNsfw && <MaterialIcons name="check" size={12} color="#fff" />}
                   </View>
                   <Text className="text-[#F6F1EC] text-xs">NSFW</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditSpoiler(!redditSpoiler)} className="flex-row items-center mr-4">
                   <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditSpoiler ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                      {redditSpoiler && <MaterialIcons name="check" size={12} color="#fff" />}
                   </View>
                   <Text className="text-[#F6F1EC] text-xs">Spoiler</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditSendReplies(!redditSendReplies)} className="flex-row items-center">
                   <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditSendReplies ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                      {redditSendReplies && <MaterialIcons name="check" size={12} color="#fff" />}
                   </View>
                   <Text className="text-[#F6F1EC] text-xs">Inbox Replies</Text>
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
               <Text className="text-[#F6F1EC] font-semibold">Telegram</Text>
             </View>

             <TextInput value={tgChatId} onChangeText={setTgChatId} placeholder="@channelname or Chat ID" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-2" />
             
             <TouchableOpacity activeOpacity={0.8} onPress={() => setTgDisableNotification(!tgDisableNotification)} className="flex-row items-center mb-1">
                <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${tgDisableNotification ? 'bg-[#2AABEE] border-[#2AABEE]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                   {tgDisableNotification && <MaterialIcons name="check" size={12} color="#fff" />}
                </View>
                <Text className="text-[#F6F1EC] text-xs">Send Silently (No Notification)</Text>
             </TouchableOpacity>
          </View>
        )}

        {/* Publishing Options Section */}
        <View className="mb-6">
          <Text className="text-[#A79E96] text-xs font-medium mb-3">yayıncılık</Text>
          <View className="flex-row bg-[#2A2631]/50 rounded-lg p-1 mb-4 border border-white/5">
             <TouchableOpacity 
               onPress={() => setPublishMode('schedule')}
               className={`flex-1 items-center py-2 rounded-md ${publishMode === 'schedule' ? 'bg-[#34303C]' : ''}`}
             >
               <Text className={`text-sm ${publishMode === 'schedule' ? 'text-white' : 'text-[#A79E96]'}`}>Planlı</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setPublishMode('now')}
               className={`flex-1 items-center py-2 rounded-md ${publishMode === 'now' ? 'bg-[#34303C]' : ''}`}
             >
               <Text className={`text-sm ${publishMode === 'now' ? 'text-white' : 'text-[#A79E96]'}`}>Şimdi</Text>
             </TouchableOpacity>
          </View>

          {publishMode === 'schedule' && (
            <>
              <Text className="text-[#A79E96] text-xs font-medium mb-2">tarih & saat (GG.AA.YYYY SS:DD)</Text>
              <View className="flex-row items-center justify-between bg-[#2A2631]/50 rounded-lg border border-white/5 p-3 mb-4">
                 <TextInput
                   value={scheduleDate}
                   onChangeText={setScheduleDate}
                   placeholder="16.08.2026 16:26"
                   placeholderTextColor="#A79E96"
                   className="flex-1 text-[#F6F1EC] text-sm"
                   accessibilityLabel="Paylaşım tarihi ve saati"
                 />
                 <MaterialIcons name="calendar-today" size={18} color="#A79E96" />
              </View>

              <Text className="text-[#A79E96] text-xs font-medium mb-2">timezone</Text>
              <TouchableOpacity 
                onPress={() => setTimezoneModalVisible(true)}
                className="flex-row items-center justify-between bg-[#2A2631]/50 rounded-lg border border-white/5 p-3 mb-4"
              >
                 <Text className="text-[#F6F1EC] text-sm">{timezone}</Text>
                 <MaterialIcons name="keyboard-arrow-down" size={20} color="#A79E96" />
              </TouchableOpacity>
            </>
          )}

          <View className="bg-[#22B573]/10 rounded-lg border border-[#22B573]/20 p-4 flex-row items-center mt-2">
            <MaterialIcons name="info-outline" size={20} color="#22B573" className="mr-3" />
            <Text className="text-[#F6F1EC] text-xs flex-1 ml-2">
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
          className="w-full px-5 pt-4 bg-[#17151A] border-t border-white/5"
          style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
        >
          <TouchableOpacity 
            className="w-full" 
            onPress={handleShare}
            disabled={isSharing}
          >
            <View className="rounded-full overflow-hidden w-full relative bg-[#2A2631]">
              <LinearGradient
                colors={['#22B573', '#C2478D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 px-6 flex-row items-center justify-center"
                style={{ opacity: isSharing ? 0.7 : 1 }}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#17151A" style={{ marginRight: 8, zIndex: 10 }} />
                ) : (
                  <MaterialIcons name="send" size={20} color="#17151A" style={{ marginRight: 8, zIndex: 10 }} />
                )}
                <Text className="text-[#17151A] font-bold text-lg" style={{ zIndex: 10 }}>
                  {isSharing ? `Yükleniyor... ${uploadProgress}%` : t('sosyalMedya.generate.shareSelected')}
                </Text>
              </LinearGradient>
              {isSharing && (
                <View 
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.4)', width: `${uploadProgress}%`, zIndex: 5 }}
                />
              )}
            </View>
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
          <View className="bg-[#2A2631] rounded-t-3xl h-[60%]">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-[#F6F1EC] text-lg font-semibold">Kategori Seçin</Text>
              <TouchableOpacity onPress={() => setYtCategoryModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#A79E96" />
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
                  className={`flex-row justify-between items-center p-4 border-b border-white/5 ${ytCategory === cat ? 'bg-[#22B573]/10' : ''}`}
                >
                  <Text className={`text-base ${ytCategory === cat ? 'text-[#22B573] font-bold' : 'text-[#F6F1EC]'}`}>{cat}</Text>
                  {ytCategory === cat && (
                    <MaterialIcons name="check" size={20} color="#22B573" />
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
          <View className="bg-[#2A2631] rounded-t-3xl h-[60%]">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-[#F6F1EC] text-lg font-semibold">Timezone Seçin</Text>
              <TouchableOpacity onPress={() => setTimezoneModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#A79E96" />
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
                  className={`flex-row justify-between items-center p-4 border-b border-white/5 ${timezone === tz ? 'bg-[#22B573]/10' : ''}`}
                >
                  <Text className={`text-base ${timezone === tz ? 'text-[#22B573] font-bold' : 'text-[#F6F1EC]'}`}>{tz}</Text>
                  {timezone === tz && (
                    <MaterialIcons name="check" size={20} color="#22B573" />
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


