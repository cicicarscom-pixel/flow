import React from 'react';
import { AnimatedBorderCard } from './AnalyticsCards';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { width } from './analyticsStyles';

export function FollowerGrowthChart({ selectedPlatform, t, zernioData }) {
  return (
    (() => {
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
            <Text className="text-[#F6F1EC] text-[14px] font-bold">{t('sosyalMedya.analytics.cards.followerGrowth')}</Text>
          </View>
          <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.cards.followerGrowthSub')}</Text>
          
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
    })()
  );
}
