import React from 'react';
import { AnimatedBorderCard } from './AnalyticsCards';
import { Text, View, ScrollView } from 'react-native';

export function BestTimesHeatmapCard({ t, zernioData }) {
  return (
    zernioData.bestTimes && zernioData.bestTimes.length > 0 && (
      <AnimatedBorderCard marginBottom={16} colors={['rgba(255,255,255,0.2)', '#201D24']}>
        <Text className="text-[#F6F1EC] text-[14px] font-bold mb-1">{t('sosyalMedya.analytics.cards.bestTimes')}</Text>
        <Text className="text-[#A79E96] text-[10px] mb-4">{t('sosyalMedya.analytics.cards.bestTimesSub')}</Text>
        {(() => {
          const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
          const cellSize = 22;
          const cellGap = 2;
          const maxEngagement = Math.max(...zernioData.bestTimes.map(s => s.avg_engagement || 0), 1);
          return (
            <View className="flex-row">
              {/* Sol sütun: gün etiketleri (web'deki dikey gün sütununun karşılığı) */}
              <View style={{ paddingTop: 20, marginRight: 4 }}>
                {dayNames.map((day) => (
                  <View key={day} style={{ height: cellSize + cellGap, justifyContent: 'center' }}>
                    <Text className="text-[#A79E96] text-[10px]">{day}</Text>
                  </View>
                ))}
              </View>
              {/* Sağ taraf: yatay kaydırılabilir 24 saatlik grid (web'in overflowX:auto'suna karşılık gelir) */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ width: 24 * (cellSize + cellGap) }}>
                  {/* Saat başlıkları (0-23) */}
                  <View className="flex-row" style={{ marginBottom: 4 }}>
                    {Array.from({ length: 24 }).map((_, hourIdx) => (
                      <View key={hourIdx} style={{ width: cellSize, marginRight: cellGap, alignItems: 'center' }}>
                        <Text className="text-[#A79E96] text-[9px]">{hourIdx}</Text>
                      </View>
                    ))}
                  </View>
                  {/* 7 (gün) x 24 (saat) yoğunluk grid'i */}
                  {Array.from({ length: 7 }).map((_, dayIdx) => (
                    <View key={dayIdx} className="flex-row" style={{ marginBottom: cellGap }}>
                      {Array.from({ length: 24 }).map((_, hourIdx) => {
                        const slot = zernioData.bestTimes.find(s => s.day_of_week === dayIdx && s.hour === hourIdx);
                        const intensity = slot ? Math.max(0.1, (slot.avg_engagement || 0) / maxEngagement) : 0;
                        return (
                          <View
                            key={hourIdx}
                            style={{
                              width: cellSize,
                              height: cellSize,
                              marginRight: cellGap,
                              borderRadius: 4,
                              backgroundColor: slot ? `rgba(255, 122, 89, ${intensity})` : 'rgba(255,255,255,0.02)',
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.02)',
                            }}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          );
        })()}
        <Text className="text-[#A79E96] text-[11px] font-bold mt-3">
          {(() => {
            // 17.09.2026: Alt özet satırındaki gün kısaltmaları, üstteki
            // grid'le tutarlı olması için Türkçeye çevrildi (bkz. README —
            // eskiden İngilizce Mon/Tue/... kullanılıyordu, web tarafında da
            // aynı düzeltme eşzamanlı olarak yapıldı).
            const sorted = [...zernioData.bestTimes].sort((a, b) => (b.avg_engagement || 0) - (a.avg_engagement || 0)).slice(0, 2);
            const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
            const texts = sorted.map(s => `${days[s.day_of_week]} ${s.hour}${s.hour < 12 ? 'am' : 'pm'} · ${s.avg_engagement}`);
            return texts.length > 0 ? `Best times: ${texts.join(' · ')}` : '';
          })()}
        </Text>
      </AnimatedBorderCard>
    )
  );
}
