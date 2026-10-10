import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformRedditSettings({ redditNsfw, redditSendReplies, redditSpoiler, redditSubreddit, redditTitle, selectedPlatforms, setRedditNsfw, setRedditSendReplies, setRedditSpoiler, setRedditSubreddit, setRedditTitle, t }) {
  return (
    selectedPlatforms['reddit'] && (
      <View className="mb-4">
         <View className="flex-row items-center mb-3">
           <View className="w-6 h-6 rounded bg-[#FF4500] items-center justify-center mr-2">
             <Ionicons name="logo-reddit" size={14} color="#fff" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold">Reddit</Text>
         </View>
    
         <View className="flex-row space-x-2 mb-2">
           <View className="flex-row items-center bg-[#201D24]/50 border border-white/5 rounded-lg px-3 py-2 flex-1 mr-2">
             <Text className="text-[#A79E96] mr-1">r/</Text>
             <TextInput value={redditSubreddit} onChangeText={setRedditSubreddit} placeholder="subreddit" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="text-[#F6F1EC] text-sm flex-1 p-0" />
           </View>
           <TextInput value={redditTitle} onChangeText={setRedditTitle} placeholder="Post Title" placeholderTextColor="rgba(185, 202, 203, 0.5)" className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 flex-1" />
         </View>
    
         <View className="flex-row mt-2">
            <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditNsfw(!redditNsfw)} className="flex-row items-center mr-4">
               <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditNsfw ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                  {redditNsfw && <MaterialIcons name="check" size={12} color="#fff" />}
               </View>
               <Text className="text-[#F6F1EC] text-xs">NSFW</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditSpoiler(!redditSpoiler)} className="flex-row items-center mr-4">
               <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditSpoiler ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                  {redditSpoiler && <MaterialIcons name="check" size={12} color="#fff" />}
               </View>
               <Text className="text-[#F6F1EC] text-xs">{t('sosyalMedya.aiUretim.spoiler')}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setRedditSendReplies(!redditSendReplies)} className="flex-row items-center">
               <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${redditSendReplies ? 'bg-[#FF4500] border-[#FF4500]' : 'border-[#A79E96]/50 bg-transparent'}`}>
                  {redditSendReplies && <MaterialIcons name="check" size={12} color="#fff" />}
               </View>
               <Text className="text-[#F6F1EC] text-xs">{t('sosyalMedya.aiUretim.inboxReplies')}</Text>
            </TouchableOpacity>
         </View>
      </View>
    )
  );
}
