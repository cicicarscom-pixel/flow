import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Ledger AI'ın "orb" düğmesinin mobil karşılığı (apps/ledger/components/ledger/ai/LedgerAIOrb.tsx):
// koyu hap, dönen neon (cyan → mor → kırmızı) hale, mavi parlayan çizgi, beyaz etiket.
const W = 138;
const H = 52;
const RING = 2.5;

export default function FlowAiOrb({ label, accessibilityLabel, onPress, style }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <TouchableOpacity
      testID="flow_ai_fab"
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[{ width: W, height: H, borderRadius: H / 2, shadowColor: '#00a2ff', shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 10 }, style]}
    >
      {/* Halka: dönen degrade, iç hap ile maskelenir */}
      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: H / 2, overflow: 'hidden', backgroundColor: '#00a2ff' }}>
        <Animated.View style={{ position: 'absolute', left: (W - 260) / 2, top: (H - 260) / 2, width: 260, height: 260, transform: [{ rotate }] }}>
          <LinearGradient
            colors={['#00f3ff', '#9D00FF', '#FF0055', '#00a2ff', '#00f3ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
      {/* İç hap */}
      <View style={{ position: 'absolute', left: RING, top: RING, right: RING, bottom: RING, borderRadius: (H - RING * 2) / 2, backgroundColor: '#080B10', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={['rgba(0,218,243,0.28)', 'transparent']} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: (H - RING * 2) / 2, opacity: 0.5 }} />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}
