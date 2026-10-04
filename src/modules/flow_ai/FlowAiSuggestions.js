import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// FA6 — proaktif öneri kartları. Sunucu yalnız {kind, params, cta} döner; metinler burada kendi dilimizde yazılır.
// Kartlar KENDİLİĞİNDEN hiçbir şey yapmaz: eylem ancak kullanıcı düğmeye dokununca çalışır
// (sohbete bir mesaj gönderir ya da bir ekranı açar).

const ICONS = { connect_account: 'link-outline', free_slots: 'calendar-outline', best_time: 'time-outline', growth: 'trending-up-outline' };

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

function weekdayName(dayIndex, lng) {
  // 2023-01-01 bir Pazar'dır → dayIndex 0 = Pazar.
  try {
    return new Date(Date.UTC(2023, 0, 1 + Number(dayIndex))).toLocaleDateString(lng, { weekday: 'long', timeZone: 'UTC' });
  } catch (e) {
    return '';
  }
}

function dateLabel(ymd, lng) {
  try {
    const [y, m, d] = String(ymd).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lng, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  } catch (e) {
    return String(ymd);
  }
}

/** Kartın çeviri değişkenleri. */
export function suggestionVars(card, lng) {
  const p = card.params || {};
  switch (card.kind) {
    case 'free_slots': return { day: dateLabel(p.date, lng), free: p.free };
    case 'best_time': return { day: weekdayName(p.dayIndex, lng), hour: p.hour, postCount: p.postCount };
    case 'growth': return { platform: cap(p.platform), change: `${p.change > 0 ? '+' : ''}${p.change}`, days: p.days };
    default: return {};
  }
}

export default function FlowAiSuggestions({ cards, onPrompt, onNavigate, onDismiss }) {
  const { t, i18n } = useTranslation();
  if (!cards || cards.length === 0) return null;
  return (
    <View style={{ paddingTop: 6 }}>
      <Text style={{ color: '#9FB0C3', fontSize: 12, fontWeight: '600', marginHorizontal: 14, marginBottom: 6 }}>{t('flowAi.suggest.header')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {cards.map((c) => {
          const vars = suggestionVars(c, i18n.language);
          const base = `flowAi.suggest.${c.kind}`;
          return (
            <View key={c.id} testID={`flow_ai_suggestion_${c.kind}`} style={{ width: 250, marginRight: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(157,92,255,0.25)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name={ICONS[c.kind] || 'sparkles-outline'} size={18} color="#9D5CFF" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 }}>{t(`${base}.title`, vars)}</Text>
                <TouchableOpacity onPress={() => onDismiss(c.id)} accessibilityLabel={t('flowAi.suggest.dismiss')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={16} color="#65707D" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#B8C4D2', fontSize: 12, marginTop: 6 }}>{t(`${base}.body`, vars)}</Text>
              <TouchableOpacity
                onPress={() => (c.cta?.type === 'navigate' ? onNavigate(c.cta.screen, c.id) : onPrompt(t(`${base}.prompt`, vars), c.id))}
                style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.18)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.45)' }}
              >
                <Text style={{ color: '#9CC2FF', fontWeight: '700', fontSize: 12 }}>{t(`${base}.cta`)}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
