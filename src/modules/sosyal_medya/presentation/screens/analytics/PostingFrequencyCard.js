import React from 'react';
import { AnimatedBorderCard } from './AnalyticsCards';
import { Text, View } from 'react-native';
import { width } from './analyticsStyles';

export function PostingFrequencyCard({ PLATFORMS, t, zernioData }) {
  return (
    zernioData.postingFrequency && zernioData.postingFrequency.length > 0 && (
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.cards.frequencyVsER')}</Text>
        <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.cards.frequencyVsERSub')}</Text>
        {(() => {
          const chartHeight = 220;
          const chartWidth = Math.max(width - 40 - 32 - 36, 160); // ekran px-5 (40) + kart padding (32) + Y ekseni etiket alanı (36)
          const xs = zernioData.postingFrequency.map(f => f.posts_per_week || 0);
          const ys = zernioData.postingFrequency.map(f => f.avg_engagement_rate || 0);
          const weeks = zernioData.postingFrequency.map(f => f.weeks_count || 0);
          const xMin = Math.min(...xs, 0);
          const xMax = Math.max(...xs, 1);
          const yMin = Math.min(...ys, 0);
          const yMax = Math.max(...ys, 1);
          const wMin = Math.min(...weeks, 0);
          const wMax = Math.max(...weeks, 1);
          const xSpan = (xMax - xMin) || 1;
          const ySpan = (yMax - yMin) || 1;
          const wSpan = (wMax - wMin) || 1;
          const rMin = 8, rMax = 26;
          const yTicks = [yMax, yMin + ySpan * 0.5, yMin];
          const xTicks = [xMin, xMin + xSpan * 0.5, xMax];
    
          return (
            <View>
              <View className="flex-row">
                {/* Y ekseni etiketleri (Etkileşim Oranı %) */}
                <View style={{ width: 36, height: chartHeight, justifyContent: 'space-between', paddingRight: 4, paddingBottom: 14 }}>
                  {yTicks.map((v, i) => (
                    <Text key={i} className="text-[#A79E96] text-[9px] text-right">{v.toFixed(1)}</Text>
                  ))}
                </View>
                {/* Çizim alanı */}
                <View style={{ width: chartWidth, height: chartHeight }}>
                  {/* Izgara (CartesianGrid karşılığı) */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: chartHeight - 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }} />
                  {[0.25, 0.5, 0.75].map((p) => (
                    <View key={p} style={{ position: 'absolute', top: (chartHeight - 14) * p, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                  ))}
                  {/* Kabarcıklar (her nokta = bir platformun bir zaman dilimindeki paylaşım sıklığı/etkileşim oranı) */}
                  {zernioData.postingFrequency.map((f, idx) => {
                    const platId = f.platform ? (f.platform.toLowerCase() === 'google' ? 'googlebusiness' : f.platform.toLowerCase()) : '';
                    const platDef = PLATFORMS.find(pl => pl.id === platId);
                    const color = platDef ? platDef.color : '#FF7A59';
                    const r = rMin + (((f.weeks_count || 0) - wMin) / wSpan) * (rMax - rMin);
                    const cx = ((f.posts_per_week - xMin) / xSpan) * chartWidth;
                    const cy = (chartHeight - 14) - (((f.avg_engagement_rate || 0) - yMin) / ySpan) * (chartHeight - 14);
                    return (
                      <View
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: Math.min(Math.max(cx - r, 0), chartWidth - r * 2),
                          top: Math.min(Math.max(cy - r, 0), chartHeight - 14 - r * 2),
                          width: r * 2,
                          height: r * 2,
                          borderRadius: r,
                          backgroundColor: color,
                          opacity: 0.65,
                          borderWidth: 1.5,
                          borderColor: color,
                        }}
                      />
                    );
                  })}
                  {/* X ekseni etiketleri (Haftalık Gönderi) */}
                  <View className="flex-row justify-between" style={{ position: 'absolute', bottom: -14, left: 0, right: 0 }}>
                    {xTicks.map((v, i) => (
                      <Text key={i} className="text-[#A79E96] text-[9px]">{Number(v).toFixed(1)}</Text>
                    ))}
                  </View>
                </View>
              </View>
              {/* Legend (web'deki <Legend iconType="circle" />'ın karşılığı) */}
              <View className="flex-row flex-wrap mt-4" style={{ marginLeft: 36 }}>
                {Array.from(new Set(zernioData.postingFrequency.map(f => f.platform))).map((platform, idx) => {
                  const platId = platform ? (platform.toLowerCase() === 'google' ? 'googlebusiness' : platform.toLowerCase()) : '';
                  const platDef = PLATFORMS.find(pl => pl.id === platId);
                  const color = platDef ? platDef.color : '#FF7A59';
                  return (
                    <View key={idx} className="flex-row items-center mr-3 mb-1">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} />
                      <Text className="text-[#A79E96] text-[10px]">{platDef ? platDef.name : platform}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}
      </AnimatedBorderCard>
    )
  );
}
