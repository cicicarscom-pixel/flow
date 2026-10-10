import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlatformPinterestSettings({ pinCustomCaption, pinLink, pinTitle, selectedPlatforms, setPinCustomCaption, setPinLink, setPinTitle, t }) {
  return (
    selectedPlatforms['pinterest'] && (
      <View className="mb-4 bg-[#2A2631]/50 rounded-xl p-4 border border-[#E60023]/30">
         <View className="flex-row items-center mb-4">
           <View className="w-6 h-6 rounded bg-[#E60023]/10 items-center justify-center mr-2 border border-[#E60023]/20">
             <Ionicons name="logo-pinterest" size={14} color="#E60023" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold text-sm">Pinterest</Text>
         </View>
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.titleOptional')}</Text>
         <TextInput 
           value={pinTitle} onChangeText={setPinTitle}
           placeholder="Pin'iniz için özel bir başlık girin..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1"
         />
         <Text className="text-[#A79E96]/60 text-[10px] mb-4">{t('sosyalMedya.aiUretim.pinterestTitleHint')}</Text>
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.targetLinkOptional')}</Text>
         <TextInput 
           value={pinLink} onChangeText={setPinLink}
           placeholder="https://example.com" placeholderTextColor="rgba(185, 202, 203, 0.5)"
           keyboardType="url"
           autoCapitalize="none"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1"
         />
         <Text className="text-[#A79E96]/60 text-[10px] mb-4">{t('sosyalMedya.aiUretim.pinterestLinkHint')}</Text>
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
         <TextInput 
           value={pinCustomCaption} onChangeText={setPinCustomCaption}
           placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           multiline
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 min-h-[60px]"
           maxLength={500}
         />
         <Text className="text-[#A79E96]/50 text-[10px] text-right mt-1">{pinCustomCaption.length}/500</Text>
      </View>
    )
  );
}
