import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlatformFacebookSettings({ fbCustomCaption, fbFirstComment, fbFormat, selectedPlatforms, setFbCustomCaption, setFbFirstComment, setFbFormat, t }) {
  return (
    selectedPlatforms['facebook'] && (
      <View className="mb-6 bg-[#2A2631]/50 rounded-xl p-4 border border-[#1877F2]/30">
        <View className="flex-row items-center justify-between mb-4">
           <View className="flex-row items-center">
             <Ionicons name="logo-facebook" size={20} color="#1877F2" className="mr-2" />
             <Text className="text-[#F6F1EC] text-sm font-semibold ml-2">Facebook</Text>
           </View>
           <View className="flex-row bg-[#201D24]/50 rounded-lg overflow-hidden border border-white/5">
             {['Feed', 'Story', 'Reel'].map((opt) => (
               <TouchableOpacity 
                  key={opt} onPress={() => setFbFormat(opt)}
                  className={`px-2 py-1 border-r border-white/5 ${fbFormat === opt ? 'bg-[#34303C]' : ''}`}
               >
                 <Text className={`text-[10px] ${fbFormat === opt ? 'text-white' : 'text-[#A79E96]'}`}>{opt}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>
    
        {fbFormat === 'Story' && (
           <Text className="text-[#A79E96]/70 text-[11px] mb-4">{t('sosyalMedya.aiUretim.storyNoticeMedia')}</Text>
        )}
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.firstCommentOptional')}</Text>
        <TextInput 
           value={fbFirstComment} onChangeText={setFbFirstComment}
           placeholder="İlk yoruma eklemek istediğiniz bağlantı veya notu girin..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
           multiline textAlignVertical="top" maxLength={8000}
        />
        <Text className="text-[#A79E96]/50 text-[10px] text-right mb-4">{fbFirstComment.length}/8000</Text>
    
        <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
        <TextInput 
           value={fbCustomCaption} onChangeText={setFbCustomCaption}
           placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
           className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
           multiline textAlignVertical="top" maxLength={63206}
        />
        <Text className="text-[#A79E96]/50 text-[10px] text-right">{fbCustomCaption.length}/63206</Text>
      </View>
    )
  );
}
