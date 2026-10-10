import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

function formatWhen(preview) {
  try {
    return new Date(preview.scheduledFor).toLocaleString(undefined, { timeZone: preview.timezone, dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(preview.scheduledFor || '');
  }
}

// Onay bekleyen eylemler ve yayın önizlemesi (FlowAiHost'tan birebir taşındı).
export default function PendingActions({ pending, busy, decide, t }) {
  return (
    <>
    {pending.map((p) => {
      const isPublish = p.toolName === 'publish_post' && p.preview?.text;
      return (
        <View key={p.id} style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,218,243,0.15)' }}>
          <Text style={{ color: '#00DAF3', fontWeight: '600', fontSize: 12 }}>{t(isPublish ? 'flowAi.publish.title' : 'flowAi.pendingTitle')}</Text>
          {isPublish ? (
            <>
              <Text style={{ color: '#9FB0C3', marginTop: 4, fontSize: 12 }}>
                {(p.preview.platforms || []).join(', ')} · {p.preview.mode === 'schedule' ? t('flowAi.publish.at', { when: formatWhen(p.preview) }) : t('flowAi.publish.now')}
              </Text>
              <Text style={{ color: '#D7DEE7', marginTop: 6 }} numberOfLines={8}>{p.preview.text}</Text>
            </>
          ) : (
            <Text style={{ color: '#D7DEE7', marginTop: 2 }} numberOfLines={3}>{p.preview?.description || p.toolName}</Text>
          )}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity disabled={busy} onPress={() => decide(p, true)} style={{ flex: 1, backgroundColor: '#238636', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginRight: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t(isPublish ? (p.preview.mode === 'schedule' ? 'flowAi.publish.approveSchedule' : 'flowAi.publish.approveNow') : 'flowAi.approve')}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={busy} onPress={() => decide(p, false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t(isPublish ? 'flowAi.publish.cancel' : 'flowAi.reject')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    })}
    </>
  );
}
