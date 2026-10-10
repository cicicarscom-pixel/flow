import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformYoutubeSettings({ selectedPlatforms, setYtCategoryModalVisible, setYtCustomCaption, setYtTags, setYtTitle, setYtVisibility, t, ytCategory, ytCustomCaption, ytTags, ytTitle, ytVisibility }) {
  return (
    selectedPlatforms['youtube'] && (
      <View className="mb-6 bg-[#2A2631]/50 rounded-xl p-4 border border-[#ff0000]/30">
        <View className="flex-row items-center mb-4">
           <Ionicons name="logo-youtube" size={20} color="#ff0000" className="mr-2" />
           <Text className="text-[#F6F1EC] text-sm font-semibold ml-2">YouTube</Text>
        </View>
        
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.titleOptional')}</Text>
        <TextInput 
           value={ytTitle} onChangeText={setYtTitle}
           placeholder="Custom title for your video..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1"
           maxLength={100}
        />
        <Text className="text-[#A79E96]/50 text-[10px] text-right mb-2">{ytTitle.length}/100</Text>
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.tagsOptional')}</Text>
        <TextInput 
           value={ytTags} onChangeText={setYtTags}
           placeholder="Type a tag and press Enter..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-4"
        />
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.visibility')}</Text>
        <View className="flex-row rounded-lg border border-white/5 mb-4 overflow-hidden">
           {['Public', 'Unlisted', 'Private'].map((opt) => (
             <TouchableOpacity 
                key={opt}
                onPress={() => setYtVisibility(opt)}
                className={`flex-1 items-center py-2 border-r border-white/5 ${ytVisibility === opt ? 'bg-[#34303C]' : 'bg-[#201D24]/50'}`}
             >
                <Text className={`text-[13px] ${ytVisibility === opt ? 'text-white' : 'text-[#A79E96]'}`}>{opt}</Text>
                <Text className="text-[#A79E96]/50 text-[10px]">{opt === 'Public' ? 'Anyone' : opt === 'Unlisted' ? 'Link only' : 'Only you'}</Text>
             </TouchableOpacity>
           ))}
        </View>
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.category')}</Text>
        <TouchableOpacity 
           onPress={() => setYtCategoryModalVisible(true)}
           className="flex-row items-center justify-between bg-[#201D24]/50 rounded-lg border border-white/5 px-3 py-3 mb-4"
        >
           <Text className="text-[#F6F1EC] text-sm">{ytCategory}</Text>
           <MaterialIcons name="keyboard-arrow-down" size={18} color="#A79E96" />
        </TouchableOpacity>
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
        <TextInput 
           value={ytCustomCaption} onChangeText={setYtCustomCaption}
           placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 min-h-[80px]"
           multiline textAlignVertical="top" maxLength={5000}
        />
        <Text className="text-[#A79E96]/50 text-[10px] text-right mt-1">{ytCustomCaption.length}/5000</Text>
      </View>
    )
  );
}
