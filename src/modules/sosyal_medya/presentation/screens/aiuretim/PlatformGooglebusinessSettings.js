import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlatformGooglebusinessSettings({ gbpCallToAction, gbpCtaUrl, gbpEventEndDate, gbpEventStartDate, gbpEventTitle, gbpPostType, selectedPlatforms, setGbpCallToAction, setGbpCtaUrl, setGbpEventEndDate, setGbpEventStartDate, setGbpEventTitle, setGbpPostType, t }) {
  return (
    selectedPlatforms['googlebusiness'] && (
      <View className="mb-4">
         <View className="flex-row items-center mb-3">
           <View className="w-6 h-6 rounded bg-[#4285F4] items-center justify-center mr-2">
             <Ionicons name="business" size={14} color="#fff" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold">Google Business</Text>
         </View>
    
         <View className="flex-row mb-3 bg-[#2A2631] rounded-lg p-1 border border-white/5">
            {['STANDARD', 'EVENT', 'OFFER'].map(type => (
              <TouchableOpacity 
                key={type} onPress={() => setGbpPostType(type)}
                className={`flex-1 py-1.5 rounded justify-center items-center ${gbpPostType === type ? 'bg-[#4285F4]' : 'bg-transparent'}`}
              >
                <Text className={`text-[11px] font-medium ${gbpPostType === type ? 'text-white' : 'text-[#A79E96]'}`}>{type}</Text>
              </TouchableOpacity>
            ))}
         </View>
    
         {(gbpPostType === 'STANDARD' || gbpPostType === 'EVENT') && (
           <View className="mb-3">
             <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.callToAction')}</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
                {['NONE', 'LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL'].map(cta => (
                  <TouchableOpacity 
                    key={cta} onPress={() => setGbpCallToAction(cta)}
                    className={`px-3 py-1.5 rounded-lg border mr-2 ${gbpCallToAction === cta ? 'bg-[#4285F4]/10 border-[#4285F4]' : 'bg-[#2A2631] border-white/10'}`}
                  >
                    <Text className={`text-[10px] ${gbpCallToAction === cta ? 'text-[#4285F4]' : 'text-[#A79E96]'}`}>
                      {cta.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
             {gbpCallToAction !== 'NONE' && gbpCallToAction !== 'CALL' && (
                <TextInput 
                  value={gbpCtaUrl} onChangeText={setGbpCtaUrl}
                  placeholder="https://..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
                  className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2"
                />
             )}
           </View>
         )}
    
         {gbpPostType === 'EVENT' && (
           <View className="mb-2 bg-[#2A2631]/30 p-2 rounded-lg border border-white/5">
              <Text className="text-[#A79E96] text-[10px] font-medium mb-1">{t('sosyalMedya.aiUretim.eventDetails')}</Text>
              <TextInput value={gbpEventTitle} onChangeText={setGbpEventTitle} placeholder="Event Title" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded text-[#F6F1EC] text-xs px-2 py-1.5 mb-2" />
              <View className="flex-row space-x-2">
                <TextInput value={gbpEventStartDate} onChangeText={setGbpEventStartDate} placeholder="Start YYYY-MM-DD" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="flex-1 bg-[#201D24]/50 border border-white/5 rounded text-[#F6F1EC] text-xs px-2 py-1.5 mr-1" />
                <TextInput value={gbpEventEndDate} onChangeText={setGbpEventEndDate} placeholder="End YYYY-MM-DD" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="flex-1 bg-[#201D24]/50 border border-white/5 rounded text-[#F6F1EC] text-xs px-2 py-1.5" />
              </View>
           </View>
         )}
      </View>
    )
  );
}
