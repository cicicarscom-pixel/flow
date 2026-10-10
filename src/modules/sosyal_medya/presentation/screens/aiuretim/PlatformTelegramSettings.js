import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformTelegramSettings({ selectedPlatforms, setTgChatId, setTgDisableNotification, t, tgChatId, tgDisableNotification }) {
  return (
    selectedPlatforms['telegram'] && (
      <View className="mb-4">
         <View className="flex-row items-center mb-3">
           <View className="w-6 h-6 rounded bg-[#2AABEE] items-center justify-center mr-2">
             <Ionicons name="paper-plane" size={14} color="#fff" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold">Telegram</Text>
         </View>
    
         <TextInput value={tgChatId} onChangeText={setTgChatId} placeholder="@channelname or Chat ID" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-2" />
         
         <TouchableOpacity activeOpacity={0.8} onPress={() => setTgDisableNotification(!tgDisableNotification)} className="flex-row items-center mb-1">
            <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${tgDisableNotification ? 'bg-[#2AABEE] border-[#2AABEE]' : 'border-[#A79E96]/50 bg-transparent'}`}>
               {tgDisableNotification && <MaterialIcons name="check" size={12} color="#fff" />}
            </View>
            <Text className="text-[#F6F1EC] text-xs">{t('sosyalMedya.aiUretim.sendSilently')}</Text>
         </TouchableOpacity>
      </View>
    )
  );
}
