import React from 'react';
import { FlowHighlight } from '../../../../flow_ai';
import { AnimatedBorderCard } from './AnimatedBorderCard';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { VideoView } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';

export function MediaPickerSection({ localImage, mediaType, pickMedia, scrollRef, scrollYRef, t, videoPlayer }) {
  return (
    <FlowHighlight screen="ai_uretim" id="media_picker" scrollRef={scrollRef} scrollYRef={scrollYRef} style={{ width: '100%', alignItems: 'center' }}>
    <AnimatedBorderCard 
      style={{ width: '100%', aspectRatio: 1, maxWidth: 350 }} 
      colors={['#22B573', '#ffffff']} 
      padding={0} 
      borderRadius={24}
    >
      <View 
        className="flex-1 items-center justify-center bg-[#34303C]/50 overflow-hidden relative" 
        style={{ borderRadius: 24 }}
      >
        {localImage ? (
          <>
            {mediaType === 'video' ? (
              <VideoView
                player={videoPlayer}
                style={{ width: '100%', height: '100%' }}
                nativeControls
                contentFit="cover"
              />
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={pickMedia} className="w-full h-full">
                <Image source={{ uri: localImage }} className="w-full h-full" resizeMode="cover" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2 z-10" 
              onPress={pickMedia}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={pickMedia} activeOpacity={0.8} className="w-full h-full items-center justify-center">
            <View className="mb-4 bg-[#22B573]/10 rounded-full p-4 border border-[#22B573]/30 border-dashed">
              <MaterialIcons name="add-photo-alternate" size={48} color="#22B573" />
            </View>
            <Text className="text-[#A79E96] text-base text-center px-4 font-medium mb-1">
              {t('sosyalMedya.generate.selectOrGenerate')}
            </Text>
            <Text className="text-[#A79E96]/60 text-xs text-center px-8">
              {t('sosyalMedya.generate.imageHint')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </AnimatedBorderCard>
    </FlowHighlight>
  );
}
