import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

// ==============================================================================
// PERSONA ENGINE — Faz 2: Rol/Karakter/Üslup için portre kart (RN)
// ==============================================================================
// flowweb'in src/components/ai-asistan/PersonaCard.tsx'inin (dairesel avatar +
// renkli halka + seçili durumda glow) React Native karşılığı. Web'deki tasarımı
// birebir piksel piksel kopyalamak yerine, mobil uygulamanın zaten kullandığı
// neon/glow görsel diline (BotYonetimiScreen.js'teki RGB spin kartlar, glow
// gölgeler) uyarlanmış bir versiyon — ama YAPISI aynı: dairesel görsel/emoji +
// altında etiket, seçiliyken renkli halka + glow.
//
// ÖNEMLİ (bkz. daha önce düzeltilen "chip kayma" hatası): dıştaki kart
// konteynerinin borderWidth'i SABİT (1.5) tutuluyor, sadece borderColor
// değişiyor — RN'de View'ler zaten border-box modelinde olduğu için (width/
// height sabitse borderWidth boyutu etkilemiyor) burada o hatanın tekrarlanma
// riski yok, ama yine de tutarlılık için borderWidth hiç değiştirilmiyor.
//
// avatarUrl web'in kendi barındırdığı statik PNG'lere (roller/üsluplar,
// https://flow.workigom.com/ai-asistan/...) veya Supabase Storage'daki
// gerçek karakter avatarlarına (ai_personas.avatar_url/thumbnail_url) işaret
// eden TAM (absolute) bir URL olmalı — kullanıcının "web'den URL ile çek"
// kararı burada uygulanıyor, görseller mobil bundle'ına gömülmüyor.
export interface PersonaAvatarCardProps {
  label: string;
  icon?: string | null;
  avatarUrl?: string | null;
  accentColor: string;
  selected: boolean;
  onPress: () => void;
  size?: number;
}

export default function PersonaAvatarCard({
  label,
  icon,
  avatarUrl,
  accentColor,
  selected,
  onPress,
  size = 56,
}: PersonaAvatarCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: selected ? `${accentColor}26` : 'rgba(255,255,255,0.03)',
          borderColor: selected ? accentColor : 'rgba(255,255,255,0.1)',
        },
      ]}
    >
      <View
        style={[
          styles.avatarWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: selected ? accentColor : `${accentColor}55`,
            shadowColor: accentColor,
            shadowOpacity: selected ? 0.75 : 0,
            shadowRadius: selected ? 10 : 0,
            elevation: selected ? 6 : 0,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: size * 0.42 }}>{icon || '🎭'}</Text>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, { color: selected ? accentColor : 'rgba(255,255,255,0.55)' }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 74,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 8,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 2,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
});
