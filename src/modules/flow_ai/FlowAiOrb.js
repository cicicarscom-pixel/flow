import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Text, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ledger AI'ın "orb" düğmesinin mobil karşılığı (apps/ledger/components/ledger/ai/LedgerAIOrb.tsx):
// koyu hap, dönen neon (cyan → mor → kırmızı) hale, mavi parlayan çizgi, beyaz etiket.
// SÜRÜKLENEBİLİR: parmakla istenen yere çekilir, bırakılınca en yakın kenara yapışır, konum hatırlanır.
export const ORB_W = 138;
export const ORB_H = 52;
const RING = 2.5;
const MARGIN = 12;
const TAP_SLOP = 6;
const STORAGE_KEY = 'flow_ai_orb_position_v1';

const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

export default function FlowAiOrb({ label, accessibilityLabel, onPress }) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [ready, setReady] = useState(false);

  // Sınırlar (güvenli alanlar içinde). Ref: PanResponder bir kez oluşur, güncel değerleri buradan okur.
  const bounds = useMemo(() => ({
    minX: MARGIN,
    maxX: winW - ORB_W - MARGIN,
    minY: insets.top + MARGIN,
    maxY: winH - ORB_H - insets.bottom - MARGIN,
  }), [winW, winH, insets.top, insets.bottom]);
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const current = useRef({ x: 0, y: 0 });
  const startPt = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  useEffect(() => {
    const id = pos.addListener((v) => { current.current = v; });
    return () => pos.removeListener(id);
  }, [pos]);

  // Konumu yükle: kayıtlı yoksa sağ alt (sekme çubuğunun üstü).
  useEffect(() => {
    let alive = true;
    (async () => {
      let saved = null;
      try { saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || 'null'); } catch (_) { /* bozuk kayıt: varsayılan */ }
      if (!alive) return;
      const b = boundsRef.current;
      const side = saved?.side === 'left' ? 'left' : 'right';
      const yRatio = typeof saved?.yRatio === 'number' ? saved.yRatio : null;
      const x = side === 'left' ? b.minX : b.maxX;
      const y = yRatio === null ? clamp(winH - 96 - ORB_H - insets.bottom / 2, b.minY, b.maxY) : clamp(b.minY + yRatio * (b.maxY - b.minY), b.minY, b.maxY);
      pos.setValue({ x, y });
      setReady(true);
    })();
    return () => { alive = false; };
    // yalnızca ilk açılışta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ekran boyutu değişirse (döndürme) konumu sınırlara çek.
  useEffect(() => {
    if (!ready) return;
    pos.setValue({ x: clamp(current.current.x, bounds.minX, bounds.maxX), y: clamp(current.current.y, bounds.minY, bounds.maxY) });
  }, [bounds, ready, pos]);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const snapToEdge = useRef(() => {
    const b = boundsRef.current;
    const cx = current.current.x + ORB_W / 2;
    const side = cx < (b.minX + b.maxX + ORB_W) / 2 ? 'left' : 'right';
    const x = side === 'left' ? b.minX : b.maxX;
    const y = clamp(current.current.y, b.minY, b.maxY);
    Animated.spring(pos, { toValue: { x, y }, friction: 8, tension: 90, useNativeDriver: false }).start();
    const span = b.maxY - b.minY;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ side, yRatio: span > 0 ? (y - b.minY) / span : 1 })).catch(() => {});
  }).current;

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pos.stopAnimation();
      startPt.current = { ...current.current };
      moved.current = false;
    },
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > TAP_SLOP || Math.abs(g.dy) > TAP_SLOP) moved.current = true;
      if (!moved.current) return;
      const b = boundsRef.current;
      pos.setValue({ x: clamp(startPt.current.x + g.dx, b.minX, b.maxX), y: clamp(startPt.current.y + g.dy, b.minY, b.maxY) });
    },
    onPanResponderRelease: () => {
      if (!moved.current) { onPressRef.current?.(); return; }
      snapToEdge();
    },
    onPanResponderTerminate: () => { if (moved.current) snapToEdge(); },
  })).current;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      testID="flow_ai_fab"
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => onPressRef.current?.()}
      {...responder.panHandlers}
      style={{
        position: 'absolute', left: 0, top: 0, width: ORB_W, height: ORB_H, borderRadius: ORB_H / 2, opacity: ready ? 1 : 0,
        transform: pos.getTranslateTransform(),
        shadowColor: '#00a2ff', shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 10,
      }}
    >
      {/* Halka: dönen degrade, iç hap ile maskelenir */}
      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: ORB_H / 2, overflow: 'hidden', backgroundColor: '#00a2ff' }}>
        <Animated.View style={{ position: 'absolute', left: (ORB_W - 260) / 2, top: (ORB_H - 260) / 2, width: 260, height: 260, transform: [{ rotate }] }}>
          <LinearGradient
            colors={['#00f3ff', '#9D00FF', '#FF0055', '#00a2ff', '#00f3ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
      {/* İç hap */}
      <View style={{ position: 'absolute', left: RING, top: RING, right: RING, bottom: RING, borderRadius: (ORB_H - RING * 2) / 2, backgroundColor: '#080B10', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={['rgba(0,218,243,0.28)', 'transparent']} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: (ORB_H - RING * 2) / 2, opacity: 0.5 }} />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>{label}</Text>
      </View>
    </Animated.View>
  );
}
