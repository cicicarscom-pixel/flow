import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlatformTwitterSettings({ addTweet, removeTweet, selectedPlatforms, setTwCustomCaption, setTwIsThread, t, twCustomCaption, twIsThread, twThreadTweets, updateTweet }) {
  return (
    selectedPlatforms['twitter'] && (
      <View className="mb-4">
         <View className="flex-row items-center mb-3">
           <View className="w-6 h-6 rounded bg-[#000] items-center justify-center mr-2 border border-white/10">
             <Ionicons name="close" size={14} color="#fff" /> {/* Fallback if logo-x is not available, close looks somewhat like X */}
           </View>
           <Text className="text-[#F6F1EC] font-semibold">X (Twitter)</Text>
         </View>
    
         {/* Thread Toggle */}
         <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#A79E96] text-xs font-medium">{t('sosyalMedya.aiUretim.thread')}</Text>
            <TouchableOpacity
               activeOpacity={0.8} onPress={() => setTwIsThread(!twIsThread)}
               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
               accessibilityRole="switch"
               accessibilityLabel="Thread olarak paylaş"
               accessibilityState={{ checked: twIsThread }}
               className={`w-9 h-5 rounded-full px-0.5 justify-center ${twIsThread ? 'bg-[#22B573]' : 'bg-[#A79E96]/50'}`}
            >
               <View className={`w-4 h-4 rounded-full bg-white ${twIsThread ? 'self-end' : 'self-start'}`} />
            </TouchableOpacity>
         </View>
         
         {twIsThread && (
            <View className="mb-4">
               <Text className="text-[#A79E96]/70 text-[10px] mb-3">{t('sosyalMedya.aiUretim.threadHintTweet')}</Text>
               
               {twThreadTweets.map((tweet, index) => (
                  <View key={tweet.id} className="bg-[#2A2631] border border-white/5 rounded-lg p-3 mb-2">
                     <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-[#A79E96] text-xs font-medium text-dashed">{t('sosyalMedya.aiUretim.tweetN', { n: index + 2 })}</Text>
                        <View className="flex-row items-center">
                           <Text className="text-[#A79E96]/50 text-[10px] mr-2">{tweet.content.length}/280</Text>
                           <TouchableOpacity onPress={() => removeTweet(tweet.id)}>
                              <Text className="text-[#F59E0B] text-[10px]">{t('sosyalMedya.aiUretim.remove')}</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                     <TextInput 
                        value={tweet.content} onChangeText={(txt) => updateTweet(tweet.id, txt)}
                        placeholder={`Tweet ${index + 2} content...`} placeholderTextColor="rgba(185, 202, 203, 0.5)"
                        className="text-[#F6F1EC] text-sm mb-3 min-h-[40px] p-0"
                        multiline textAlignVertical="top" maxLength={280}
                     />
                     <TouchableOpacity className="w-8 h-8 rounded border border-dashed border-white/20 items-center justify-center">
                        <Ionicons name="image-outline" size={14} color="#A79E96" />
                     </TouchableOpacity>
                  </View>
               ))}
               
               <TouchableOpacity onPress={addTweet} className="py-2">
                  <Text className="text-[#A79E96] text-xs">{t('sosyalMedya.aiUretim.addTweet', { n: twThreadTweets.length + 2 })}</Text>
               </TouchableOpacity>
            </View>
         )}
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
         <TextInput 
            value={twCustomCaption} onChangeText={setTwCustomCaption}
            placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
            multiline textAlignVertical="top" maxLength={280}
         />
         <Text className="text-[#A79E96]/50 text-[10px] text-right">{twCustomCaption.length}/280</Text>
      </View>
    )
  );
}
