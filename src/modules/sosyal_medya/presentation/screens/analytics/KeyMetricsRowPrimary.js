import React from 'react';
import { View, Text } from 'react-native';
import { AnimatedBorderCard } from './AnalyticsCards';

export function KeyMetricsRowPrimary({ t, zernioData }) {
  return (
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
  );
}
