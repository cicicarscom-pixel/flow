import { View, Animated, Easing } from 'react-native';
import { styles } from './inboxStyles';
import React, { useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Glassmorphism Card Wrapper
export const GlassCard = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

export const getPlatformIconName = (platform) => {
  if (!platform) return 'help';
  const platLower = platform.toLowerCase();
  if (platLower === 'twitter' || platLower === 'x') return 'close';
  if (platLower === 'telegram') return 'paper-plane';
  if (platLower === 'bluesky') return 'cloud';
  if (platLower === 'threads') return 'at';
  if (platLower.includes('google')) return 'business';
  return `logo-${platLower}`;
};

// Animated Border Card
export const AnimatedBorderCard = ({ children, style, colors, padding = 16, borderRadius = 12, marginBottom = 0 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 2,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      return () => spinValue.stopAnimation();
    }, [])
  );

  // eslint-disable-next-line react-hooks/refs
  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <View style={[style, { overflow: 'hidden', padding: 2, borderRadius, marginBottom, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      <Animated.View style={{ 
        position: 'absolute', top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
        transform: [{ rotate: spin }],
      }}>
        <LinearGradient
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#22B573', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={{ flex: 1, backgroundColor: '#17151A', borderRadius: borderRadius - 2, padding }}>
        {children}
      </View>
    </View>
  );
};
