/* eslint-disable react-hooks/refs */
import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

// "Asistan çalışıyor" hissi: durum noktasının arkasında yavaşça büyüyüp
// küçülen bir nefes alma animasyonu — sadece görsel.
export const BreathingDot = ({ active, children }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => { if (loop) loop.stop(); };
  }, [active]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] });

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {children}
    </Animated.View>
  );
};
