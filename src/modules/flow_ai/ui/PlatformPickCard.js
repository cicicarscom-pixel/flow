import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Paylaşım platformu seçimi (FlowAiHost'tan birebir taşındı; işleyiciler üst bileşende kalır).
export default function PlatformPickCard({ platformPick, pickSel, onToggle, onContinue, onCancel, t }) {
  return (
    <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,218,243,0.15)' }}>
      <Text style={{ color: '#00DAF3', fontWeight: '600', fontSize: 12, marginBottom: 8 }}>{t('flowAi.share.pickTitle')}</Text>

      <View style={{ gap: 6, marginBottom: 12 }}>
        {platformPick.map((o, i) => (
          <TouchableOpacity
            key={i}
            disabled={!o.eligible}
            onPress={() => onToggle(o.platform)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: pickSel[o.platform] ? 'rgba(0,218,243,0.1)' : 'rgba(255,255,255,0.03)',
              opacity: o.eligible ? 1 : 0.5
            }}
          >
            <View style={{ flexDirection: 'column' }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: o.eligible ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {o.platform.charAt(0).toUpperCase() + o.platform.slice(1)} {o.handle ? <Text style={{ opacity: 0.6, fontWeight: '400' }}>@{o.handle}</Text> : null}
              </Text>
              {!o.eligible && o.reason && (
                <Text style={{ fontSize: 11, color: '#FF7A59', marginTop: 2 }}>{o.reason}</Text>
              )}
            </View>
            {pickSel[o.platform] && <Text style={{ color: '#00DAF3', fontSize: 16 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity
          disabled={!Object.values(pickSel).some(Boolean)}
          onPress={onContinue}
          style={{ flex: 1, backgroundColor: '#00DAF3', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginRight: 6, opacity: Object.values(pickSel).some(Boolean) ? 1 : 0.5 }}
        >
          <Text style={{ color: '#000', fontWeight: '700' }}>{t('flowAi.share.pickContinue')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.share.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
