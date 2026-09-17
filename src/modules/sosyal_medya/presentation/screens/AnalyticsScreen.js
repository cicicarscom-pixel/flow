import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase , GlobalAppBar } from '../../../../shared';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { CustomButton } from '../../../../shared';


const { width, height } = Dimensions.get('window');

// Glassmorphism Card Wrapper
const GlassCard = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

// Let's replace PLATFORMS and TIME_RANGES inside the component so they can be translated
const getPlatforms = (t) => [
  { id: 'all', name: t('sosyalMedya.analytics.platforms.all'), icon: 'apps-outline', color: '#A79E96' },
  { id: 'tiktok', name: t('sosyalMedya.analytics.platforms.tiktok'), icon: 'musical-notes', color: '#ff0050' },
  { id: 'instagram', name: t('sosyalMedya.analytics.platforms.instagram'), icon: 'logo-instagram', color: '#E8A8CD' },
  { id: 'facebook', name: t('sosyalMedya.analytics.platforms.facebook'), icon: 'logo-facebook', color: '#22B573' },
  { id: 'youtube', name: t('sosyalMedya.analytics.platforms.youtube'), icon: 'logo-youtube', color: '#ff0000' },
  { id: 'linkedin', name: t('sosyalMedya.analytics.platforms.linkedin'), icon: 'logo-linkedin', color: '#0077b5' },
  { id: 'googlebusiness', name: t('sosyalMedya.analytics.platforms.googlebusiness'), icon: 'business', color: '#34a853' }
];

const getTimeRanges = (t) => [
  { id: '7d', name: t('sosyalMedya.analytics.timeRanges.7d'), days: 7 },
  { id: '30d', name: t('sosyalMedya.analytics.timeRanges.30d'), days: 30 },
  { id: '90d', name: t('sosyalMedya.analytics.timeRanges.90d'), days: 90 },
  { id: '1y', name: t('sosyalMedya.analytics.timeRanges.1y'), days: 365 }
];

