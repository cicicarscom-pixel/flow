import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformInstagramSettings({ igAiLabel, igCustomCaption, igFirstComment, igFormat, selectedPlatforms, setIgAiLabel, setIgCustomCaption, setIgFirstComment, setIgFormat, t }) {
  return (
    selectedPlatforms['instagram'] && (
      <View className="mb-6 bg-[#2A2631]/50 rounded-xl p-4 border border-[#C2478D]/30">
        <View className="flex-row items-center justify-between mb-4">
           <View className="flex-row items-center">
             <Ionicons name="logo-instagram" size={20} color="#C2478D" className="mr-2" />
             <Text className="text-[#F6F1EC] text-sm font-semibold ml-2">Instagram</Text>
           </View>
           <View className="flex-row bg-[#201D24]/50 rounded-lg overflow-hidden border border-white/5">
             {['Feed', 'Story', 'Reel', 'Carousel'].map((opt) => (
               <TouchableOpacity 
                  key={opt} onPress={() => setIgFormat(opt)}
                  className={`px-2 py-1 border-r border-white/5 ${igFormat === opt ? 'bg-[#34303C]' : ''}`}
               >
                 <Text className={`text-[10px] ${igFormat === opt ? 'text-white' : 'text-[#A79E96]'}`}>{opt}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>
    
        <Text className="text-[#A79E96]/70 text-[11px] mb-4">{t('sosyalMedya.aiUretim.storyNoticeText')}</Text>
    
        <TouchableOpacity 
           onPress={() => setIgAiLabel(!igAiLabel)}
           className="flex-row items-start mb-4"
        >
           <View className={`w-4 h-4 rounded-sm border mr-3 items-center justify-center mt-1 ${igAiLabel ? 'bg-[#22B573] border-[#22B573]' : 'border-[#A79E96]/50 bg-transparent'}`}>
              {igAiLabel && <MaterialIcons name="check" size={12} color="#1C3327" />}
           </View>
           <View className="flex-1">
             <Text className="text-[#F6F1EC] text-[13px] font-medium">{t('sosyalMedya.aiUretim.markAsAi')}</Text>
             <Text className="text-[#A79E96]/70 text-[11px] mt-1">{t('sosyalMedya.aiUretim.markAsAiHint')}</Text>
           </View>
        </TouchableOpacity>
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.firstCommentOptional')}</Text>
        <TextInput 
           value={igFirstComment} onChangeText={setIgFirstComment}
           placeholder="İlk yoruma eklemek istediğiniz bağlantı veya notu girin..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
           multiline textAlignVertical="top" maxLength={2200}
        />
        <Text className="text-[#A79E96]/50 text-[10px] text-right mb-4">{igFirstComment.length}/2200</Text>
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
        <TextInput 
           value={igCustomCaption} onChangeText={setIgCustomCaption}
           placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
           multiline textAlignVertical="top" maxLength={2200}
        />
        <Text className="text-[#A79E96]/50 text-[10px] text-right">{igCustomCaption.length}/2200</Text>
      </View>
    )
  );
}
