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
  { id: 'all', name: t('sosyalMedya.analytics.platforms.all'), icon: 'apps-outline', color: '#849495' },
  { id: 'tiktok', name: t('sosyalMedya.analytics.platforms.tiktok'), icon: 'musical-notes', color: '#ff0050' },
  { id: 'instagram', name: t('sosyalMedya.analytics.platforms.instagram'), icon: 'logo-instagram', color: '#ebb2ff' },
  { id: 'facebook', name: t('sosyalMedya.analytics.platforms.facebook'), icon: 'logo-facebook', color: '#00f0ff' },
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
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#bc13fe', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={{ flex: 1, backgroundColor: '#0A0A0B', borderRadius: borderRadius - 2, padding }}>
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
        className={`flex-1 py-2.5 px-0 rounded-lg ${activeTab === 'posting' ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50' : 'bg-transparent'}`}
        textClassName={`text-[12px] font-bold ${activeTab === 'posting' ? 'text-[#00f0ff]' : 'text-[#849495]'}`}
        title={t('sosyalMedya.analytics.tabs.posting')}
        onPress={() => setActiveTab('posting')}
      />
      <CustomButton 
        className={`flex-1 py-2.5 px-0 rounded-lg ${activeTab === 'inbox' ? 'bg-[#bc13fe]/20 border border-[#bc13fe]/50' : 'bg-transparent'}`}
        textClassName={`text-[12px] font-bold ${activeTab === 'inbox' ? 'text-[#ebb2ff]' : 'text-[#849495]'}`}
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
      <Text className="text-[10px] text-[#e5e2e3] mr-1">{selectedPlatform.name}</Text>
      <MaterialIcons name="keyboard-arrow-down" size={14} color="#849495" />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={onOpenTimeSelector}
      className="flex-row items-center bg-white/5 px-3 py-1.5 rounded border border-white/10"
    >
      <Text className="text-[10px] text-[#e5e2e3] mr-1">{selectedTimeRange.name}</Text>
      <MaterialIcons name="keyboard-arrow-down" size={14} color="#849495" />
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
    demographics: [], // Pie chart
    followerStats: [], // Line chart
    platformInsights: null,
    totalFollowers: 0
  });

  const fetchInternalStats = async () => {
    try {
      const [{ count: postsCount }, { count: commentsCount }, { count: reviewsCount }, { count: msgsInCount }, { count: msgsOutCount }, { data: accountsData }] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'incoming'),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'outgoing'),
        supabase.from('social_accounts').select('zernio_account_id, platform')
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
        demographics: [],
        followerStats: [],
        platformInsights: null,
        totalFollowers: 0,
        totalPosts: 0,
        totalComments: 0,
        messagesReceived: 0
      };

      // ALWAYS Fetch Daily Metrics (it filters by queryArgs.platform if set)
      const { data: dailyRes } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'get-daily-metrics', payload: payloadBase }
      });
      const actualData = dailyRes?.data?.data?.data || dailyRes?.data?.data || {};
      
      if (actualData.dailyData) {
         let mappedTimeline = actualData.dailyData.map(d => ({
           value: d.metrics?.impressions || 0,
           label: d.date ? d.date.substring(5,10) : ''
         }));
         
         if (mappedTimeline.length === 1) {
           mappedTimeline.unshift({ value: 0, label: '' });
         }
         
         newZernioData.timelineData = mappedTimeline;
      }

      if (actualData.platformBreakdown) {
         newZernioData.totalPosts = actualData.platformBreakdown.reduce((sum, p) => sum + (p.postCount || 0), 0);
         newZernioData.totalComments = actualData.platformBreakdown.reduce((sum, p) => sum + (p.comments || 0), 0);
      }

      // Fetch Messages for Gelen Mesaj Analizi
      const { data: msgsRes } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'sync-messages', payload: {} }
      });
      if (msgsRes?.data?.conversations) {
         newZernioData.messagesReceived = msgsRes.data.conversations.length;
      }

      if (selectedPlatform.id === 'all') {
        // Fetch Total Followers for All
        const { data: followRes } = await supabase.functions.invoke('zernio-client', {
          body: { action: 'get-follower-stats', payload: payloadBase }
        });
        const actualFollow = followRes?.data?.data?.data || followRes?.data?.data || {};
        if (actualFollow.accounts) {
           newZernioData.totalFollowers = actualFollow.accounts.reduce((sum, a) => sum + (a.currentFollowers || 0), 0);
        }
      } else if (selectedPlatform.id === 'instagram') {
        // Fetch Instagram Demographics
        if (singleAccountId) {
          const { data: demoRes } = await supabase.functions.invoke('zernio-client', {
            body: { action: 'get-instagram-demographics', payload: accountPayload }
          });
          
          const actualDemo = demoRes?.data?.data?.data || demoRes?.data?.data || {};
          if (actualDemo.data?.[0]?.values) {
            const genderAge = actualDemo.data[0].values[0].value;
            const mapped = Object.keys(genderAge).map((key, index) => ({
              value: genderAge[key],
              color: ['#00f0ff', '#bc13fe', '#ebb2ff', '#0077b5'][index % 4],
              text: key
            }));
            newZernioData.demographics = mapped;
          }

          // Fetch Follower History
          const { data: followRes } = await supabase.functions.invoke('zernio-client', {
            body: { action: 'get-instagram-follower-history', payload: accountPayload }
          });
          const actualFollow = followRes?.data?.data?.data || followRes?.data?.data || {};
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
          const { data: ytRes } = await supabase.functions.invoke('zernio-client', {
            body: { action: 'get-youtube-daily-views', payload: accountPayload }
          });
          const actualYt = ytRes?.data?.data?.data || ytRes?.data?.data || {};
          if (actualYt.rows) {
             newZernioData.timelineData = actualYt.rows.map(r => ({
               value: parseInt(r[1]),
               label: r[0]
             }));
          }
        }
      } else if (selectedPlatform.id === 'tiktok') {
        if (singleAccountId) {
          const { data: tkRes } = await supabase.functions.invoke('zernio-client', {
            body: { action: 'get-tiktok-insights', payload: accountPayload }
          });
          const actualTk = tkRes?.data?.data?.data || tkRes?.data?.data || {};
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
    const channel1 = supabase.channel('stats_posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchInternalStats).subscribe();
    const channel2 = supabase.channel('stats_messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchInternalStats).subscribe();
    const channel3 = supabase.channel('stats_comments').on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchInternalStats).subscribe();
    const channel4 = supabase.channel('stats_reviews').on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchInternalStats).subscribe();

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
        <AnimatedBorderCard style={{ flex: 1, marginRight: 6 }} colors={['#00f0ff', '#131314']} padding={12}>
          <Text className="text-[#849495] text-[10px] mb-1">{t('sosyalMedya.analytics.totalPosts')}</Text>
          <Text className="text-[#00f0ff] text-[18px] font-bold">{zernioData.totalPosts || 0}</Text>
        </AnimatedBorderCard>
        <AnimatedBorderCard style={{ flex: 1, marginLeft: 6 }} colors={['#bc13fe', '#131314']} padding={12}>
          <Text className="text-[#849495] text-[10px] mb-1">{t('sosyalMedya.analytics.totalComments')}</Text>
          <Text className="text-[#ebb2ff] text-[18px] font-bold">{zernioData.totalComments || 0}</Text>
        </AnimatedBorderCard>
      </View>

      <View className="flex-row justify-between mb-4">
        <GlassCard style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <Ionicons name="people" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.totalFollowers')}</Text>
          </View>
          <Text className="text-[#e5e2e3] text-[16px] font-bold">
            {zernioData.totalFollowers > 0 ? zernioData.totalFollowers : '--'}
          </Text>
        </GlassCard>
        <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <MaterialIcons name="post-add" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.reviews')}</Text>
          </View>
          <Text className="text-[#e5e2e3] text-[16px] font-bold">{stats.totalReviews}</Text>
        </GlassCard>
      </View>

      {/* Chart: Posts / Impressions over time */}
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#131314']}>
        <Text className="text-[#e5e2e3] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.engagementImpressions')}</Text>
        <Text className="text-[#849495] text-[10px] mb-4">{t('sosyalMedya.analytics.changeOverTime')}</Text>
        
        {zernioData.timelineData.length > 0 ? (
          <View style={{marginLeft: -20}}>
            <LineChart
              data={zernioData.timelineData}
              color="#00f0ff"
              thickness={3}
              dataPointsColor="#bc13fe"
              hideRules
              yAxisTextStyle={{color: '#849495', fontSize: 10}}
              xAxisLabelTextStyle={{color: '#849495', fontSize: 8}}
              animationDuration={1500}
              isAnimated
              height={120}
              initialSpacing={20}
              spacing={width * 0.12}
            />
          </View>
        ) : (
           <View className="h-32 justify-center items-center">
             <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.noChartData')}</Text>
           </View>
        )}
      </AnimatedBorderCard>

      {/* Demographics / Follower History for specific platforms */}
      {selectedPlatform.id === 'instagram' && zernioData.demographics.length > 0 && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#131314']}>
          <Text className="text-[#e5e2e3] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.demographics')}</Text>
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
      
      {/* Platform Breakdown Placeholder for "All" */}
      {selectedPlatform.id === 'all' && (
        <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#131314']}>
          <Text className="text-[#e5e2e3] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.platformOverview')}</Text>
          <View className="mt-4 flex-row justify-around">
            <View className="items-center">
              <Ionicons name="logo-instagram" size={24} color="#ebb2ff" />
              <Text className="text-[#e5e2e3] text-[12px] font-bold mt-2">{t('sosyalMedya.analytics.active')}</Text>
            </View>
            <View className="w-[1px] h-full bg-white/10" />
            <View className="items-center">
              <Ionicons name="business" size={24} color="#34a853" />
              <Text className="text-[#e5e2e3] text-[12px] font-bold mt-2">{t('sosyalMedya.analytics.active')}</Text>
            </View>
          </View>
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
        <AnimatedBorderCard style={{ flex: 1, marginRight: 6 }} colors={['#bc13fe', '#131314']} padding={12}>
          <View className="flex-row items-center mb-1">
            <Feather name="inbox" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.received')}</Text>
          </View>
          <Text className="text-[#ebb2ff] text-[18px] font-bold">{zernioData.messagesReceived || 0}</Text>
        </AnimatedBorderCard>
        
        <AnimatedBorderCard style={{ flex: 1, marginLeft: 6 }} colors={['#00f0ff', '#131314']} padding={12}>
          <View className="flex-row items-center mb-1">
            <Feather name="send" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.sent')}</Text>
          </View>
          <Text className="text-[#00f0ff] text-[18px] font-bold">0</Text>
        </AnimatedBorderCard>
      </View>

      <View className="flex-row justify-between mb-4">
        <GlassCard style={{ flex: 1, marginRight: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <Feather name="eye" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.read')}</Text>
          </View>
          <Text className="text-[#e5e2e3] text-[16px] font-bold">--</Text>
        </GlassCard>
        
        <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
          <View className="flex-row items-center mb-1">
            <Feather name="clock" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{t('sosyalMedya.analytics.avgResponse')}</Text>
          </View>
          <Text className="text-[#e5e2e3] text-[16px] font-bold">{t('sosyalMedya.analytics.responseTimeMin')}</Text>
        </GlassCard>
      </View>

      {/* Response Time Info */}
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#131314']}>
        <Text className="text-[#e5e2e3] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.responseTimeAnalysis')}</Text>
        <Text className="text-[#849495] text-[10px] mb-4">{t('sosyalMedya.analytics.firstResponseText')}</Text>
        <View className="items-center py-6">
          <MaterialIcons name="speed" size={32} color="#00f0ff" style={{ opacity: 0.5, marginBottom: 8 }} />
          <Text className="text-[#e5e2e3] text-[12px]">{t('sosyalMedya.analytics.greatSpeed')}</Text>
        </View>
      </AnimatedBorderCard>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
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
          <ActivityIndicator size="large" color="#00f0ff" />
          <Text className="text-[#849495] text-[12px] mt-4">{t('sosyalMedya.analytics.loading')}</Text>
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
                  <Text className="text-[#e5e2e3] font-bold text-[14px]">{t('sosyalMedya.analytics.selectPlatform')}</Text>
                  <TouchableOpacity onPress={() => setPlatformModalVisible(false)}>
                    <MaterialIcons name="close" size={20} color="#849495" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {PLATFORMS.map((platform) => (
                    <TouchableOpacity
                      key={platform.id}
                      onPress={() => handleSelectPlatform(platform)}
                      className={`flex-row items-center py-3 px-2 rounded-lg mb-1 ${selectedPlatform.id === platform.id ? 'bg-[#00f0ff]/10' : ''}`}
                    >
                      <Ionicons name={platform.icon} size={18} color={platform.color} style={{ marginRight: 12, width: 24, textAlign: 'center' }} />
                      <Text className={`text-[12px] ${selectedPlatform.id === platform.id ? 'text-[#00f0ff] font-bold' : 'text-[#e5e2e3]'}`}>
                        {platform.name}
                      </Text>
                      {selectedPlatform.id === platform.id && (
                        <MaterialIcons name="check" size={16} color="#00f0ff" style={{ marginLeft: 'auto' }} />
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
                  <Text className="text-[#e5e2e3] font-bold text-[14px]">{t('sosyalMedya.analytics.selectTimeRange')}</Text>
                  <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                    <MaterialIcons name="close" size={20} color="#849495" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {TIME_RANGES.map((range) => (
                    <TouchableOpacity
                      key={range.id}
                      onPress={() => handleSelectTimeRange(range)}
                      className={`flex-row items-center py-3 px-2 rounded-lg mb-1 ${selectedTimeRange.id === range.id ? 'bg-[#00f0ff]/10' : ''}`}
                    >
                      <MaterialIcons name="access-time" size={18} color="#849495" style={{ marginRight: 12, width: 24, textAlign: 'center' }} />
                      <Text className={`text-[12px] ${selectedTimeRange.id === range.id ? 'text-[#00f0ff] font-bold' : 'text-[#e5e2e3]'}`}>
                        {range.name}
                      </Text>
                      {selectedTimeRange.id === range.id && (
                        <MaterialIcons name="check" size={16} color="#00f0ff" style={{ marginLeft: 'auto' }} />
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
    backgroundColor: '#131314',
    borderRadius: 16,
    padding: 20,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  }
});
