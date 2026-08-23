/* eslint-disable react-hooks/refs */
import React, { useRef, useCallback } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnimatedBorderCard({ children, style, colors, padding = 20, borderRadius = 16, marginBottom = 0 }) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 2, // 2 tam tur atacak
        duration: 4000, // Toplam 4 saniye sürecek
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

      return () => {
        spinValue.stopAnimation();
      };
    }, [])
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <View style={[style, { overflow: 'hidden', padding: 3.5, borderRadius, marginBottom, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      {/* Spinning Gradient Background (The traveling light) */}
      <Animated.View style={{ 
        position: 'absolute',
        top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
        transform: [{ rotate: spin }],
      }}>
        <LinearGradient
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#C2478D', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      
      {/* Inner Mask to hide the middle of the gradient, showing only the border */}
      <View style={{ flex: 1, backgroundColor: '#201D24', borderRadius: borderRadius - 3.5, padding }}>
        {children}
      </View>
    </View>
  );
}
