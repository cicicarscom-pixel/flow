import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { flowAiShareHandoff } from '../../../flow_ai/flowAiShareHandoff';
import { emitFlowEvent } from '../../../flow_ai/flowAiEvents';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Dimensions, ImageBackground, Alert, ActivityIndicator, KeyboardAvoidingView, Keyboard, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer } from 'expo-video';
import { decode } from 'base64-arraybuffer';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase , GlobalAppBar } from '../../../../shared';
import { PLATFORM_MEDIA_RULES } from '../../domain/platformRules';
import { FlowHighlight, useAiUretimFlowEvents } from '../../../flow_ai';
import { AnimatedBorderCard } from './aiuretim/AnimatedBorderCard';
import { TIMEZONES, MAX_VIDEO_BYTES_FOR_CAPTION, VIDEO_MIME_BY_EXT } from './aiuretim/aiUretimConstants';
import { MediaPickerSection } from './aiuretim/MediaPickerSection';
import { PlatformSelectorSection } from './aiuretim/PlatformSelectorSection';
import { PlatformYoutubeSettings } from './aiuretim/PlatformYoutubeSettings';
import { PlatformFacebookSettings } from './aiuretim/PlatformFacebookSettings';
import { PlatformInstagramSettings } from './aiuretim/PlatformInstagramSettings';
import { PlatformLinkedinSettings } from './aiuretim/PlatformLinkedinSettings';
import { PlatformTwitterSettings } from './aiuretim/PlatformTwitterSettings';
import { PlatformTiktokSettings } from './aiuretim/PlatformTiktokSettings';
import { PlatformPinterestSettings } from './aiuretim/PlatformPinterestSettings';
import { PlatformBlueskySettings } from './aiuretim/PlatformBlueskySettings';
import { PlatformGooglebusinessSettings } from './aiuretim/PlatformGooglebusinessSettings';
import { PlatformPinterestSettingsExtra } from './aiuretim/PlatformPinterestSettingsExtra';
import { PlatformRedditSettings } from './aiuretim/PlatformRedditSettings';
import { PlatformTelegramSettings } from './aiuretim/PlatformTelegramSettings';
import { PublishingSection } from './aiuretim/PublishingSection';


const { width } = Dimensions.get('window');

let persistedImage = null;
let persistedText = null;
let persistedMediaType = 'text';

