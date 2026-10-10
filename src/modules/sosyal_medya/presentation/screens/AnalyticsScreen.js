import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, GlobalAppBar } from '../../../../shared';
import { todayInTimezone, addDaysYmd } from '../../../../lib/dates';
import { TopToggle, FilterRow } from './analytics/AnalyticsControls';
import { getPlatforms, getTimeRanges } from './analytics/analyticsOptions';
import { PostingAnalyticsView } from './analytics/PostingAnalyticsView';
import { InboxAnalyticsView } from './analytics/InboxAnalyticsView';
import { PlatformPickerModal } from './analytics/PlatformPickerModal';
import { TimeRangeModal } from './analytics/TimeRangeModal';


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
        supabase.schema('integration').from('social_accounts').select('zernio_account_id, platform').eq('organization_id', organizationId).eq('is_active', true).eq('needs_reconnection', false)
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

      const tz = 'Europe/Istanbul'; // We can grab user timezone if available, fallback Istanbul
      const _toDate = todayInTimezone(tz);
      const _fromDate = addDaysYmd(_toDate, -(selectedTimeRange?.days || 30));
      
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
    <PostingAnalyticsView PLATFORMS={PLATFORMS} selectedPlatform={selectedPlatform} t={t} zernioData={zernioData} />
  );

  // -------------------------
  // INBOX ANALYTICS VIEW
  // -------------------------
  const renderInboxAnalytics = () => (
    <InboxAnalyticsView t={t} zernioData={zernioData} />
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
      <PlatformPickerModal PLATFORMS={PLATFORMS} handleSelectPlatform={handleSelectPlatform} isPlatformModalVisible={isPlatformModalVisible} selectedPlatform={selectedPlatform} setPlatformModalVisible={setPlatformModalVisible} t={t} />

      {/* Time Range Selector Modal */}
      <TimeRangeModal TIME_RANGES={TIME_RANGES} handleSelectTimeRange={handleSelectTimeRange} isTimeModalVisible={isTimeModalVisible} selectedTimeRange={selectedTimeRange} setTimeModalVisible={setTimeModalVisible} t={t} />

    </SafeAreaView>
  );
}

