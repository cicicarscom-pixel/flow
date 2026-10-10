import React from 'react';
import { View, Text } from 'react-native';
import { AnimatedBorderCard, GlassCard } from './AnalyticsCards';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { KeyMetricsRowPrimary } from './KeyMetricsRowPrimary';
import { KeyMetricsRowSecondary } from './KeyMetricsRowSecondary';
import { PostsOverTimeChart } from './PostsOverTimeChart';
import { FollowerGrowthChart } from './FollowerGrowthChart';
import { TopPostsCard } from './TopPostsCard';
import { PlatformBreakdownCard } from './PlatformBreakdownCard';
import { BestTimesHeatmapCard } from './BestTimesHeatmapCard';
import { ContentDecayCard } from './ContentDecayCard';
import { PostingFrequencyCard } from './PostingFrequencyCard';

export function PostingAnalyticsView({ PLATFORMS, selectedPlatform, t, zernioData }) {
  return (
    <View className="px-5 pb-32">
      {/* Key Metrics Grid */}
      <KeyMetricsRowPrimary t={t} zernioData={zernioData} />
    
      <KeyMetricsRowSecondary t={t} zernioData={zernioData} />
    
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
                <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.cards.formatVideoImage')}</Text>
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
                  <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.cards.bestPost')}</Text>
                </View>
                <Text className="text-[#F6F1EC] text-[11px] font-bold mb-1" numberOfLines={1}>
                  {bestPost.content || bestPost.title || 'Görsel Gönderi'}
                </Text>
                <Text className="text-[#FFD700] text-[9px] font-bold">
                  {t('sosyalMedya.analytics.cards.engagementCount', { count: totalE })}
                </Text>
              </GlassCard>
            );
          }
          
          return (
            <GlassCard style={{ flex: 1, marginLeft: 6, padding: 12, borderRadius: 12 }}>
              <View className="flex-row items-center mb-1">
                <Ionicons name="star" size={12} color="#A79E96" style={{ marginRight: 4 }} />
                <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.cards.bestPost')}</Text>
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
             <Text className="text-[#A79E96] text-[8px] mr-3">{t('sosyalMedya.analytics.cols.views')}</Text>
             <View className="w-2 h-2 rounded-full bg-[#C2478D] mr-1" />
             <Text className="text-[#A79E96] text-[8px]">{t('sosyalMedya.analytics.cols.likes')}</Text>
          </View>
        </View>
        <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.changeOverTime')}</Text>
        
        <PostsOverTimeChart t={t} zernioData={zernioData} />
      </AnimatedBorderCard>
    
      {/* Chart: Follower Growth History */}
      <FollowerGrowthChart selectedPlatform={selectedPlatform} t={t} zernioData={zernioData} />
    
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
      <TopPostsCard PLATFORMS={PLATFORMS} t={t} zernioData={zernioData} />
    
      {/* 17.09.2026: Platform Kırılımı — web'deki (analiz/page.tsx) 11 sütunlu
          detaylı tabloyla birebir eşleşecek şekilde genişletildi (eskiden
          sadece Platform/Gönderi/Erişim/ER% olan 4 sütunluk sade bir listeydi).
          Aynı yatay-kaydırılabilir-tablo deseni burada da kullanılıyor. */}
      <PlatformBreakdownCard PLATFORMS={PLATFORMS} selectedPlatform={selectedPlatform} t={t} zernioData={zernioData} />
    
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
      <BestTimesHeatmapCard t={t} zernioData={zernioData} />
    
      {/* Phase 5: Content Decay */}
      <ContentDecayCard t={t} zernioData={zernioData} />
    
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
      <PostingFrequencyCard PLATFORMS={PLATFORMS} t={t} zernioData={zernioData} />
    </View>
  );
}