export default function AiUretimScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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

  const videoPlayer = useVideoPlayer(null, (player) => {
    player.loop = true;
    player.muted = true;
  });

  React.useEffect(() => {
    if (mediaType === 'video' && localImage) {
      videoPlayer.replaceAsync(localImage).then(() => videoPlayer.play());
    }
  }, [localImage, mediaType]);

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

  // Bluesky Settings
  // 17.09.2026: Web tarafında (flowweb) aynı eksiklik bulunup düzeltildi —
  // Zernio'nun kendi panelinde Bluesky için "thread" ve "custom caption"
  // (300 karakter) alanları var ama bu ekranda Bluesky hiç işlenmiyordu.
  // Alan adları (isThread/caption) Zernio API'de resmi olarak doğrulanmadı;
  // bu ekrandaki Twitter/X entegrasyonuyla aynı adlandırma kullanıldı çünkü
  // Zernio panelindeki UI birebir aynı (thread anahtarı + custom caption).
  const [bskyIsThread, setBskyIsThread] = useState(false);
  const [bskyCustomCaption, setBskyCustomCaption] = useState('');

  const YOUTUBE_CATEGORIES = [
    "Film & Animation", "Autos & Vehicles", "Music", "Pets & Animals", "Sports", 
    "Travel & Events", "Gaming", "People & Blogs", "Comedy", "Entertainment", 
    "News & Politics", "Howto & Style", "Education", "Science & Technology", "Nonprofits & Activism"
  ];

  // Fetch connected accounts on mount

  const loadAccounts = React.useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || session?.user?.id;
    if (!userId) return [];

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
        setSelectedPlatforms(prev => Object.keys(prev).length ? prev : initialSelected);
        return accounts;
      } catch(e) {
        console.warn("Failed to fetch accounts", e);
      }
    }
    return [];
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  React.useEffect(() => {
    const unsub = navigation?.addListener?.('focus', () => { loadAccounts(); });
    return unsub;
  }, [navigation, loadAccounts]);

  // Update local and persisted state when route params change
  React.useEffect(() => {
    if (route?.params?.selectedImage) {
      setTimeout(() => {
        setLocalImage(route.params.selectedImage);
        if (route.params.selectedMediaType === 'video') {
          setMediaType('video');
          persistedMediaType = 'video';
          
          if (route.params.flowAiShare) {
            const job = flowAiShareHandoff.takeJob();
            if (job) {
              flowShareRef.current = { platforms: (Array.isArray(job.platforms) ? job.platforms : []).map((p) => String(p).toLowerCase()) };
              const file = flowAiShareHandoff.getFile();
              if (file && file.durationSec) {
                setMediaDurationMs(file.durationSec * 1000);
              }
              if (job.scheduledLocal) {
                setPublishMode('schedule');
                const parts = job.scheduledLocal.split(' ');
                if (parts.length === 2) {
                   const dateParts = parts[0].split('-');
                   if (dateParts.length === 3) {
                      const dStr = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]} ${parts[1]}`;
                      setScheduleDate(dStr);
                   }
                }
                if (job.timezone) {
                   setTimezone(job.timezone);
                }
              } else {
                setPublishMode('now');
              }
            }
          }
        }
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

  // Flow AI taslağı: istenen platformlar bağlı hesaplar arasında seçilir (taslak yayınlanmaz, kullanıcı Paylaş'a basar)
  React.useEffect(() => {
    const wanted = route?.params?.draftPlatforms;
    if (!Array.isArray(wanted) || wanted.length === 0 || zernioAccounts.length === 0) return;
    const wantedSet = new Set(wanted.map((p) => String(p).toLowerCase()));
    const next = {};
    zernioAccounts.forEach((acc) => { next[acc.platform] = wantedSet.has(String(acc.platform).toLowerCase()); });
    setSelectedPlatforms(next);
  }, [route?.params?.draftId, zernioAccounts]);

  const generateCaption = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingText(true);
    try {
      const isBase64 = localImage?.startsWith('data:image');
      let mediaData = isBase64 ? localImage.split(',')[1] : undefined;
      let mimeType = isBase64 ? localImage.match(/data:(.*?);/)[1] : undefined;

      // Video: kısa videolar (≤ 10 MB) base64 olarak gönderilir; sunucu ses ve görüntüden içerik çıkarır.
      let videoNotSent = false;
      if (!isBase64 && mediaType === 'video' && localImage) {
        try {
          const info = await FileSystem.getInfoAsync(localImage);
          if (info.exists && info.size && info.size <= MAX_VIDEO_BYTES_FOR_CAPTION) {
            mediaData = await FileSystem.readAsStringAsync(localImage, { encoding: 'base64' });
            const ext = (localImage.split('?')[0].split('.').pop() || '').toLowerCase();
            mimeType = VIDEO_MIME_BY_EXT[ext] || 'video/mp4';
          } else {
            videoNotSent = true;
          }
        } catch (e) {
          console.warn('Video okunamadı:', e?.message);
          videoNotSent = true;
        }
        // Video gönderilemedi ve talimat kısaysa: içerik bilinmez, kullanıcıdan konuyu yazmasını iste.
        if (videoNotSent && aiPrompt.trim().length < 30) {
          Alert.alert(t('sosyalMedya.alerts.error'), t('flowAi.captionVideoHint'));
          return;
        }
      }

      // Tek metin servisi (flow-caption, JWT'li): persona tonu + platform kuralları + günlük sınır sunucuda uygulanır.
      const selectedNames = Object.keys(selectedPlatforms).filter((p) => selectedPlatforms[p]);
      const { data, error } = await supabase.functions.invoke('flow-caption', {
        body: {
          brief: aiPrompt,
          platforms: selectedNames,
          media: mediaData,
          mimeType: mediaData ? mimeType : undefined
        }
      });

      if (error || data?.error) {
        let code = data?.error;
        if (error) {
          try { code = (await error.context?.json?.())?.error; } catch (_) { /* gövde okunamadı */ }
        }
        if (code === 'DAILY_LIMIT') {
          Alert.alert(t('sosyalMedya.alerts.error'), t('flowAi.captionLimit'));
          return;
        }
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
    const jobPlatforms = flowShareRef.current ? flowShareRef.current.platforms : null;
    let allowedPlatforms = jobPlatforms
      ? connectedAccounts.filter((acc) => jobPlatforms.includes(String(acc.platform).toLowerCase()))
      : connectedAccounts.filter(acc => selectedPlatforms[acc.platform]);

    if (allowedPlatforms.length === 0) {
      Alert.alert(t('sosyalMedya.alerts.info'), "Lütfen en az bir platform seçin.");
      return false;
    }

    let contentToShare = localText || t('sosyalMedya.generate.fallbackContent');
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
      } catch {
        Alert.alert("Hata", "Tarih formatı hatalı. Lütfen 'GÜN.AY.YIL SAAT:DAKİKA' (örn: 16.08.2026 16:26) şeklinde girin.");
        setIsSharing(false);
        return false;
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
      } else if (p === 'bluesky') {
        platformOptions = {
          isThread: bskyIsThread,
          caption: bskyCustomCaption || undefined
        };
      }

      return {
        platform: acc.platform,
        accountId: acc._id || acc.id || acc.accountId || acc.uuid,
        platformSpecificData: Object.keys(platformOptions).length > 0 ? platformOptions : undefined
      };
    });

    try {
      let finalMediaItems = undefined;
      let storageBucket = undefined;
      let storagePath = undefined;
      
      // Eğer seçili medya varsa ve uzak URL değilse, Zernio'nun erişebilmesi için önce Storage'a yükle
      if (localImage) {
        const isRemoteOrDataUrl = /^(https?:|data:)/i.test(localImage);
        
        if (!isRemoteOrDataUrl) {
          const ext = contentType === 'video' ? 'mp4' : 'jpg';
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("No session");
          const fileName = `${session.user.id}/post-${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          
          const base64 = await FileSystem.readAsStringAsync(localImage, { encoding: FileSystem.EncodingType.Base64 });

          // A1 Düzeltmesi: Ham fetch yerine SDK kullanımı (apikey ve auth header'ları otomatik yönetilir)
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, decode(base64), {
               contentType: contentType === 'video' ? 'video/mp4' : 'image/jpeg'
            });

          if (uploadError) {
             throw new Error(uploadError.message || "Medya yüklenirken bir sorun oluştu.");
          }

          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalMediaItems = [{ type: contentType, url: publicUrlData.publicUrl }];
          storageBucket = 'avatars';
          storagePath = fileName;
        } else {
          // data:image... veya zaten public url ise direkt yolla
          finalMediaItems = [{ type: contentType, url: localImage }];
        }
      }

      const { data: postData, error: postError } = await supabase.functions.invoke('zernio-client', {
        body: { 
          action: 'create-post', 
          payload: { 
            content: contentToShare,
            platforms: platformsPayload,
            publishNow: publishMode === 'now',
            scheduledFor: finalScheduledFor,
            timezone: finalTimezone,
            mediaItems: finalMediaItems
          } 
        }
      });
      
      if (postError || postData?.error) {
        let actualError = postError?.message || (typeof postData?.error === 'string' ? postData.error : postData?.error?.message) || "Zernio API hatası";
        if (postError && postError.context && typeof postError.context.json === 'function') {
           try {
              const errJson = await postError.context.json();
              actualError = errJson.error || actualError;
           } catch {}
        }
        throw new Error(actualError);
      }
      
      // Başarılı olan gönderimleri veritabanına kaydet
      try {
         const savedMediaUrls = finalMediaItems && finalMediaItems.length > 0 ? [finalMediaItems[0].url] : [];
         
         const forceDeleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

         await supabase.from('posts').insert({
            profile_id: organizationId,
            zernio_post_id: postData?.postId || 'mock-post-id',
            content: contentToShare,
            media_urls: savedMediaUrls,
            status: 'published',
            platforms: allowedPlatforms.map(p => p.platform),
            // B Düzeltmesi: Geçici storage takip kolonları
            media_storage_source: storageBucket ? 'supabase' : 'zernio',
            storage_bucket: storageBucket,
            storage_path: storagePath,
            force_delete_at: storageBucket ? forceDeleteAt : null
         });
      } catch (dbError) {
         console.error("DB Kayıt Hatası:", dbError);
      }
    } catch (err) {
      console.warn(`[Zernio API Hatası]:`, err);
      throw err;
    }

    // Kullanıcı Deneyimi (Toast/Alert): Zero UI prensibi
    const viaFlowAi = !!flowShareRef.current;
    if (!viaFlowAi) {
      Alert.alert(
        "Başarılı!", 
        publishMode === 'now' 
          ? "Gönderiniz seçili platformlarda anında paylaşıldı." 
          : "Gönderiniz planlandı ve zamanı gelince paylaşılacak."
      );
    }
    return true;
  };

  const handleShareRef = useRef(null);
  const flowShareRef = useRef(null);

  useEffect(() => {
    handleShareRef.current = handleShare;
  }, [handleShare]);

  useEffect(() => {
    if (route?.params?.flowAiShare) {
      const hasSelection = flowShareRef.current ? flowShareRef.current.platforms.length > 0 : Object.values(selectedPlatforms).some(Boolean);
      const ready = !!(localImage && localText && hasSelection && !isSharing);
      flowAiShareHandoff.registerScreen({
        ready,
        share: () => {
          if (handleShareRef.current) {
            handleShareRef.current();
          }
        }
      });
      return () => flowAiShareHandoff.unregisterScreen();
    }
  }, [route?.params?.flowAiShare, localImage, localText, selectedPlatforms, isSharing]);

  const handleShare = async () => {
    let progressInterval;
    const shareError = (msg) => {
      if (route?.params?.flowAiShare) emitFlowEvent('share-result', { ok: false, message: msg });
    };
    const shareSuccess = () => {
      if (route?.params?.flowAiShare) emitFlowEvent('share-result', { ok: true });
    };

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
        shareError(t('sosyalMedya.alerts.noSession'));
        flowShareRef.current = null;
        return;
      }

      let accountsNow = zernioAccounts;
      if (accountsNow.length === 0) accountsNow = await loadAccounts();

      if (accountsNow.length === 0) {
        clearInterval(progressInterval);
        Alert.alert(t('sosyalMedya.alerts.info'), t('sosyalMedya.alerts.connectAccountFirst'));
        setIsSharing(false);
        setUploadProgress(0);
        shareError(t('sosyalMedya.alerts.connectAccountFirst'));
        flowShareRef.current = null;
        return;
      }

      // İçerik tipini belirle
      const currentContentType = localImage ? mediaType : 'text';
      
      // Otonom yönlendirmeyi başlatan ana fonksiyonu çağır
      const ok = await publishPost(accountsNow, currentContentType);
      
      if (ok === false) {
        clearInterval(progressInterval);
        setIsSharing(false);
        setUploadProgress(0);
        shareError(t('flowAi.share.failedShort'));
        flowShareRef.current = null;
        return;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      shareSuccess();
      flowShareRef.current = null;
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
      shareError(err?.message || "Hata");
      flowShareRef.current = null;
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

  const [mediaDurationMs, setMediaDurationMs] = useState(0);

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
          
          const duration = isVideo ? (asset.duration || 0) : 0;
          setMediaDurationMs(duration);

          if (isVideo && duration > 0) {
            // Yeni video yüklendiğinde mevcut seçili platformları kontrol et
            let uncheckedPlatforms = [];
            const durationSec = duration / 1000;
            const updatedPlatforms = { ...selectedPlatforms };
            
            for (const platform of Object.keys(updatedPlatforms)) {
              if (updatedPlatforms[platform]) {
                const rule = PLATFORM_MEDIA_RULES[platform.toLowerCase()];
                if (rule && rule.maxDurationSec && durationSec > rule.maxDurationSec) {
                  updatedPlatforms[platform] = false;
                  uncheckedPlatforms.push(platform);
                }
              }
            }

            if (uncheckedPlatforms.length > 0) {
              setSelectedPlatforms(updatedPlatforms);
              Alert.alert(
                "Video Süre Sınırı Aşıldı",
                `Yüklediğiniz video ${Math.round(durationSec)} saniye uzunluğunda. Şu platformların sınırlarını aştığı için otomatik olarak kaldırıldılar:\n\n` +
                uncheckedPlatforms.map(p => `- ${p.charAt(0).toUpperCase() + p.slice(1)} (Max: ${PLATFORM_MEDIA_RULES[p.toLowerCase()].maxDurationSec} sn)`).join('\n')
              );
            }
          }
          
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

  // Flow AI rehberi: akış olayları ve otomatik kaydırma (ekran mantığına dokunmaz)
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  useAiUretimFlowEvents({
    hasMedia: !!localImage,
    platformCount: Object.values(selectedPlatforms).filter(Boolean).length,
    hasCaption: !!(localText && localText.trim()),
  });

  const handlePlatformToggle = (platformName) => {
    const isCurrentlySelected = selectedPlatforms[platformName];
    
    // Eğer platform yeni seçiliyorsa (önceden seçili değilse) ve medyada bir video varsa kuralı kontrol et
    if (!isCurrentlySelected && mediaType === 'video' && mediaDurationMs > 0) {
      const rule = PLATFORM_MEDIA_RULES[platformName.toLowerCase()];
      if (rule && rule.maxDurationSec) {
        const durationSec = mediaDurationMs / 1000;
        if (durationSec > rule.maxDurationSec) {
          Alert.alert(
            "Video Süre Sınırı",
            `${platformName.charAt(0).toUpperCase() + platformName.slice(1)} platformunda en fazla ${rule.maxDurationSec} saniyelik video paylaşabilirsiniz (Yüklenen: ${Math.round(durationSec)} sn).`
          );
          return; // Seçimi engelle
        }
      }
    }

    // Seçime izin ver veya seçimi kaldır
    setSelectedPlatforms(prev => ({ ...prev, [platformName]: !prev[platformName] }));
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
        behavior="padding"
      >
        <ScrollView ref={scrollRef} onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        
        {/* Central Feature: Image Container */}
        <View className="items-center w-full mb-6 relative">
          <MediaPickerSection localImage={localImage} mediaType={mediaType} pickMedia={pickMedia} scrollRef={scrollRef} scrollYRef={scrollYRef} t={t} videoPlayer={videoPlayer} />
        </View>

        {/* Caption Editor */}
        <FlowHighlight screen="ai_uretim" id="caption_input" scrollRef={scrollRef} scrollYRef={scrollYRef}>
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
          <Text
            testID="ai_caption_note"
            className="text-[11px] leading-4 mb-4"
            style={{ color: mediaType === 'video' && localImage ? '#F5A524' : 'rgba(167,158,150,0.8)', fontWeight: mediaType === 'video' && localImage ? '600' : '400' }}
          >
            {t('sosyalMedya.generate.aiCaptionNote')}
          </Text>
          
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
        </FlowHighlight>

        {/* Platforms Section */}
        <PlatformSelectorSection handlePlatformToggle={handlePlatformToggle} navigation={navigation} scrollRef={scrollRef} scrollYRef={scrollYRef} selectedPlatforms={selectedPlatforms} t={t} zernioAccounts={zernioAccounts} />

        {/* --- YOUTUBE SETTINGS --- */}
        <PlatformYoutubeSettings selectedPlatforms={selectedPlatforms} setYtCategoryModalVisible={setYtCategoryModalVisible} setYtCustomCaption={setYtCustomCaption} setYtTags={setYtTags} setYtTitle={setYtTitle} setYtVisibility={setYtVisibility} t={t} ytCategory={ytCategory} ytCustomCaption={ytCustomCaption} ytTags={ytTags} ytTitle={ytTitle} ytVisibility={ytVisibility} />

        {/* --- FACEBOOK SETTINGS --- */}
        <PlatformFacebookSettings fbCustomCaption={fbCustomCaption} fbFirstComment={fbFirstComment} fbFormat={fbFormat} selectedPlatforms={selectedPlatforms} setFbCustomCaption={setFbCustomCaption} setFbFirstComment={setFbFirstComment} setFbFormat={setFbFormat} t={t} />

        {/* --- INSTAGRAM SETTINGS --- */}
        <PlatformInstagramSettings igAiLabel={igAiLabel} igCustomCaption={igCustomCaption} igFirstComment={igFirstComment} igFormat={igFormat} selectedPlatforms={selectedPlatforms} setIgAiLabel={setIgAiLabel} setIgCustomCaption={setIgCustomCaption} setIgFirstComment={setIgFirstComment} setIgFormat={setIgFormat} t={t} />

        {/* --- LINKEDIN SETTINGS --- */}
        <PlatformLinkedinSettings liCustomCaption={liCustomCaption} liDisableLinkPreview={liDisableLinkPreview} liFirstComment={liFirstComment} liMentionDisplayName={liMentionDisplayName} liMentionUsername={liMentionUsername} liRepostLink={liRepostLink} selectedPlatforms={selectedPlatforms} setLiCustomCaption={setLiCustomCaption} setLiDisableLinkPreview={setLiDisableLinkPreview} setLiFirstComment={setLiFirstComment} setLiMentionDisplayName={setLiMentionDisplayName} setLiMentionUsername={setLiMentionUsername} setLiRepostLink={setLiRepostLink} setShowLiMentionTooltip={setShowLiMentionTooltip} setShowLiRepostTooltip={setShowLiRepostTooltip} showLiMentionTooltip={showLiMentionTooltip} showLiRepostTooltip={showLiRepostTooltip} t={t} />

        {/* --- TWITTER (X) SETTINGS --- */}
        <PlatformTwitterSettings addTweet={addTweet} removeTweet={removeTweet} selectedPlatforms={selectedPlatforms} setTwCustomCaption={setTwCustomCaption} setTwIsThread={setTwIsThread} t={t} twCustomCaption={twCustomCaption} twIsThread={twIsThread} twThreadTweets={twThreadTweets} updateTweet={updateTweet} />


         {/* --- TIKTOK SETTINGS --- */}
        <PlatformTiktokSettings selectedPlatforms={selectedPlatforms} setTtCustomCaption={setTtCustomCaption} setTtSaveToInbox={setTtSaveToInbox} t={t} ttCustomCaption={ttCustomCaption} ttSaveToInbox={ttSaveToInbox} />

          {/* --- PINTEREST SETTINGS --- */}
          <PlatformPinterestSettings pinCustomCaption={pinCustomCaption} pinLink={pinLink} pinTitle={pinTitle} selectedPlatforms={selectedPlatforms} setPinCustomCaption={setPinCustomCaption} setPinLink={setPinLink} setPinTitle={setPinTitle} t={t} />

        {/* --- BLUESKY SETTINGS --- */}
        <PlatformBlueskySettings bskyCustomCaption={bskyCustomCaption} bskyIsThread={bskyIsThread} selectedPlatforms={selectedPlatforms} setBskyCustomCaption={setBskyCustomCaption} setBskyIsThread={setBskyIsThread} t={t} />
        {/* --- GOOGLE BUSINESS PROFILE SETTINGS --- */}
        <PlatformGooglebusinessSettings gbpCallToAction={gbpCallToAction} gbpCtaUrl={gbpCtaUrl} gbpEventEndDate={gbpEventEndDate} gbpEventStartDate={gbpEventStartDate} gbpEventTitle={gbpEventTitle} gbpPostType={gbpPostType} selectedPlatforms={selectedPlatforms} setGbpCallToAction={setGbpCallToAction} setGbpCtaUrl={setGbpCtaUrl} setGbpEventEndDate={setGbpEventEndDate} setGbpEventStartDate={setGbpEventStartDate} setGbpEventTitle={setGbpEventTitle} setGbpPostType={setGbpPostType} t={t} />

        {/* --- PINTEREST SETTINGS --- */}
        <PlatformPinterestSettingsExtra pinBoardId={pinBoardId} pinLink={pinLink} pinTitle={pinTitle} selectedPlatforms={selectedPlatforms} setPinBoardId={setPinBoardId} setPinLink={setPinLink} setPinTitle={setPinTitle} />

        {/* --- REDDIT SETTINGS --- */}
        <PlatformRedditSettings redditNsfw={redditNsfw} redditSendReplies={redditSendReplies} redditSpoiler={redditSpoiler} redditSubreddit={redditSubreddit} redditTitle={redditTitle} selectedPlatforms={selectedPlatforms} setRedditNsfw={setRedditNsfw} setRedditSendReplies={setRedditSendReplies} setRedditSpoiler={setRedditSpoiler} setRedditSubreddit={setRedditSubreddit} setRedditTitle={setRedditTitle} t={t} />

        {/* --- TELEGRAM SETTINGS --- */}
        <PlatformTelegramSettings selectedPlatforms={selectedPlatforms} setTgChatId={setTgChatId} setTgDisableNotification={setTgDisableNotification} t={t} tgChatId={tgChatId} tgDisableNotification={tgDisableNotification} />

        {/* Publishing Options Section */}
        <PublishingSection publishMode={publishMode} scheduleDate={scheduleDate} setPublishMode={setPublishMode} setScheduleDate={setScheduleDate} setTimezoneModalVisible={setTimezoneModalVisible} t={t} timezone={timezone} />

        </ScrollView>
        
        {/* Action Button (Fixed Bottom) */}
        {!isKeyboardVisible && (
        <View 
          className="w-full px-5 pt-4 bg-[#17151A] border-t border-white/5"
          style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
        >
          <FlowHighlight screen="ai_uretim" id="share_button">
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
          </FlowHighlight>
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
              <Text className="text-[#F6F1EC] text-lg font-semibold">{t('sosyalMedya.aiUretim.selectCategory')}</Text>
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
              <Text className="text-[#F6F1EC] text-lg font-semibold">{t('sosyalMedya.aiUretim.selectTimezone')}</Text>
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


