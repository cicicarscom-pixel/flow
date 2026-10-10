import React from 'react';
import { View, Text } from 'react-native';
import { AnimatedBorderCard, GlassCard } from './AnalyticsCards';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export function InboxAnalyticsView({ t, zernioData }) {
  return (
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
}
