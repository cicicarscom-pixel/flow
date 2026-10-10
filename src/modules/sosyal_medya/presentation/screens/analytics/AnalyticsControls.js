import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CustomButton } from '../../../../../shared';
import { MaterialIcons } from '@expo/vector-icons';

// Toggle Bar Component
export const TopToggle = ({ activeTab, setActiveTab, t }) => {
  return (
    <View className="flex-row mx-5 mt-4 mb-4 bg-white/5 rounded-xl p-1 border border-white/10">
      <CustomButton 
        className={`flex-1 py-2.5 px-0 rounded-lg ${activeTab === 'posting' ? 'bg-[#22B573]/20 border border-[#22B573]/50' : 'bg-transparent'}`}
        textClassName={`text-[12px] font-bold ${activeTab === 'posting' ? 'text-[#22B573]' : 'text-[#A79E96]'}`}
        title={t('sosyalMedya.analytics.tabs.posting')}
        onPress={() => setActiveTab('posting')}
      />
      <CustomButton 
        className={`flex-1 py-2.5 px-0 rounded-lg ${activeTab === 'inbox' ? 'bg-[#C2478D]/20 border border-[#C2478D]/50' : 'bg-transparent'}`}
        textClassName={`text-[12px] font-bold ${activeTab === 'inbox' ? 'text-[#E8A8CD]' : 'text-[#A79E96]'}`}
        title={t('sosyalMedya.analytics.tabs.inbox')}
        onPress={() => setActiveTab('inbox')}
      />
    </View>
  );
};

// Filter Row Component
export const FilterRow = ({ selectedPlatform, onOpenPlatformSelector, selectedTimeRange, onOpenTimeSelector }) => (
  <View className="flex-row mx-5 mb-4 justify-between">
    <TouchableOpacity 
      onPress={onOpenPlatformSelector}
      className="flex-row items-center bg-white/5 px-3 py-1.5 rounded border border-white/10"
    >
      <Text className="text-[10px] text-[#F6F1EC] mr-1">{selectedPlatform.name}</Text>
      <MaterialIcons name="keyboard-arrow-down" size={14} color="#A79E96" />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={onOpenTimeSelector}
      className="flex-row items-center bg-white/5 px-3 py-1.5 rounded border border-white/10"
    >
      <Text className="text-[10px] text-[#F6F1EC] mr-1">{selectedTimeRange.name}</Text>
      <MaterialIcons name="keyboard-arrow-down" size={14} color="#A79E96" />
    </TouchableOpacity>
  </View>
);
