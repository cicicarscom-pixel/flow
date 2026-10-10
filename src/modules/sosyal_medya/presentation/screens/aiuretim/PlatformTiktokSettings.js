import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformTiktokSettings({ selectedPlatforms, setTtCustomCaption, setTtSaveToInbox, t, ttCustomCaption, ttSaveToInbox }) {
  return (
    selectedPlatforms['tiktok'] && (
      <View className="mb-4 bg-[#2A2631]/50 rounded-xl p-4 border border-[#00f0ff]/30">
         <View className="flex-row items-center mb-4">
           <View className="w-6 h-6 rounded bg-[#000] items-center justify-center mr-2 border border-white/10">
             <Ionicons name="logo-tiktok" size={14} color="#00f0ff" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold text-sm">TikTok</Text>
         </View>
    
         <TouchableOpacity 
           activeOpacity={0.8} 
           onPress={() => setTtSaveToInbox(!ttSaveToInbox)} 
           className="flex-row items-start mb-4 bg-[#201D24]/50 p-3 rounded-lg border border-white/5"
         >
            <View className={`w-4 h-4 rounded border mt-0.5 mr-3 items-center justify-center ${ttSaveToInbox ? 'bg-[#22B573] border-[#22B573]' : 'border-white/20 bg-transparent'}`}>
               {ttSaveToInbox && <MaterialIcons name="check" size={12} color="#1C3327" />}
            </View>
            <View className="flex-1">
              <Text className="text-[#F6F1EC] text-xs font-semibold mb-1">{t('sosyalMedya.aiUretim.tiktokDraft')}</Text>
              <Text className="text-[#A79E96]/80 text-[10px] leading-4">{t('sosyalMedya.aiUretim.tiktokDraftHint')}</Text>
            </View>
         </TouchableOpacity>
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
         <TextInput 
           value={ttCustomCaption} onChangeText={setTtCustomCaption}
           placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           multiline
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 min-h-[60px]"
           maxLength={2200}
         />
         <Text className="text-[#A79E96]/50 text-[10px] text-right mt-1">{ttCustomCaption.length}/2200</Text>
         </View>
      )
  );
}