// Animated Border Card for Bento Grid
const AnimatedBorderCard = ({ children, style, colors, padding = 16, borderRadius = 12, marginBottom = 0 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 2,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      return () => spinValue.stopAnimation();
    }, [])
  );

  // eslint-disable-next-line react-hooks/refs
  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <View style={[style, { overflow: 'hidden', padding: 2, borderRadius, marginBottom, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      <Animated.View style={{ 
        position: 'absolute', top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
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
      <View style={{ flex: 1, backgroundColor: '#17151A', borderRadius: borderRadius - 2, padding }}>
        {children}
      </View>
    </View>
  );
};

// Toggle Bar Component
const TopToggle = ({ activeTab, setActiveTab, t }) => {
  return (
    <View className="flex-row mx-5 mt-4 mb-4 bg-white/5 rounded-xl p-1 border border-white/10">
      <CustomButton 
        className={`flex-1 py-2.5 px-0 rounded-lg ${activeTab === 'posting' ? 'bg-[#22B573]/20 border border-[#22B573]/50' : 'bg-transparent'}`}
        textClassName={`text-[12px] font-bold ${activeTab === 'posting' ? 'text-[#22B573]' : 'text-[#A79E96]'}`}
        title={t('sosyalMedya.analytics.tabs.posting')}
        onPress={() => setActiveTab('posting')}
      />
      <CustomButton 
        className={`flex-1 py-2.5 px-0 rounded-lg ${activeTab === 'inbox' ? 'bg-[#C2478D]/20 border border-[#C2478D]/50' : 'bg-transparent'}`}
        textClassName={`text-[12px] font-bold ${activeTab === 'inbox' ? 'text-[#E8A8CD]' : 'text-[#A79E96]'}`}
        title={t('sosyalMedya.analytics.tabs.inbox')}
        onPress={() => setActiveTab('inbox')}
      />
    </View>
  );
};

// Filter Row Component
const FilterRow = ({ selectedPlatform, onOpenPlatformSelector, selectedTimeRange, onOpenTimeSelector }) => (
  <View className="flex-row mx-5 mb-4 justify-between">
    <TouchableOpacity 
      onPress={onOpenPlatformSelector}
      className="flex-row items-center bg-white/5 px-3 py-1.5 rounded border border-white/10"
    >
      <Text className="text-[10px] text-[#F6F1EC] mr-1">{selectedPlatform.name}</Text>
      <MaterialIcons name="keyboard-arrow-down" size={14} color="#A79E96" />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={onOpenTimeSelector}
      className="flex-row items-center bg-white/5 px-3 py-1.5 rounded border border-white/10"
    >
      <Text className="text-[10px] text-[#F6F1EC] mr-1">{selectedTimeRange.name}</Text>
      <MaterialIcons name="keyboard-arrow-down" size={14} color="#A79E96" />
    </TouchableOpacity>
  </View>
);

// MAIN SCREEN
export default function AnalyticsScreen({ navigation }) {
  const { t } = useTranslation();
  const PLATFORMS = getPlatforms(t);
  const TIME_RANGES = getTimeRanges(t);
  
  const [activeTab, setActiveTab] = useState('posting'); // 'posting' or 'inbox'
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[1]); // Default 30 days
  const [isPlatformModalVisible, setPlatformModalVisible] = useState(false);
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState([]);

  // Supabase Internal Stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalReviews: 0,
    messagesReceived: 0,
    messagesSent: 0
  });

  // Zernio Analytics State
  const [zernioData, setZernioData] = useState({
    timelineData: [], // Line chart
    timelineDataLikes: [],
    demographics: [], // Pie chart
    followerStats: [], // Line chart
    platformInsights: null,
    totalFollowers: 0,
    totalPosts: 0,
    totalComments: 0,
    messagesReceived: 0,
    platformBreakdown: [],
    bestTimes: [],
    contentDecay: [],
    postingFrequency: [],
    postTimeline: null,
    postAnalytics: []
  });

  const fetchInternalStats = async () => {
    try {
      // Bu ekranda daha once organizasyon (tenant) cozumleme mantigi yoktu; asagidaki
      // sorgular hicbir filtre olmadan TUM organizasyonlarin verilerini donduruyordu
      // (cross-tenant veri sizintisi). SosyalMedyaScreen.js'deki ile ayni deseni
      // kullanarak organizationId cozumlemesi eklendi ve tum sorgular buna gore
      // filtrelendi.
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || session?.user?.id;
      if (!userId) return;

      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', userId).maybeSingle();
      const organizationId = orgMember?.organization_id || userId;

      if (!organizationId) return;

      const [{ count: postsCount }, { count: commentsCount }, { count: reviewsCount }, { count: msgsInCount }, { count: msgsOutCount }, { data: accountsData }] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('profile_id', organizationId),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('profile_id', organizationId),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('profile_id', organizationId),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'incoming').eq('profile_id', organizationId),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'outgoing').eq('profile_id', organizationId),
        supabase.schema('integration').from('social_accounts').select('zernio_account_id, platform').eq('organization_id', organizationId).eq('is_active', true)
      ]);

      setStats({
        totalPosts: postsCount || 0,
        totalComments: commentsCount || 0,
        totalReviews: reviewsCount || 0,
        messagesReceived: msgsInCount || 0,
        messagesSent: msgsOutCount || 0
      });

      if (accountsData) {
        setSocialAccounts(accountsData);
      }
    } catch (err) {
      console.log('Error fetching internal stats:', err);
    }
  };

  const fetchZernioAnalytics = async () => {
    setIsLoading(true);

    try {
      const invokeZernio = async (action, payload) => {
        const { data, error } = await supabase.functions.invoke('zernio-client', {
          body: { action, payload }
        });
        if (error) throw error;
        if (data?.success === false) {
          console.log(`[Zernio] "${action}" failed:`, data.error);
          return {};
        }
        return data?.data?.data || data?.data || {};
      };

      // Find relevant account IDs
      const targetAccounts = selectedPlatform.id === 'all' 
        ? socialAccounts 
        : socialAccounts.filter(a => a.platform.toLowerCase() === selectedPlatform.id);

      const _toDate = new Date().toISOString().split('T')[0];
      const _fromDate = new Date(Date.now() - (selectedTimeRange?.days || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let queryArgs = { fromDate: _fromDate, toDate: _toDate };
      if (selectedPlatform && selectedPlatform.id !== 'all') {
         queryArgs.platform = selectedPlatform.id;
      }
      
      const payloadBase = { query: queryArgs };
      const singleAccountId = targetAccounts && targetAccounts.length > 0 ? targetAccounts[0].zernio_account_id : undefined;
      const accountPayload = { query: { accountId: singleAccountId, fromDate: _fromDate, toDate: _toDate } };

      let newZernioData = {
        timelineData: [],
        timelineDataLikes: [],
        demographics: [],
        followerStats: [],
        platformInsights: null,
        totalFollowers: 0,
        totalPosts: 0,
        totalComments: 0,
        messagesReceived: 0,
        platformBreakdown: [],
        bestTimes: [],
        contentDecay: [],
        postingFrequency: [],
        postTimeline: null,
        postAnalytics: []
      };

      // Promise.all for independent actions
      const [
        actualData,
        actualBestTimes,
        actualDecay,
        actualFreq,
        actualPostAnalytics
      ] = await Promise.all([
        invokeZernio('get-daily-metrics', payloadBase).catch(() => ({})),
        invokeZernio('get-best-times', payloadBase).catch(() => ({})),
        invokeZernio('get-content-decay', payloadBase).catch(() => ({})),
        invokeZernio('get-posting-frequency', payloadBase).catch(() => ({})),
        invokeZernio('get-post-analytics', payloadBase).catch(() => ({}))
      ]);

      // Fetch recent post ID for get-post-timeline
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || session?.user?.id;
      if (userId) {
        const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', userId).maybeSingle();
        const organizationId = orgMember?.organization_id || userId;
        
        let postsQuery = supabase.from('posts').select('zernio_post_id').eq('profile_id', organizationId).not('zernio_post_id', 'is', null).order('created_at', { ascending: false }).limit(1);
        if (selectedPlatform.id !== 'all') {
           const pName = selectedPlatform.id === 'googlebusiness' ? 'google' : selectedPlatform.id;
           postsQuery = postsQuery.eq('platform', pName);
        }
        const { data: recentPosts } = await postsQuery;
        
        const recentPostId = recentPosts?.[0]?.zernio_post_id;
        const timelinePayload = recentPostId
          ? { query: { ...queryArgs, postId: recentPostId }, postId: recentPostId }
          : payloadBase;
          
        const actualTimeline = await invokeZernio('get-post-timeline', timelinePayload).catch(() => ({}));
        if (actualTimeline.timeline) {
           newZernioData.postTimeline = actualTimeline;
        }
      }
      
      if (actualData.dailyData) {
         let mappedTimeline = actualData.dailyData.map(d => ({
           value: d.metrics?.impressions || 0,
           label: d.date ? d.date.substring(5,10) : '',
           follows: d.metrics?.followers || d.metrics?.follows || d.metrics?.newFollowers || 0
         }));
         
         let mappedTimelineLikes = actualData.dailyData.map(d => ({
           value: d.metrics?.likes || 0,
           label: d.date ? d.date.substring(5,10) : ''
         }));

         if (mappedTimeline.length === 1) {
           mappedTimeline.unshift({ value: 0, label: '', follows: 0 });
           mappedTimelineLikes.unshift({ value: 0, label: '' });
         }
         
         newZernioData.timelineData = mappedTimeline;
         newZernioData.timelineDataLikes = mappedTimelineLikes;
      }

      if (actualData.platformBreakdown) {
         newZernioData.platformBreakdown = actualData.platformBreakdown;
         newZernioData.totalPosts = actualData.platformBreakdown.reduce((sum, p) => sum + (p.postCount || 0), 0);
         newZernioData.totalComments = actualData.platformBreakdown.reduce((sum, p) => sum + (p.comments || 0), 0);
      }

      if (actualBestTimes.slots) newZernioData.bestTimes = actualBestTimes.slots;
      if (actualDecay.buckets) newZernioData.contentDecay = actualDecay.buckets;
      if (actualFreq.frequency) newZernioData.postingFrequency = actualFreq.frequency;
      
      if (actualPostAnalytics.posts) {
         newZernioData.postAnalytics = actualPostAnalytics.posts;
      } else if (actualPostAnalytics.data) {
         newZernioData.postAnalytics = actualPostAnalytics.data;
      } else if (Array.isArray(actualPostAnalytics)) {
         newZernioData.postAnalytics = actualPostAnalytics;
      }

      // Fetch Messages for Gelen Mesaj Analizi
      const msgsRes = await invokeZernio('sync-messages', {}).catch(() => ({}));
      if (msgsRes.conversations) {
         newZernioData.messagesReceived = msgsRes.conversations.length;
      }

      if (selectedPlatform.id === 'all') {
        const actualFollow = await invokeZernio('get-follower-stats', payloadBase).catch(() => ({}));
        if (actualFollow.accounts) {
           newZernioData.totalFollowers = actualFollow.accounts.reduce((sum, a) => sum + (a.currentFollowers || 0), 0);
        }
      } else if (selectedPlatform.id === 'instagram') {
        if (singleAccountId) {
          const actualDemo = await invokeZernio('get-instagram-demographics', accountPayload).catch(() => ({}));
          if (actualDemo.data?.[0]?.values) {
            const genderAge = actualDemo.data[0].values[0].value;
            const mapped = Object.keys(genderAge).map((key, index) => ({
              value: genderAge[key],
              color: ['#22B573', '#C2478D', '#E8A8CD', '#0077b5'][index % 4],
              text: key
            }));
            newZernioData.demographics = mapped;
          }

          const actualFollow = await invokeZernio('get-instagram-follower-history', accountPayload).catch(() => ({}));
          if (actualFollow.data?.[0]?.values) {
            newZernioData.followerStats = actualFollow.data[0].values.map(v => ({
              value: v.value,
              label: v.end_time ? v.end_time.substring(5,10) : ''
            }));
            newZernioData.totalFollowers = newZernioData.followerStats[newZernioData.followerStats.length-1]?.value || 0;
          }
        }
      } else if (selectedPlatform.id === 'youtube') {
        if (singleAccountId) {
          const actualYt = await invokeZernio('get-youtube-daily-views', accountPayload).catch(() => ({}));
          if (actualYt.rows) {
             newZernioData.timelineData = actualYt.rows.map(r => ({
               value: parseInt(r[1]),
               label: r[0]
             }));
          }
        }
      } else if (selectedPlatform.id === 'tiktok') {
        if (singleAccountId) {
          const actualTk = await invokeZernio('get-tiktok-insights', accountPayload).catch(() => ({}));
          if (actualTk.data?.stats) {
             newZernioData.platformInsights = actualTk.data.stats;
             newZernioData.totalFollowers = actualTk.data.stats.follower_count;
          }
        }
      }
      
      setZernioData(newZernioData);
    } catch (error) {
      console.log('Error fetching Zernio analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchInternalStats();
    }, 0);
    
    // Subscribe to internal tables
    const channel1 = supabase.channel(`stats_posts_${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchInternalStats).subscribe();
    const channel2 = supabase.channel(`stats_messages_${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchInternalStats).subscribe();
    const channel3 = supabase.channel(`stats_comments_${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchInternalStats).subscribe();
    const channel4 = supabase.channel(`stats_reviews_${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchInternalStats).subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
      supabase.removeChannel(channel4);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchZernioAnalytics();
    }, 0);
  }, [selectedPlatform, selectedTimeRange, socialAccounts]);

  const handleSelectPlatform = (platform) => {
    setSelectedPlatform(platform);
    setPlatformModalVisible(false);
  };

  const handleSelectTimeRange = (range) => {
    setSelectedTimeRange(range);
    setTimeModalVisible(false);
  };

  // -------------------------
  // POSTING ANALYTICS VIEW
  // -------------------------
  const renderPostingAnalytics = () => (
    <View className="px-5 pb-32">
      {/* Key Metrics Grid */}
      <View className="flex-row justify-between mb-4">
        <AnimatedBorderCard style={{ flex: 1, marginRight: 6 }} colors={['#22B573', '#201D24']} padding={12}>
          <Text className="text-[#A79E96] text-[10px] mb-1">{t('sosyalMedya.analytics.totalPosts')}</Text>
          <Text className="text-[#22B573] text-[18px] font-bold">{zernioData.totalPosts || 0}</Text>
        </AnimatedBorderCard>
        
        <AnimatedBorderCard style={{ flex: 1, marginLeft: 6 }} colors={['#C2478D', '#201D24']} padding={12}>
          <Text className="text-[#A79E96] text-[10px] mb-1">{t('sosyalMedya.analytics.totalComments')}</Text>
          <Text className="text-[#E8A8CD] text-[18px] font-bold">{zernioData.totalComments || 0}</Text>
        </AnimatedBorderCard>
      </View>

      <View className="flex-row justify-between mb-4">
        <GlassCard style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <Ionicons name="people" size={12} color="#A79E96" style={{ marginRight: 4 }} />
            <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.totalFollowers')}</Text>
          </View>
          <Text className="text-[#F6F1EC] text-[16px] font-bold">
            {zernioData.totalFollowers > 0 ? zernioData.totalFollowers : '--'}
          </Text>
        </GlassCard>

        {(() => {
           let totalEng = 0;
           let totalImp = 0;
           if (zernioData.platformBreakdown) {
             zernioData.platformBreakdown.forEach(p => {
                totalEng += (p.likes || 0) + (p.comments || 0) + (p.shares || 0) + (p.saves || 0) + (p.clicks || 0);
                totalImp += (p.impressions || p.views || 0);
             });
           }
           const overallEr = totalImp > 0 ? ((totalEng / totalImp) * 100).toFixed(2) : '0.00';
           return (
             <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
               <View className="flex-row items-center mb-1">
                 <Ionicons name="analytics" size={12} color="#A79E96" style={{ marginRight: 4 }} />
                 <Text className="text-[#A79E96] text-[10px]">Avg. Eng. Rate</Text>
               </View>
               <Text className="text-[#22B573] text-[16px] font-bold">%{overallEr}</Text>
             </GlassCard>
           );
        })()}
      </View>

      <View className="flex-row justify-between mb-4">
        {(() => {
          let formatVideo = 0;
          let formatImage = 0;
          if (zernioData.postAnalytics && zernioData.postAnalytics.length > 0) {
             zernioData.postAnalytics.forEach(post => {
                const typeStr = (post.mediaType || post.mediaItems?.[0]?.type || post.media_type || post.type || '').toLowerCase();
                if (typeStr.includes('video') || typeStr.includes('reel') || typeStr.includes('tiktok')) formatVideo++;
                else formatImage++;
             });
          }
          return (
            <GlassCard style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 12 }}>
              <View className="flex-row items-center mb-1">
                <Ionicons name="pie-chart" size={12} color="#A79E96" style={{ marginRight: 4 }} />
                <Text className="text-[#A79E96] text-[10px]">Format (Video/Görsel)</Text>
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-[#E8A8CD] text-[16px] font-bold">{formatVideo}</Text>
                <Text className="text-[#A79E96] text-[12px] mx-1">/</Text>
                <Text className="text-[#22B573] text-[16px] font-bold">{formatImage}</Text>
              </View>
            </GlassCard>
          );
        })()}
        
        {(() => {
          const bestPost = zernioData.postAnalytics && zernioData.postAnalytics.length > 0 
            ? [...zernioData.postAnalytics].sort((a,b) => {
                const aM = a.analytics || a.metrics || a || {};
                const bM = b.analytics || b.metrics || b || {};
                return ((bM.likes||0)+(bM.comments||0)) - ((aM.likes||0)+(aM.comments||0));
            })[0] 
            : null;
          
          if (bestPost) {
            const bestM = bestPost.analytics || bestPost.metrics || bestPost || {};
            const totalE = (bestM.likes || 0) + (bestM.comments || 0);
            return (
              <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 4 }} />
                  <Text className="text-[#A79E96] text-[10px]">En İyi Gönderi</Text>
                </View>
                <Text className="text-[#F6F1EC] text-[11px] font-bold mb-1" numberOfLines={1}>
                  {bestPost.content || bestPost.title || 'Görsel Gönderi'}
                </Text>
                <Text className="text-[#FFD700] text-[9px] font-bold">
                  {totalE} Etkileşim
                </Text>
              </GlassCard>
            );
          }
          
          return (
            <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
              <View className="flex-row items-center mb-1">
                <Ionicons name="star" size={12} color="#A79E96" style={{ marginRight: 4 }} />
                <Text className="text-[#A79E96] text-[10px]">En İyi Gönderi</Text>
              </View>
              <Text className="text-[#F6F1EC] text-[16px] font-bold">--</Text>
            </GlassCard>
          );
        })()}
      </View>

      {/* Chart: Posts / Impressions over time */}
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-[#F6F1EC] text-[14px] font-bold">{t('sosyalMedya.analytics.engagementImpressions')}</Text>
          <View className="flex-row items-center">
             <View className="w-2 h-2 rounded-full bg-[#22B573] mr-1" />
             <Text className="text-[#A79E96] text-[8px] mr-3">Views</Text>
             <View className="w-2 h-2 rounded-full bg-[#C2478D] mr-1" />
             <Text className="text-[#A79E96] text-[8px]">Likes</Text>
          </View>
        </View>
        <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.changeOverTime')}</Text>
        
        {zernioData.timelineData.length > 0 ? (
          <View style={{marginLeft: -20}}>
            <LineChart
              data={zernioData.timelineData}
              data2={zernioData.timelineDataLikes && zernioData.timelineDataLikes.length > 0 ? zernioData.timelineDataLikes : undefined}
              color="#22B573"
              color2="#C2478D"
              thickness={3}
              dataPointsColor="#22B573"
              dataPointsColor2="#C2478D"
              hideRules
              yAxisTextStyle={{color: '#A79E96', fontSize: 10}}
              xAxisLabelTextStyle={{color: '#A79E96', fontSize: 8}}
              animationDuration={1500}
              isAnimated
              height={120}
              initialSpacing={20}
              spacing={width * 0.12}
            />
          </View>
        ) : (
           <View className="h-32 justify-center items-center">
             <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.noChartData')}</Text>
           </View>
        )}
      </AnimatedBorderCard>

      {/* Chart: Follower Growth History */}
      {(() => {
        let chartData = [];
        let chartColor = "#22B573";
        if (selectedPlatform.id === 'instagram' && zernioData.followerStats && zernioData.followerStats.length > 0) {
           chartData = zernioData.followerStats;
           chartColor = "#E8A8CD";
        } else if (zernioData.totalFollowers > 0 && zernioData.timelineData && zernioData.timelineData.length > 0) {
           let currentFollowers = zernioData.totalFollowers;
           let reverseData = [];
           for (let i = zernioData.timelineData.length - 1; i >= 0; i--) {
              reverseData.unshift({
                 value: currentFollowers,
                 label: zernioData.timelineData[i].label
              });
              currentFollowers = Math.max(0, currentFollowers - (zernioData.timelineData[i].follows || 0));
           }
           chartData = reverseData;
        }

        if (chartData.length === 0) return null;

        return (
          <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
            <View className="flex-row items-center mb-1">
              <Ionicons name="trending-up" size={14} color={chartColor} style={{ marginRight: 4 }} />
              <Text className="text-[#F6F1EC] text-[14px] font-bold">Takipçi Büyümesi (Follower History)</Text>
            </View>
            <Text className="text-[#A79E96] text-[10px] mb-4">Kümülatif takipçi gelişimi</Text>
            
            <View style={{marginLeft: -20}}>
              <LineChart
                data={chartData}
                color={chartColor}
                thickness={3}
                dataPointsColor={chartColor}
                hideRules
                yAxisTextStyle={{color: '#A79E96', fontSize: 10}}
                xAxisLabelTextStyle={{color: '#A79E96', fontSize: 8}}
                animationDuration={1500}
                isAnimated
                height={120}
                initialSpacing={20}
                spacing={width * 0.12}
                areaChart
                startFillColor={chartColor}
                endFillColor="rgba(255,255,255,0.01)"
                startOpacity={0.3}
                endOpacity={0.0}
              />
            </View>
          </AnimatedBorderCard>
        );
      })()}

      {/* Demographics / Follower History for specific platforms */}
      {selectedPlatform.id === 'instagram' && zernioData.demographics.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.demographics')}</Text>
          <View className="items-center py-4">
            <PieChart
              data={zernioData.demographics}
              donut
              showText
              textColor="black"
              radius={80}
              innerRadius={50}
              animationDuration={1500}
              isAnimated
            />
          </View>
        </AnimatedBorderCard>
      )}
      
      {/* 17.09.2026: Top Performing Posts — web'deki (analiz/page.tsx) detaylı
          11 sütunlu tabloyla birebir eşleşecek şekilde genişletildi (eskiden
          sadece 2 metrik gösteren küçük kartlardı). React Native'de <table>
          elemanı olmadığından web'in "overflowX: auto" davranışı, sabit
          genişlikli bir iç View'ı saran yatay ScrollView ile taklit ediliyor —
          bu tam olarak flowweb-repo'daki PostsScreen.js "Tüm Gönderiler"
          tablosunda (bkz. width: 1090 deseni) zaten kullanılan yöntem. */}
      {zernioData.postAnalytics && zernioData.postAnalytics.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">Top Performing Posts</Text>
          <Text className="text-[#A79E96] text-[10px] mb-3">En çok etkileşim alan gönderileriniz</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ width: 898 }}>
              {/* Header */}
              <View className="flex-row items-center pb-2 mb-2 border-b border-white/10">
                <Text className="text-[#A79E96] text-[10px] font-bold" style={{ width: 190 }}>Gönderi</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Beğeni</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>Yorum</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>Paylaşım</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>Kaydetme</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>Tıklama</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 96 }}>Görüntülenme</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Takipçi</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Impr.</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Erişim</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 56 }}>ER%</Text>
              </View>
              {/* Rows */}
              {[...zernioData.postAnalytics]
                .sort((a, b) => {
                  const aM = a.analytics || a.metrics || a || {};
                  const bM = b.analytics || b.metrics || b || {};
                  const aEng = (aM.likes || 0) + (aM.comments || 0) + (aM.shares || 0) + (aM.impressions || aM.views || 0);
                  const bEng = (bM.likes || 0) + (bM.comments || 0) + (bM.shares || 0) + (bM.impressions || bM.views || 0);
                  return bEng - aEng;
                })
                .slice(0, 10)
                .map((post, idx) => {
                  const metrics = post.analytics || post.metrics || post || {};
                  const likes = metrics.likes || 0;
                  const comments = metrics.comments || 0;
                  const shares = metrics.shares || 0;
                  const saves = metrics.saves || 0;
                  const clicks = metrics.clicks || 0;
                  const views = metrics.views || 0;
                  const follows = metrics.follows || 0;
                  const impressions = metrics.impressions || 0;
                  const reach = metrics.reach || 0;
                  const totalEng = likes + comments + shares + saves + clicks;
                  const divBy = impressions > 0 ? impressions : views;
                  const er = metrics.engagementRate || metrics.er || (divBy > 0 ? ((totalEng / divBy) * 100).toFixed(2) : '0.00');
                  const postName = post.content
                    ? (post.content.substring(0, 40) + (post.content.length > 40 ? '...' : ''))
                    : (post.title || `Gönderi #${idx + 1}`);
                  const dateStr = post.publishedAt || post.date || post.created_at;
                  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                  const platId = post.platform ? (post.platform.toLowerCase() === 'google' ? 'googlebusiness' : post.platform.toLowerCase()) : '';
                  const platDef = PLATFORMS.find(pl => pl.id === platId);

                  return (
                    <View key={post.id || idx} className="flex-row items-start py-2.5 border-b border-white/5">
                      <View style={{ width: 190, paddingRight: 8 }}>
                        <Text className="text-[#F6F1EC] text-[11px]" numberOfLines={2}>{postName}</Text>
                        {(platDef || formattedDate) && (
                          <View className="flex-row items-center mt-1">
                            {platDef && <Ionicons name={platDef.icon} size={10} color={platDef.color} style={{ marginRight: 4 }} />}
                            {formattedDate ? <Text className="text-[#A79E96] text-[9px]">{formattedDate}</Text> : null}
                          </View>
                        )}
                      </View>
                      <Text className="text-[#FF7A59] text-[11px] text-right" style={{ width: 70 }}>{likes.toLocaleString()}</Text>
                      <Text className="text-[#E8A8CD] text-[11px] text-right" style={{ width: 64 }}>{comments.toLocaleString()}</Text>
                      <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 74 }}>{shares.toLocaleString()}</Text>
                      <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 74 }}>{saves.toLocaleString()}</Text>
                      <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 64 }}>{clicks.toLocaleString()}</Text>
                      <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 96 }}>{views.toLocaleString()}</Text>
                      <Text className="text-[#E8A8CD] text-[11px] text-right" style={{ width: 70 }}>{follows.toLocaleString()}</Text>
                      <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 70 }}>{impressions.toLocaleString()}</Text>
                      <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 70 }}>{reach.toLocaleString()}</Text>
                      <View style={{ width: 56, alignItems: 'flex-end' }}>
                        <View className="bg-[#22B573]/20 px-1.5 py-0.5 rounded-full border border-[#22B573]/30">
                          <Text className="text-[#22B573] text-[9px] font-bold">{er}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
            </View>
          </ScrollView>
        </AnimatedBorderCard>
      )}

      {/* 17.09.2026: Platform Kırılımı — web'deki (analiz/page.tsx) 11 sütunlu
          detaylı tabloyla birebir eşleşecek şekilde genişletildi (eskiden
          sadece Platform/Gönderi/Erişim/ER% olan 4 sütunluk sade bir listeydi).
          Aynı yatay-kaydırılabilir-tablo deseni burada da kullanılıyor. */}
      {zernioData.platformBreakdown && zernioData.platformBreakdown.length > 0 && selectedPlatform.id === 'all' && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-3">Platform Kırılımı</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ width: 832 }}>
              {/* Header */}
              <View className="flex-row items-center pb-2 mb-2 border-b border-white/10">
                <Text className="text-[#A79E96] text-[10px] font-bold" style={{ width: 130 }}>Platform</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>Gönderi</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Beğeni</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>Yorum</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>Paylaşım</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>Kaydetme</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>Tıklama</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 96 }}>Görüntülenme</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Impr.</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>Erişim</Text>
                <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 56 }}>ER%</Text>
              </View>
              {/* Rows */}
              {zernioData.platformBreakdown.map((p, idx) => {
                const platId = p.platform ? (p.platform.toLowerCase() === 'google' ? 'googlebusiness' : p.platform.toLowerCase()) : '';
                const platDef = PLATFORMS.find(pl => pl.id === platId);
                const platformIcon = platDef?.icon || 'apps-outline';
                const platformColor = platDef?.color || '#A79E96';
                const platformName = platDef?.name || p.platform;

                const posts = p.postCount || p.posts || 0;
                const likes = p.likes || 0;
                const comments = p.comments || 0;
                const shares = p.shares || 0;
                const saves = p.saves || 0;
                const clicks = p.clicks || 0;
                const views = p.views || 0;
                const impressions = p.impressions || 0;
                const reach = p.reach || 0;
                const totalEng = likes + comments + shares + saves + clicks;
                const divBy = impressions > 0 ? impressions : views;
                const er = p.engagementRate || p.er || (divBy > 0 ? ((totalEng / divBy) * 100).toFixed(2) : '0.00');

                return (
                  <View key={idx} className="flex-row items-center py-2.5 border-b border-white/5">
                    <View className="flex-row items-center" style={{ width: 130 }}>
                      <Ionicons name={platformIcon} size={14} color={platformColor} style={{ marginRight: 6 }} />
                      <Text className="text-[#F6F1EC] text-[11px] capitalize" numberOfLines={1}>{platformName}</Text>
                    </View>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 64 }}>{posts.toLocaleString()}</Text>
                    <Text className="text-[#FF7A59] text-[11px] text-right" style={{ width: 70 }}>{likes.toLocaleString()}</Text>
                    <Text className="text-[#E8A8CD] text-[11px] text-right" style={{ width: 64 }}>{comments.toLocaleString()}</Text>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 74 }}>{shares.toLocaleString()}</Text>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 74 }}>{saves.toLocaleString()}</Text>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 64 }}>{clicks.toLocaleString()}</Text>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 96 }}>{views.toLocaleString()}</Text>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 70 }}>{impressions.toLocaleString()}</Text>
                    <Text className="text-[#F6F1EC] text-[11px] text-right" style={{ width: 70 }}>{reach.toLocaleString()}</Text>
                    <View style={{ width: 56, alignItems: 'flex-end' }}>
                      <View className="bg-[#22B573]/20 px-1.5 py-0.5 rounded-full border border-[#22B573]/30">
                        <Text className="text-[#22B573] text-[9px] font-bold">{er}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </AnimatedBorderCard>
      )}

      {/* 17.09.2026: Best Times Heatmap — web'deki (analiz/page.tsx) tam 7x24
          (gün x saat) yoğunluk haritasıyla birebir eşleşecek şekilde
          genişletildi (eskiden sadece en iyi 6 slotu gösteren sade bir
          gridti). Web'de bu bileşen bir chart kütüphanesi değil, elle
          (hand-built) bir CSS grid'dir — bu yüzden mobilde de
          react-native-gifted-charts yerine, tablo bölümlerinde (Top
          Performing Posts / Platform Kırılımı) kullanılan aynı "ScrollView
          horizontal + sabit genişlikli View" deseniyle elle inşa edildi.
          Renk yoğunluğu formülü (rgba(255,122,89,intensity), intensity =
          avg_engagement/maxEngagement, taban 0.1) web ile birebir aynıdır. */}
      {zernioData.bestTimes && zernioData.bestTimes.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">Paylaşım İçin En İyi Zamanlar</Text>
          <Text className="text-[#A79E96] text-[10px] mb-4">Haftanın günleri ve saatlere göre ortalama etkileşim yoğunluğu</Text>
          {(() => {
            const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
            const cellSize = 22;
            const cellGap = 2;
            const maxEngagement = Math.max(...zernioData.bestTimes.map(s => s.avg_engagement || 0), 1);
            return (
              <View className="flex-row">
                {/* Sol sütun: gün etiketleri (web'deki dikey gün sütununun karşılığı) */}
                <View style={{ paddingTop: 20, marginRight: 4 }}>
                  {dayNames.map((day) => (
                    <View key={day} style={{ height: cellSize + cellGap, justifyContent: 'center' }}>
                      <Text className="text-[#A79E96] text-[10px]">{day}</Text>
                    </View>
                  ))}
                </View>
                {/* Sağ taraf: yatay kaydırılabilir 24 saatlik grid (web'in overflowX:auto'suna karşılık gelir) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ width: 24 * (cellSize + cellGap) }}>
                    {/* Saat başlıkları (0-23) */}
                    <View className="flex-row" style={{ marginBottom: 4 }}>
                      {Array.from({ length: 24 }).map((_, hourIdx) => (
                        <View key={hourIdx} style={{ width: cellSize, marginRight: cellGap, alignItems: 'center' }}>
                          <Text className="text-[#A79E96] text-[9px]">{hourIdx}</Text>
                        </View>
                      ))}
                    </View>
                    {/* 7 (gün) x 24 (saat) yoğunluk grid'i */}
                    {Array.from({ length: 7 }).map((_, dayIdx) => (
                      <View key={dayIdx} className="flex-row" style={{ marginBottom: cellGap }}>
                        {Array.from({ length: 24 }).map((_, hourIdx) => {
                          const slot = zernioData.bestTimes.find(s => s.day_of_week === dayIdx && s.hour === hourIdx);
                          const intensity = slot ? Math.max(0.1, (slot.avg_engagement || 0) / maxEngagement) : 0;
                          return (
                            <View
                              key={hourIdx}
                              style={{
                                width: cellSize,
                                height: cellSize,
                                marginRight: cellGap,
                                borderRadius: 4,
                                backgroundColor: slot ? `rgba(255, 122, 89, ${intensity})` : 'rgba(255,255,255,0.02)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.02)',
                              }}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          })()}
          <Text className="text-[#A79E96] text-[11px] font-bold mt-3">
            {(() => {
              // 17.09.2026: Alt özet satırındaki gün kısaltmaları, üstteki
              // grid'le tutarlı olması için Türkçeye çevrildi (bkz. README —
              // eskiden İngilizce Mon/Tue/... kullanılıyordu, web tarafında da
              // aynı düzeltme eşzamanlı olarak yapıldı).
              const sorted = [...zernioData.bestTimes].sort((a, b) => (b.avg_engagement || 0) - (a.avg_engagement || 0)).slice(0, 2);
              const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
              const texts = sorted.map(s => `${days[s.day_of_week]} ${s.hour}${s.hour < 12 ? 'am' : 'pm'} · ${s.avg_engagement}`);
              return texts.length > 0 ? `Best times: ${texts.join(' · ')}` : '';
            })()}
          </Text>
        </AnimatedBorderCard>
      )}

      {/* Phase 5: Content Decay */}
      {zernioData.contentDecay && zernioData.contentDecay.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">İçerik Ömrü (Content Decay)</Text>
          <Text className="text-[#A79E96] text-[10px] mb-4">Gönderi sonrası etkileşimlerin dağılımı</Text>
          <View style={{marginLeft: -10}}>
            <BarChart
              data={[...zernioData.contentDecay].sort((a,b) => a.bucket_order - b.bucket_order).map(b => ({
                value: b.avg_pct_of_final || 0,
                label: b.bucket_label || '',
                frontColor: '#22B573'
              }))}
              barWidth={26}
              spacing={width * 0.08}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{color: '#A79E96', fontSize: 10}}
              xAxisLabelTextStyle={{color: '#A79E96', fontSize: 8}}
              noOfSections={4}
              height={120}
              isAnimated
            />
          </View>
        </AnimatedBorderCard>
      )}

      {/* 17.09.2026: Posting Frequency — web'deki (analiz/page.tsx) recharts
          ScatterChart'ıyla (X: Haftalık Gönderi, Y: Etkileşim Oranı, kabarcık
          büyüklüğü: Hafta Sayısı, renk: platform) birebir eşleşecek şekilde
          eski liste/tablo görünümünün yerine geçti. react-native-gifted-charts
          kütüphanesinde bir BubbleChart bileşeni bulunsa da (bu oturumda npm
          paketi indirilip incelendi), gerçek RN render motoru bu sandbox'ta
          çalıştırılıp doğrulanamadığından — Top Performing Posts / Platform
          Kırılımı / Best Times bölümlerinde zaten kurulu ve kanıtlanmış olan
          "elle (custom View tabanlı) inşa" desenine sadık kalınarak, web'in
          X/Y/boyut/renk mantığı birebir View'lerle (mutlak konumlandırma)
          yeniden üretildi. */}
      {zernioData.postingFrequency && zernioData.postingFrequency.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">Paylaşım Sıklığı vs Etkileşim Oranı</Text>
          <Text className="text-[#A79E96] text-[10px] mb-4">Haftalık gönderi sayısının ortalama etkileşim oranına etkisi</Text>
          {(() => {
            const chartHeight = 220;
            const chartWidth = Math.max(width - 40 - 32 - 36, 160); // ekran px-5 (40) + kart padding (32) + Y ekseni etiket alanı (36)
            const xs = zernioData.postingFrequency.map(f => f.posts_per_week || 0);
            const ys = zernioData.postingFrequency.map(f => f.avg_engagement_rate || 0);
            const weeks = zernioData.postingFrequency.map(f => f.weeks_count || 0);
            const xMin = Math.min(...xs, 0);
            const xMax = Math.max(...xs, 1);
            const yMin = Math.min(...ys, 0);
            const yMax = Math.max(...ys, 1);
            const wMin = Math.min(...weeks, 0);
            const wMax = Math.max(...weeks, 1);
            const xSpan = (xMax - xMin) || 1;
            const ySpan = (yMax - yMin) || 1;
            const wSpan = (wMax - wMin) || 1;
            const rMin = 8, rMax = 26;
            const yTicks = [yMax, yMin + ySpan * 0.5, yMin];
            const xTicks = [xMin, xMin + xSpan * 0.5, xMax];

            return (
              <View>
                <View className="flex-row">
                  {/* Y ekseni etiketleri (Etkileşim Oranı %) */}
                  <View style={{ width: 36, height: chartHeight, justifyContent: 'space-between', paddingRight: 4, paddingBottom: 14 }}>
                    {yTicks.map((v, i) => (
                      <Text key={i} className="text-[#A79E96] text-[9px] text-right">{v.toFixed(1)}</Text>
                    ))}
                  </View>
                  {/* Çizim alanı */}
                  <View style={{ width: chartWidth, height: chartHeight }}>
                    {/* Izgara (CartesianGrid karşılığı) */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: chartHeight - 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }} />
                    {[0.25, 0.5, 0.75].map((p) => (
                      <View key={p} style={{ position: 'absolute', top: (chartHeight - 14) * p, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                    ))}
                    {/* Kabarcıklar (her nokta = bir platformun bir zaman dilimindeki paylaşım sıklığı/etkileşim oranı) */}
                    {zernioData.postingFrequency.map((f, idx) => {
                      const platId = f.platform ? (f.platform.toLowerCase() === 'google' ? 'googlebusiness' : f.platform.toLowerCase()) : '';
                      const platDef = PLATFORMS.find(pl => pl.id === platId);
                      const color = platDef ? platDef.color : '#FF7A59';
                      const r = rMin + (((f.weeks_count || 0) - wMin) / wSpan) * (rMax - rMin);
                      const cx = ((f.posts_per_week - xMin) / xSpan) * chartWidth;
                      const cy = (chartHeight - 14) - (((f.avg_engagement_rate || 0) - yMin) / ySpan) * (chartHeight - 14);
                      return (
                        <View
                          key={idx}
                          style={{
                            position: 'absolute',
                            left: Math.min(Math.max(cx - r, 0), chartWidth - r * 2),
                            top: Math.min(Math.max(cy - r, 0), chartHeight - 14 - r * 2),
                            width: r * 2,
                            height: r * 2,
                            borderRadius: r,
                            backgroundColor: color,
                            opacity: 0.65,
                            borderWidth: 1.5,
                            borderColor: color,
                          }}
                        />
                      );
                    })}
                    {/* X ekseni etiketleri (Haftalık Gönderi) */}
                    <View className="flex-row justify-between" style={{ position: 'absolute', bottom: -14, left: 0, right: 0 }}>
                      {xTicks.map((v, i) => (
                        <Text key={i} className="text-[#A79E96] text-[9px]">{Number(v).toFixed(1)}</Text>
                      ))}
                    </View>
                  </View>
                </View>
                {/* Legend (web'deki <Legend iconType="circle" />'ın karşılığı) */}
                <View className="flex-row flex-wrap mt-4" style={{ marginLeft: 36 }}>
                  {Array.from(new Set(zernioData.postingFrequency.map(f => f.platform))).map((platform, idx) => {
                    const platId = platform ? (platform.toLowerCase() === 'google' ? 'googlebusiness' : platform.toLowerCase()) : '';
                    const platDef = PLATFORMS.find(pl => pl.id === platId);
                    const color = platDef ? platDef.color : '#FF7A59';
                    return (
                      <View key={idx} className="flex-row items-center mr-3 mb-1">
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} />
                        <Text className="text-[#A79E96] text-[10px]">{platDef ? platDef.name : platform}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}
        </AnimatedBorderCard>
      )}
    </View>
  );

  // -------------------------
  // INBOX ANALYTICS VIEW
  // -------------------------
  const renderInboxAnalytics = () => (
    <View className="px-5 pb-32">
      {/* Key Metrics Grid */}
      <View className="flex-row justify-between mb-4">
        <AnimatedBorderCard style={{ flex: 1, marginRight: 6 }} colors={['#C2478D', '#201D24']} padding={12}>
          <View className="flex-row items-center mb-1">
            <Feather name="inbox" size={12} color="#A79E96" style={{ marginRight: 4 }} />
            <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.received')}</Text>
          </View>
          <Text className="text-[#E8A8CD] text-[18px] font-bold">{zernioData.messagesReceived || 0}</Text>
        </AnimatedBorderCard>
        
        <AnimatedBorderCard style={{ flex: 1, marginLeft: 6 }} colors={['#22B573', '#201D24']} padding={12}>
          <View className="flex-row items-center mb-1">
            <Feather name="send" size={12} color="#A79E96" style={{ marginRight: 4 }} />
            <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.sent')}</Text>
          </View>
          <Text className="text-[#22B573] text-[18px] font-bold">0</Text>
        </AnimatedBorderCard>
      </View>

      <View className="flex-row justify-between mb-4">
        <GlassCard style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <Feather name="eye" size={12} color="#A79E96" style={{ marginRight: 4 }} />
            <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.read')}</Text>
          </View>
          <Text className="text-[#F6F1EC] text-[16px] font-bold">--</Text>
        </GlassCard>
        
        <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <Feather name="clock" size={12} color="#A79E96" style={{ marginRight: 4 }} />
            <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.avgResponse')}</Text>
          </View>
          <Text className="text-[#F6F1EC] text-[16px] font-bold">{t('sosyalMedya.analytics.responseTimeMin')}</Text>
        </GlassCard>
      </View>

      {/* Response Time Info */}
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.responseTimeAnalysis')}</Text>
        <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.firstResponseText')}</Text>
        <View className="items-center py-6">
          <MaterialIcons name="speed" size={32} color="#22B573" style={{ opacity: 0.5, marginBottom: 8 }} />
          <Text className="text-[#F6F1EC] text-[12px]">{t('sosyalMedya.analytics.greatSpeed')}</Text>
        </View>
      </AnimatedBorderCard>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right']}>
      {/* Cybernetic Background */}
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.85)' }]} />
      </ImageBackground>

      {/* App Bar */}
      <GlobalAppBar level={2} module="sosyal" title={t('sosyalMedya.analytics.title')} showProfile={false} />

      <TopToggle activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
      <FilterRow 
        selectedPlatform={selectedPlatform} 
        onOpenPlatformSelector={() => setPlatformModalVisible(true)} 
        selectedTimeRange={selectedTimeRange}
        onOpenTimeSelector={() => setTimeModalVisible(true)}
      />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#22B573" />
          <Text className="text-[#A79E96] text-[12px] mt-4">{t('sosyalMedya.analytics.loading')}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {activeTab === 'posting' ? renderPostingAnalytics() : renderInboxAnalytics()}
        </ScrollView>
      )}

      {/* Platform Selector Modal */}
      <Modal
        visible={isPlatformModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPlatformModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPlatformModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                  <Text className="text-[#F6F1EC] font-bold text-[14px]">{t('sosyalMedya.analytics.selectPlatform')}</Text>
                  <TouchableOpacity onPress={() => setPlatformModalVisible(false)}>
                    <MaterialIcons name="close" size={20} color="#A79E96" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {PLATFORMS.map((platform) => (
                    <TouchableOpacity
                      key={platform.id}
                      onPress={() => handleSelectPlatform(platform)}
                      className={`flex-row items-center py-3 px-2 rounded-lg mb-1 ${selectedPlatform.id === platform.id ? 'bg-[#22B573]/10' : ''}`}
                    >
                      <Ionicons name={platform.icon} size={18} color={platform.color} style={{ marginRight: 12, width: 24, textAlign: 'center' }} />
                      <Text className={`text-[12px] ${selectedPlatform.id === platform.id ? 'text-[#22B573] font-bold' : 'text-[#F6F1EC]'}`}>
                        {platform.name}
                      </Text>
                      {selectedPlatform.id === platform.id && (
                        <MaterialIcons name="check" size={16} color="#22B573" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Time Range Selector Modal */}
      <Modal
        visible={isTimeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                  <Text className="text-[#F6F1EC] font-bold text-[14px]">{t('sosyalMedya.analytics.selectTimeRange')}</Text>
                  <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                    <MaterialIcons name="close" size={20} color="#A79E96" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {TIME_RANGES.map((range) => (
                    <TouchableOpacity
                      key={range.id}
                      onPress={() => handleSelectTimeRange(range)}
                      className={`flex-row items-center py-3 px-2 rounded-lg mb-1 ${selectedTimeRange.id === range.id ? 'bg-[#22B573]/10' : ''}`}
                    >
                      <MaterialIcons name="access-time" size={18} color="#A79E96" style={{ marginRight: 12, width: 24, textAlign: 'center' }} />
                      <Text className={`text-[12px] ${selectedTimeRange.id === range.id ? 'text-[#22B573] font-bold' : 'text-[#F6F1EC]'}`}>
                        {range.name}
                      </Text>
                      {selectedTimeRange.id === range.id && (
                        <MaterialIcons name="check" size={16} color="#22B573" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 11, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#201D24',
    borderRadius: 16,
    padding: 20,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.3)',
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  }
});
