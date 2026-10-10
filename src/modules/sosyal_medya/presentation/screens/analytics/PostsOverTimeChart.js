import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { width } from './analyticsStyles';

export function PostsOverTimeChart({ t, zernioData }) {
  return (
    zernioData.timelineData.length > 0 ? (
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
    )
  );
}
