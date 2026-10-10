import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function PublishingSection({ publishMode, scheduleDate, setPublishMode, setScheduleDate, setTimezoneModalVisible, t, timezone }) {
  return (
    <View className="mb-6">
      <Text className="text-[#A79E96] text-xs font-medium mb-3">{t('sosyalMedya.aiUretim.publishing')}</Text>
      <View className="flex-row bg-[#2A2631]/50 rounded-lg p-1 mb-4 border border-white/5">
         <TouchableOpacity 
           onPress={() => setPublishMode('schedule')}
           className={`flex-1 items-center py-2 rounded-md ${publishMode === 'schedule' ? 'bg-[#34303C]' : ''}`}
         >
           <Text className={`text-sm ${publishMode === 'schedule' ? 'text-white' : 'text-[#A79E96]'}`}>{t('sosyalMedya.aiUretim.scheduled')}</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           onPress={() => setPublishMode('now')}
           className={`flex-1 items-center py-2 rounded-md ${publishMode === 'now' ? 'bg-[#34303C]' : ''}`}
         >
           <Text className={`text-sm ${publishMode === 'now' ? 'text-white' : 'text-[#A79E96]'}`}>{t('sosyalMedya.aiUretim.now')}</Text>
         </TouchableOpacity>
      </View>
    
      {publishMode === 'schedule' && (
        <>
          <Text className="text-[#A79E96] text-xs font-medium mb-2">{t('sosyalMedya.aiUretim.dateTimeFormat')}</Text>
          <View className="flex-row items-center justify-between bg-[#2A2631]/50 rounded-lg border border-white/5 p-3 mb-4">
             <TextInput
               value={scheduleDate}
               onChangeText={setScheduleDate}
               placeholder="16.08.2026 16:26"
               placeholderTextColor="#A79E96"
               className="flex-1 text-[#F6F1EC] text-sm"
               accessibilityLabel="Paylaşım tarihi ve saati"
             />
             <MaterialIcons name="calendar-today" size={18} color="#A79E96" />
          </View>
    
          <Text className="text-[#A79E96] text-xs font-medium mb-2">{t('sosyalMedya.aiUretim.timezone')}</Text>
          <TouchableOpacity 
            onPress={() => setTimezoneModalVisible(true)}
            className="flex-row items-center justify-between bg-[#2A2631]/50 rounded-lg border border-white/5 p-3 mb-4"
          >
             <Text className="text-[#F6F1EC] text-sm">{timezone}</Text>
             <MaterialIcons name="keyboard-arrow-down" size={20} color="#A79E96" />
          </TouchableOpacity>
        </>
      )}
    
      <View className="bg-[#22B573]/10 rounded-lg border border-[#22B573]/20 p-4 flex-row items-center mt-2">
        <MaterialIcons name="info-outline" size={20} color="#22B573" className="mr-3" />
        <Text className="text-[#F6F1EC] text-xs flex-1 ml-2">
          {publishMode === 'now' 
            ? "Gönderi, seçilen tüm platformlarda anında yayınlanacaktır."
            : "Gönderi taslak olarak kaydedilecek ve planlanan zamanda yayınlanacaktır."}
        </Text>
      </View>
    </View>
  );
}
