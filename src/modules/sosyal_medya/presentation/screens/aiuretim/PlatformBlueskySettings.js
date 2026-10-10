import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

export function PlatformBlueskySettings({ bskyCustomCaption, bskyIsThread, selectedPlatforms, setBskyCustomCaption, setBskyIsThread, t }) {
  return (
    selectedPlatforms['bluesky'] && (
      <View className="mb-4 bg-[#2A2631]/50 rounded-xl p-4 border border-[#0085ff]/30">
         <View className="flex-row items-center mb-4">
           <Text style={{ fontSize: 18, marginRight: 8 }}>☁️</Text>
           <Text className="text-[#F6F1EC] font-semibold text-sm">Bluesky</Text>
         </View>
    
         {/* Thread Toggle */}
         <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#A79E96] text-xs font-medium">{t('sosyalMedya.aiUretim.thread')}</Text>
            <TouchableOpacity
               activeOpacity={0.8} onPress={() => setBskyIsThread(!bskyIsThread)}
               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
               accessibilityRole="switch"
               accessibilityLabel="Thread olarak paylaş"
               accessibilityState={{ checked: bskyIsThread }}
               className={`w-9 h-5 rounded-full px-0.5 justify-center ${bskyIsThread ? 'bg-[#22B573]' : 'bg-[#A79E96]/50'}`}
            >
               <View className={`w-4 h-4 rounded-full bg-white ${bskyIsThread ? 'self-end' : 'self-start'}`} />
            </TouchableOpacity>
         </View>
         {bskyIsThread && (
            <Text className="text-[#A79E96]/70 text-[10px] mb-4">{t('sosyalMedya.aiUretim.threadHintPost')}</Text>
         )}
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
         <TextInput
            value={bskyCustomCaption} onChangeText={setBskyCustomCaption}
            placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
            multiline textAlignVertical="top" maxLength={300}
         />
         <Text className="text-[#A79E96]/50 text-[10px] text-right">{bskyCustomCaption.length}/300</Text>
      </View>
    )
  );
}
