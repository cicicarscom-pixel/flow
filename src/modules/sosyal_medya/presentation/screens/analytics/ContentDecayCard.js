import React from 'react';
import { AnimatedBorderCard } from './AnalyticsCards';
import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { width } from './analyticsStyles';

export function ContentDecayCard({ t, zernioData }) {
  return (
    zernioData.contentDecay && zernioData.contentDecay.length > 0 && (
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.cards.contentDecay')}</Text>
        <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.cards.contentDecaySub')}</Text>
        <View style={{marginLeft: -10}}>
          <BarChart
            data={[...zernioData.contentDecay].sort((a,b) => a.bucket_order - b.bucket_order).map(b => ({
              value: b.avg_pct_of_final || 0,
              label: b.bucket_label || '',
              frontColor: '#22B573'
            }))}
            barWidth={26}
            spacing={width * 0.08}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{color: '#A79E96', fontSize: 10}}
            xAxisLabelTextStyle={{color: '#A79E96', fontSize: 8}}
            noOfSections={4}
            height={120}
            isAnimated
          />
        </View>
      </AnimatedBorderCard>
    )
  );
}
