import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FLOW_GUIDES } from '../flowAiGuides';

// Rehber modu: ekranın üstünde adım kartı (FlowAiHost'tan birebir taşındı).
export default function GuideBanner({ guide, insets, t, onAdvance, onFinish }) {
  const def = FLOW_GUIDES[guide.key];
  const isLast = guide.step === def.steps.length - 1;
  return (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <View testID="flow_ai_guide" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, backgroundColor: '#12151C', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(0,162,255,0.55)', shadowColor: '#00a2ff', shadowOpacity: 0.45, shadowRadius: 12, elevation: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="sparkles" size={16} color="#00DAF3" />
            <Text style={{ color: '#00DAF3', fontWeight: '700', marginLeft: 6, flex: 1 }}>{t('flowAi.guide.title', { step: guide.step + 1, total: def.steps.length })}</Text>
          </View>
          <Text style={{ color: '#fff' }}>{t(def.steps[guide.step].textKey)}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            {!isLast && (
              <TouchableOpacity onPress={onAdvance} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', marginRight: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('flowAi.guide.skip')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onFinish(isLast)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#3B82F6' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t(isLast ? 'flowAi.guide.finish' : 'flowAi.guide.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
}
