import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlatformPinterestSettingsExtra({ pinBoardId, pinLink, pinTitle, selectedPlatforms, setPinBoardId, setPinLink, setPinTitle }) {
  return (
    selectedPlatforms['pinterest'] && (
      <View className="mb-4">
         <View className="flex-row items-center mb-3">
           <View className="w-6 h-6 rounded bg-[#E60023] items-center justify-center mr-2">
             <Ionicons name="logo-pinterest" size={14} color="#fff" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold">Pinterest</Text>
         </View>
    
         <TextInput value={pinBoardId} onChangeText={setPinBoardId} placeholder="Board ID (Required)" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-2" />
         <TextInput value={pinTitle} onChangeText={setPinTitle} placeholder="Pin Title (Max 100 chars)" placeholderTextColor="rgba(185, 202, 203, 0.5)" maxLength={100} className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-2" />
         <TextInput value={pinLink} onChangeText={setPinLink} placeholder="Destination Link" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1" />
      </View>
    )
  );
}
