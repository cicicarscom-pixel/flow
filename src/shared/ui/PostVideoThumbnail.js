import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

/** Video adresi mi? (Image bileşeni video çizemez; küçük resim için ilk kare gösterilir.) */
export const isVideoUrl = (url) =>
  !!url && (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('blob'));

/**
 * Web'deki <video muted playsInline> davranışının mobil karşılığı: `expo-video` oynatıcısı hiç
 * `.play()` edilmez (sessiz/duraklatılmış kalır), native görünüm yine de 0. saniyedeki kareyi gösterir.
 * Tüm Gönderiler ve Gelen Kutusu > Yorumlar küçük resimleri bunu kullanır.
 */
export const PostVideoThumbnail = ({ uri }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
  });

  return (
    <View className="w-full h-full items-center justify-center bg-black border border-white/10 rounded-lg" style={{ overflow: 'hidden' }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      <View style={StyleSheet.absoluteFillObject} className="items-center justify-center bg-black/20">
        <MaterialIcons name="play-arrow" size={24} color="#fff" />
      </View>
    </View>
  );
};
