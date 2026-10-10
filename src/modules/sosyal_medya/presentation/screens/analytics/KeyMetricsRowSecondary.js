import React from 'react';
import { View, Text } from 'react-native';
import { GlassCard } from './AnalyticsCards';
import { Ionicons } from '@expo/vector-icons';

export function KeyMetricsRowSecondary({ t, zernioData }) {
  return (
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
               <Text className="text-[#A79E96] text-[10px]">{t('sosyalMedya.analytics.cards.avgEngRate')}</Text>
             </View>
             <Text className="text-[#22B573] text-[16px] font-bold">%{overallEr}</Text>
           </GlassCard>
         );
      })()}
    </View>
  );
}
