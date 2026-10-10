import React from 'react';
import { AnimatedBorderCard } from './AnalyticsCards';
import { Text, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlatformBreakdownCard({ PLATFORMS, selectedPlatform, t, zernioData }) {
  return (
    zernioData.platformBreakdown && zernioData.platformBreakdown.length > 0 && selectedPlatform.id === 'all' && (
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <Text className="text-[#F6F1EC] text-[14px] font-bold mb-3">{t('sosyalMedya.analytics.cards.platformBreakdown')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ width: 832 }}>
            {/* Header */}
            <View className="flex-row items-center pb-2 mb-2 border-b border-white/10">
              <Text className="text-[#A79E96] text-[10px] font-bold" style={{ width: 130 }}>{t('sosyalMedya.analytics.cols.platform')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>{t('sosyalMedya.analytics.cols.post')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.likes')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>{t('sosyalMedya.analytics.cols.comments')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>{t('sosyalMedya.analytics.cols.shares')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 74 }}>{t('sosyalMedya.analytics.cols.saves')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 64 }}>{t('sosyalMedya.analytics.cols.clicks')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 96 }}>{t('sosyalMedya.analytics.cols.views')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.impressionsShort')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 70 }}>{t('sosyalMedya.analytics.cols.reach')}</Text>
              <Text className="text-[#A79E96] text-[10px] font-bold text-right" style={{ width: 56 }}>{t('sosyalMedya.analytics.cols.erShort')}</Text>
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
    )
  );
}
