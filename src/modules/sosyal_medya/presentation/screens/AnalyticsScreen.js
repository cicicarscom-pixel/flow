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
           label: d.date ? d.date.substring(5,10) : ''
         }));
         
         let mappedTimelineLikes = actualData.dailyData.map(d => ({
           value: d.metrics?.likes || 0,
           label: d.date ? d.date.substring(5,10) : ''
         }));

         if (mappedTimeline.length === 1) {
           mappedTimeline.unshift({ value: 0, label: '' });
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
             <AnimatedBorderCard style={{ flex: 1, marginLeft: 6 }} colors={['#22B573', '#201D24']} padding={12}>
               <Text className="text-[#A79E96] text-[10px] mb-1">Avg. Eng. Rate</Text>
               <Text className="text-[#22B573] text-[18px] font-bold">%{overallEr}</Text>
             </AnimatedBorderCard>
           );
        })()}
      </View>

      <View className="flex-row justify-between mb-4">
        {(() => {
          let formatVideo = 0;
          let formatImage = 0;
          if (zernioData.postAnalytics && zernioData.postAnalytics.length > 0) {
             zernioData.postAnalytics.forEach(post => {
                const type = (post.media_type || post.type || '').toLowerCase();
                if (type.includes('video') || type.includes('reel') || type.includes('tiktok')) formatVideo++;
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
      {zernioData.followerStats && zernioData.followerStats.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <View className="flex-row items-center mb-1">
            <Ionicons name="trending-up" size={14} color="#22B573" style={{ marginRight: 4 }} />
            <Text className="text-[#F6F1EC] text-[14px] font-bold">Takipçi Büyümesi (Follower History)</Text>
          </View>
          <Text className="text-[#A79E96] text-[10px] mb-4">Seçili dönemdeki net takipçi değişimi</Text>
          
          <View style={{marginLeft: -20}}>
            <LineChart
              data={zernioData.followerStats}
              color="#22B573"
              thickness={3}
              dataPointsColor="#22B573"
              hideRules
              yAxisTextStyle={{color: '#A79E96', fontSize: 10}}
              xAxisLabelTextStyle={{color: '#A79E96', fontSize: 8}}
              animationDuration={1500}
              isAnimated
              height={120}
              initialSpacing={20}
              spacing={width * 0.12}
              areaChart
              startFillColor="#22B573"
              endFillColor="rgba(34, 181, 115,0.01)"
              startOpacity={0.3}
              endOpacity={0.0}
            />
          </View>
        </AnimatedBorderCard>
      )}

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
      
      {/* Top Performing Posts */}
      {zernioData.postAnalytics && zernioData.postAnalytics.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">Top Performing Posts</Text>
          <Text className="text-[#A79E96] text-[10px] mb-2">En çok etkileşim alan gönderileriniz</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1 pb-2">
            {[...zernioData.postAnalytics]
              .sort((a, b) => {
                const aM = a.analytics || a.metrics || a || {};
                const bM = b.analytics || b.metrics || b || {};
                const aEng = (aM.likes || 0) + (aM.comments || 0);
                const bEng = (bM.likes || 0) + (bM.comments || 0);
                return bEng - aEng;
              })
              .slice(0, 5)
              .map((post, idx) => {
                const metrics = post.analytics || post.metrics || post || {};
                return (
                <View key={idx} className="bg-[#201D24] rounded-lg p-3 mr-3 w-40 border border-white/10 shadow-sm shadow-black">
                  <Text className="text-[#F6F1EC] text-[11px] font-bold mb-3" numberOfLines={2}>
                    {post.content || post.title || 'Görsel Gönderi'}
                  </Text>
                  <View className="flex-row items-center mb-1.5">
                    <Ionicons name="heart" size={12} color="#C2478D" style={{ marginRight: 6 }} />
                    <Text className="text-[#A79E96] text-[10px]">{metrics.likes || 0}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="chatbubble" size={12} color="#22B573" style={{ marginRight: 6 }} />
                    <Text className="text-[#A79E96] text-[10px]">{metrics.comments || 0}</Text>
                  </View>
                </View>
              )})}
          </ScrollView>
        </AnimatedBorderCard>
      )}

      {/* Platform Breakdown */}
      {zernioData.platformBreakdown && zernioData.platformBreakdown.length > 0 && selectedPlatform.id === 'all' && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
          <Text className="text-[#F6F1EC] text-[14px] font-bold mb-4">Platform Kırılımı</Text>
          
          <View className="flex-row mb-3 pb-2 border-b border-white/10">
            <Text className="text-[#A79E96] text-[10px] flex-1">Platform</Text>
            <Text className="text-[#A79E96] text-[10px] w-12 text-center">Gönderi</Text>
            <Text className="text-[#A79E96] text-[10px] w-12 text-center">Erişim</Text>
            <Text className="text-[#A79E96] text-[10px] w-[50px] text-center">ER %</Text>
          </View>
          
          {zernioData.platformBreakdown.map((p, idx) => {
            const platformIcon = PLATFORMS.find(pl => pl.id === p.platform?.toLowerCase())?.icon || 'apps-outline';
            const platformColor = PLATFORMS.find(pl => pl.id === p.platform?.toLowerCase())?.color || '#A79E96';
            const imp = p.impressions || p.views || 0;
            const er = imp > 0 ? (((p.likes || 0) + (p.comments || 0) + (p.shares || 0) + (p.saves || 0) + (p.clicks || 0)) / imp * 100).toFixed(2) : '0.00';
            
            return (
              <View key={idx} className="flex-row items-center mb-3">
                <View className="flex-1 flex-row items-center">
                  <Ionicons name={platformIcon} size={16} color={platformColor} style={{ marginRight: 8 }} />
                  <Text className="text-[#F6F1EC] text-[12px] capitalize">{p.platform}</Text>
                </View>
                <Text className="text-[#F6F1EC] text-[12px] w-12 text-center">{p.postCount || 0}</Text>
                <Text className="text-[#F6F1EC] text-[12px] w-12 text-center">{imp}</Text>
                <View className="w-[50px] items-center">
                  <View className="bg-[#22B573]/20 px-1.5 py-0.5 rounded-full border border-[#22B573]/30">
                    <Text className="text-[#22B573] text-[9px] font-bold">{er}%</Text>
                  </View>
                </View>
              </View>
            );
          })}
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
