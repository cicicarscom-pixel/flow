import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Anasayfa "Tüm Hesaplar" kartı içeriği: toplam takipçi + değişim, platform dağılım çubuğu ve hesap listesi.
// Veri: zernio-client get-follower-stats (hesap başına currentFollowers / growthPercentage).

const PLATFORMS = {
  facebook: { icon: 'logo-facebook', color: '#1877F2', label: 'Facebook' },
  instagram: { icon: 'logo-instagram', color: '#E1306C', label: 'Instagram' },
  youtube: { icon: 'logo-youtube', color: '#FF0000', label: 'YouTube' },
  linkedin: { icon: 'logo-linkedin', color: '#0A66C2', label: 'LinkedIn' },
  tiktok: { icon: 'logo-tiktok', color: '#69C9D0', label: 'TikTok' },
  twitter: { icon: 'logo-twitter', color: '#E7E9EA', label: 'X' },
  threads: { icon: 'at-outline', color: '#B0B0B0', label: 'Threads' },
  pinterest: { icon: 'logo-pinterest', color: '#E60023', label: 'Pinterest' },
  telegram: { icon: 'paper-plane-outline', color: '#2AABEE', label: 'Telegram' },
  whatsapp: { icon: 'logo-whatsapp', color: '#25D366', label: 'WhatsApp' },
};
const FALLBACK = { icon: 'globe-outline', color: '#A5B4FC', label: '' };
const metaOf = (p) => PLATFORMS[String(p || '').toLowerCase()] || FALLBACK;

const GREEN = '#22C55E';
const RED = '#EF4444';
const GREY = '#A79E96';

function Trend({ value, noChangeText, size = 12 }) {
  if (!value) return <Text style={{ color: GREY, fontSize: size }}>{noChangeText}</Text>;
  const up = value > 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MaterialIcons name={up ? 'arrow-upward' : 'arrow-downward'} size={size + 1} color={up ? GREEN : RED} />
      <Text style={{ color: up ? GREEN : RED, fontSize: size, fontWeight: '800' }}>{Math.abs(value)}%</Text>
    </View>
  );
}

export default function SocialSummaryCard({ accounts, totalFollowers, trend, loading, onViewAnalytics }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'tr';
  const nf = (n) => Number(n || 0).toLocaleString(locale);
  const sorted = [...(accounts || [])].sort((a, b) => b.followers - a.followers);
  const sum = sorted.reduce((s, a) => s + a.followers, 0) || 1;
  const shown = sorted.slice(0, 4);

  return (
    <View>
      {/* Başlık */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(165,180,252,0.14)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <MaterialIcons name="groups" size={18} color="#A5B4FC" />
          </View>
          <View>
            <Text style={{ color: '#F6F1EC', fontSize: 15, fontWeight: '800' }}>{t('dashboardScreen.social.allAccounts')}</Text>
            <Text style={{ color: GREY, fontSize: 11, marginTop: 1 }}>{t('dashboardScreen.social.accountsConnected', { n: sorted.length })}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN, marginRight: 5 }} />
          <Text style={{ color: GREEN, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{t('dashboardScreen.social.liveAnalysis')}</Text>
        </View>
      </View>

      {/* Toplam */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: GREY, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>{t('dashboardScreen.social.totalFollowers')}</Text>
          <Text style={{ color: '#F6F1EC', fontSize: 34, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>{loading ? '…' : nf(totalFollowers)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', paddingBottom: 6 }}>
          <Text style={{ color: GREY, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{t('dashboardScreen.social.change')}</Text>
          <Trend value={trend} noChangeText={t('dashboardScreen.social.noChange')} size={14} />
        </View>
      </View>

      {/* Platform dağılım çubuğu */}
      {sorted.length > 0 && (
        <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
          {sorted.map((a, i) => (
            <View key={a.id || i} style={{ flex: Math.max(a.followers / sum, 0.04), backgroundColor: metaOf(a.platform).color, marginRight: i < sorted.length - 1 ? 2 : 0 }} />
          ))}
        </View>
      )}

      {/* Hesap listesi */}
      <View style={{ marginTop: 12 }}>
        {shown.map((a, i) => {
          const m = metaOf(a.platform);
          return (
            <View key={a.id || i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ width: 38, height: 38 }}>
                {a.picture ? (
                  <Image source={{ uri: a.picture }} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                ) : (
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${m.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={m.icon} size={18} color={m.color} />
                  </View>
                )}
                <View style={{ position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#1E1B22' }}>
                  <Ionicons name={m.icon} size={10} color="#fff" />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <Text numberOfLines={1} style={{ color: '#F6F1EC', fontSize: 13, fontWeight: '700' }}>{a.name || a.username || m.label}</Text>
                <Text numberOfLines={1} style={{ color: GREY, fontSize: 11 }}>{m.label}{a.username ? ` · @${a.username}` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={{ color: '#F6F1EC', fontSize: 15, fontWeight: '800' }}>{nf(a.followers)}</Text>
                <Trend value={a.growth} noChangeText={t('dashboardScreen.social.followersShort')} size={11} />
              </View>
            </View>
          );
        })}
        {sorted.length > shown.length ? (
          <Text style={{ color: GREY, fontSize: 11, textAlign: 'center', marginTop: 2 }}>+{sorted.length - shown.length}</Text>
        ) : null}
      </View>

      {/* Alt bağlantı */}
      <TouchableOpacity onPress={onViewAnalytics} activeOpacity={0.8}
        style={{ marginTop: 10, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(165,180,252,0.12)', borderWidth: 1, borderColor: 'rgba(165,180,252,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#C7D2FE', fontSize: 13, fontWeight: '800', marginRight: 6 }}>{t('dashboardScreen.social.viewAnalysis')}</Text>
        <Ionicons name="arrow-forward" size={14} color="#C7D2FE" />
      </TouchableOpacity>
    </View>
  );
}
