import React, { useRef } from 'react';
import { View, Text, PanResponder, StyleSheet, GestureResponderEvent, PanResponderGestureState } from 'react-native';

// ==============================================================================
// PERSONA ENGINE — Faz 2: Karakter Ayarları kadranları (özel/native olmayan slider)
// ==============================================================================
// flowweb'in src/components/ai-asistan/PersonaSlider.tsx'inin RN karşılığı.
// Bilinçli olarak `@react-native-community/slider` gibi hazır bir kütüphane
// KULLANILMADI — böyle bir paket native modül gerektirir, yani Antigravity'nin
// sade bir JS güncellemesi yerine tam bir Expo/EAS native build alıp cihaza
// yeniden yüklemesi gerekirdi. Bunun yerine, zaten projede bulunan çekirdek
// React Native API'si (PanResponder) ile sıfırdan, saf JS bir slider yazıldı —
// hiçbir yeni native bağımlılık eklenmedi, normal JS/OTA güncellemesiyle
// yayınlanabilir.
//
// Davranış: track'e her yerine dokunma/sürükleme, o noktaya karşılık gelen
// 0-100 değerini anında hesaplayıp onChange ile bildirir (native slider'larla
// aynı "dokunduğun yere atlar" hissi).
export interface DialSliderProps {
  label: string;
  value: number; // 0-100
  onChange: (value: number) => void;
  accentColor?: string;
}

export default function DialSlider({ label, value, onChange, accentColor = '#FF7A59' }: DialSliderProps) {
  const containerRef = useRef<View>(null);
  // Parmağın EKRAN konumu (pageX) ile kapsayıcının ekran konumu karşılaştırılır. evt.nativeEvent.locationX
  // dokunulan EN İÇ görünüme göre geldiği için (çubuk/dolgu), değer sıçrıyor ve sürükleme çalışmıyordu.
  const geo = useRef({ left: 0, width: 0 });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const apply = (pageX: number) => {
    const { left, width } = geo.current;
    if (width <= 0) return;
    onChangeRef.current(clamp(((pageX - left) / width) * 100));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Üstteki ScrollView sürüklemeyi çalmasın (aksi halde kaydırıcı hareket etmiyor).
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const pageX = evt.nativeEvent.pageX;
        containerRef.current?.measureInWindow((x: number, _y: number, w: number) => {
          geo.current = { left: x, width: w };
          apply(pageX);
        });
      },
      onPanResponderMove: (evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => {
        apply(evt.nativeEvent.pageX);
      },
    })
  ).current;

  const safeValue = clamp(value);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueText, { color: accentColor }]}>{safeValue}%</Text>
      </View>

      <View
        ref={containerRef}
        collapsable={false}
        {...panResponder.panHandlers}
        style={styles.touchArea}
      >
        <View pointerEvents="none" style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${safeValue}%`, backgroundColor: accentColor }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: `${safeValue}%`,
              borderColor: accentColor,
              shadowColor: accentColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '800',
  },
  touchArea: {
    height: 28,
    justifyContent: 'center',
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
});
