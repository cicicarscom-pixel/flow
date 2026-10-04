import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

// "Düşünüyor" animasyonu: üç nokta sırayla yanıp söner ve hafifçe yükselir (Ledger AI / sohbet ekranlarındaki gibi).
const DELAYS = [0, 160, 320];

export default function TypingDots({ color = '#fff', size = 7, gap = 5, style }) {
  const values = useRef(DELAYS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = values.map((v, i) => Animated.loop(
      Animated.sequence([
        Animated.delay(DELAYS[i]),
        Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(Math.max(0, 480 - DELAYS[i])),
      ]),
    ));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]} accessibilityRole="progressbar">
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: size, height: size, borderRadius: size / 2, backgroundColor: color,
            marginHorizontal: gap / 2,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.6] }) }],
          }}
        />
      ))}
    </View>
  );
}
