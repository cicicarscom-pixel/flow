import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Paylaşım devri onay kartı (FlowAiHost'tan birebir taşındı; işleyiciler üst bileşende kalır).
export default function SharePendingCard({ shareJobPending, shareConfirmState, busy, onConfirm, onCancel, t }) {
  return (
    <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,218,243,0.15)' }}>
      <Text style={{ color: '#00DAF3', fontWeight: '600', fontSize: 12 }}>{t('flowAi.share.title')}</Text>
      <Text style={{ color: '#9FB0C3', marginTop: 4, fontSize: 12 }}>
        {shareJobPending.platforms.join(', ')} · {shareJobPending.scheduledLocal ? shareJobPending.scheduledLocal : t('flowAi.publish.now')}
      </Text>
      <Text style={{ color: '#D7DEE7', marginTop: 6 }} numberOfLines={8}>{shareJobPending.caption}</Text>

      {shareConfirmState === 'STARTED' ? (
        <Text style={{ color: '#3FB950', marginTop: 12, textAlign: 'center', fontWeight: '500' }}>{t('flowAi.share.starting')}</Text>
      ) : shareConfirmState === 'NOT_READY' ? (
        <Text style={{ color: '#E3B341', marginTop: 12, textAlign: 'center', fontWeight: '500' }}>{t('flowAi.share.wait')}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity disabled={busy || shareConfirmState === 'STARTED'} onPress={onConfirm} style={{ flex: 1, backgroundColor: '#238636', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginRight: 6 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.share.confirm')}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={busy || shareConfirmState === 'STARTED'} onPress={onCancel} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('flowAi.share.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
