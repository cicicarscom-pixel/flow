import React from 'react';
import { AnimatedBorderCard } from './AnalyticsCards';
import { Text, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function TopPostsCard({ PLATFORMS, t, zernioData }) {
  return (
    zernioData.postAnalytics && zernioData.postAnalytics.length > 0 && (
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.cards.topPosts')}</Text>
        <Text className="text-[#A79E96] text-[10px] mb-3">{t('sosyalMedya.analytics.cards.topPostsSub')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ width: 898 }}>
            {/* Header */}
            <View className="flex-row items-center pb-2 mb-2 border-b border-white/10">
              <Text className="text-[#A79E96] text-[10px] font-bold" style={{ width: 190 }}>{t('sosyalMedya.analytics.cols.post')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.likes')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>{t('sosyalMedya.analytics.cols.comments')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>{t('sosyalMedya.analytics.cols.shares')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>{t('sosyalMedya.analytics.cols.saves')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>{t('sosyalMedya.analytics.cols.clicks')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 96 }}>{t('sosyalMedya.analytics.cols.views')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.followers')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.impressionsShort')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.reach')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 56 }}>{t('sosyalMedya.analytics.cols.erShort')}</Text>
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
    )
  );
}
