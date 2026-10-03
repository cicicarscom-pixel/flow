import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { subscribeHighlight } from './flowAiActions';

const SHOW_MS = 12000;

/**
 * Flow AI vurgusu: sarılan öğenin etrafında yanıp sönen bir çerçeve çizer ve gerekirse ekranı o öğeye kaydırır.
 * Sarmalanan öğenin davranışını değiştirmez (dokunmayı engellemez). scrollRef/scrollYRef verilirse otomatik kaydırır.
 */
export default function FlowHighlight({ screen, id, children, style, scrollRef, scrollYRef }) {
  const [active, setActive] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const viewRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const off = subscribeHighlight((e) => {
      if (e.screen !== screen) return;
      clearTimeout(timer.current);
      if (e.targetId !== id) { setActive(false); return; }
      setActive(true);
      timer.current = setTimeout(() => setActive(false), SHOW_MS);
      if (scrollRef?.current && viewRef.current?.measureInWindow) {
        setTimeout(() => {
          viewRef.current?.measureInWindow?.((x, y, w, h) => {
            const winH = Dimensions.get('window').height;
            const top = 140;
            if (y < top || y + h > winH - 160) {
              scrollRef.current?.scrollTo?.({ y: Math.max(0, (scrollYRef?.current ?? 0) + y - top), animated: true });
            }
          });
        }, 50);
      }
    });
    return () => { off(); clearTimeout(timer.current); };
  }, [screen, id, scrollRef, scrollYRef]);

  useEffect(() => {
    if (!active) { pulse.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const borderColor = pulse.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,122,89,0.35)', 'rgba(255,122,89,1)'] });

  return (
    <View ref={viewRef} collapsable={false} testID={id} style={style}>
      {children}
      {active && (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', left: -4, right: -4, top: -4, bottom: -4, borderWidth: 3, borderRadius: 18, borderColor }}
        />
      )}
    </View>
  );
}
