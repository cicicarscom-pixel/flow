import { COLORS } from './dashboardTheme';
import { Text, View, Animated } from 'react-native';
import { styles } from './dashboardStyles';
import React, { useState, useEffect } from 'react';

// --- Utilities ---
export const hexToRgb = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,218,243';
};

export const GlowingText = ({ children, style, color = COLORS.primary }) => (
  <Text style={[style, { textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
    {children}
  </Text>
);

export const CustomGlassCard = ({ children, style, glowColor }) => (
  <View style={[
    styles.glassCard,
    // Renkli çerçeveli kartlar: Android'de elevation gölgesi yarı saydam arka planın ALTINDAN görünüp kalın koyu
    // bir kuşak oluşturuyordu. Gölge/elevation kaldırıldı, arka plan opak yapıldı; yalnız ince renkli çerçeve kalır.
    glowColor ? {
      backgroundColor: '#24202A',
      borderColor: `rgba(${hexToRgb(glowColor)}, 0.35)`,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    } : null,
    style
  ]}>
    {children}
  </View>
);

export const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
  const [animValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [animValue]);

  const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });

  return (
    <Animated.View style={[{ width, height, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius, opacity }, style]} />
  );
};

// "Asistan çalışıyor" hissi: ikon rozetinin arkasında yavaşça büyüyüp küçülen
// bir nefes alma animasyonu — sadece görsel, aiActive durumuna dokunmaz.
export const BreathingIcon = ({ active, children }) => {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => { if (loop) loop.stop(); };
  }, [active, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};
