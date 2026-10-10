import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformLinkedinSettings({ liCustomCaption, liDisableLinkPreview, liFirstComment, liMentionDisplayName, liMentionUsername, liRepostLink, selectedPlatforms, setLiCustomCaption, setLiDisableLinkPreview, setLiFirstComment, setLiMentionDisplayName, setLiMentionUsername, setLiRepostLink, setShowLiMentionTooltip, setShowLiRepostTooltip, showLiMentionTooltip, showLiRepostTooltip, t }) {
  return (
    selectedPlatforms['linkedin'] && (
      <View className="mb-4">
         <View className="flex-row items-center mb-3">
           <View className="w-6 h-6 rounded bg-[#0A66C2] items-center justify-center mr-2">
             <Ionicons name="logo-linkedin" size={14} color="#fff" />
           </View>
           <Text className="text-[#F6F1EC] font-semibold">LinkedIn</Text>
         </View>
    
         {/* Mention section */}
         <View className="flex-row items-center mb-1 z-20">
            <Text className="text-[#A79E96] text-xs font-medium mr-1">@mention</Text>
            <TouchableOpacity onPress={() => setShowLiMentionTooltip(!showLiMentionTooltip)}>
               <MaterialIcons name="info-outline" size={14} color="#A79E96" />
            </TouchableOpacity>
         </View>
         {showLiMentionTooltip && (
            <View className="bg-[#2A2631] border border-white/10 rounded-lg p-3 mb-2 z-20">
               <Text className="text-white text-[11px] mb-2 leading-4">
                 {t('sosyalMedya.aiUretim.liMentionTip1')}
               </Text>
               <Text className="text-white text-[11px] mb-2 leading-4">
                 {t('sosyalMedya.aiUretim.liMentionTip2')}
               </Text>
               <Text className="text-white text-[11px] leading-4">
                 {t('sosyalMedya.aiUretim.liMentionTip3')}
               </Text>
            </View>
         )}
         <View className="flex-row mb-3 space-x-2">
            <TextInput 
              value={liMentionUsername} onChangeText={setLiMentionUsername}
              placeholder="username or profile URL" placeholderTextColor="rgba(185, 202, 203, 0.5)"
              className="flex-1 bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mr-2"
            />
            <TextInput 
              value={liMentionDisplayName} onChangeText={setLiMentionDisplayName}
              placeholder="display name" placeholderTextColor="rgba(185, 202, 203, 0.5)"
              className="flex-1 bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mr-2"
            />
            <TouchableOpacity
              onPress={() => {
                const mentionLabel = (liMentionDisplayName || liMentionUsername || '').trim();
                if (!mentionLabel) return;
                setLiCustomCaption((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@${mentionLabel} `);
                setLiMentionUsername('');
                setLiMentionDisplayName('');
              }}
              disabled={!liMentionUsername && !liMentionDisplayName}
              className={`px-3 py-2 rounded-lg items-center justify-center ${(liMentionUsername || liMentionDisplayName) ? 'bg-[#A79E96]/20' : 'bg-[#A79E96]/10'}`}
              accessibilityRole="button"
              accessibilityLabel="Etiketi metne ekle"
            >
              <Text className={`text-xs font-medium ${(liMentionUsername || liMentionDisplayName) ? 'text-white' : 'text-[#A79E96]/50'}`}>{t('sosyalMedya.aiUretim.insert')}</Text>
            </TouchableOpacity>
         </View>
    
         {/* Repost section */}
         <View className="flex-row items-center mb-1 z-10 mt-2">
            <Text className="text-[#A79E96] text-xs font-medium mr-1">{t('sosyalMedya.aiUretim.repostLinkedIn')}</Text>
            <TouchableOpacity onPress={() => setShowLiRepostTooltip(!showLiRepostTooltip)}>
               <MaterialIcons name="info-outline" size={14} color="#A79E96" />
            </TouchableOpacity>
         </View>
         {showLiRepostTooltip && (
            <View className="bg-[#2A2631] border border-white/10 rounded-lg p-3 mb-2 z-10">
               <Text className="text-white text-[11px] mb-2 leading-4">
                 {t('sosyalMedya.aiUretim.liRepostTip1')}
               </Text>
               <Text className="text-white text-[11px] leading-4">
                 {t('sosyalMedya.aiUretim.liRepostTip2')}
               </Text>
            </View>
         )}
         <TextInput 
            value={liRepostLink} onChangeText={setLiRepostLink}
            placeholder="Paste the post link" placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-4"
         />
    
         {/* Disable link preview */}
         <TouchableOpacity 
            activeOpacity={0.8} onPress={() => setLiDisableLinkPreview(!liDisableLinkPreview)}
            className="flex-row items-center mb-4"
         >
            <View className={`w-4 h-4 rounded-sm border mr-2 items-center justify-center ${liDisableLinkPreview ? 'bg-[#22B573] border-[#22B573]' : 'border-[#A79E96]/50 bg-transparent'}`}>
               {liDisableLinkPreview && <MaterialIcons name="check" size={12} color="#1C3327" />}
            </View>
            <Text className="text-[#F6F1EC] text-[13px]">{t('sosyalMedya.aiUretim.disableLinkPreview')}</Text>
         </TouchableOpacity>
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1 mt-2">{t('sosyalMedya.aiUretim.firstCommentOptional')}</Text>
         <TextInput 
            value={liFirstComment} onChangeText={setLiFirstComment}
            placeholder="Add a İlk Yorum (Opsiyonel) to boost engagement." placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
            multiline textAlignVertical="top" maxLength={1250}
         />
         <Text className="text-[#A79E96]/50 text-[10px] text-right mb-4">{liFirstComment.length}/1250</Text>
    
         <Text className="text-[#A79E96] text-xs font-medium mb-1">{t('sosyalMedya.aiUretim.customCaptionOptional')}</Text>
         <TextInput 
            value={liCustomCaption} onChangeText={setLiCustomCaption}
            placeholder="Ana metni kullanmak için boş bırakın..." placeholderTextColor="rgba(185, 202, 203, 0.5)"
            className="bg-[#201D24]/50 border border-white/5 rounded-lg text-[#F6F1EC] text-sm px-3 py-2 mb-1 min-h-[60px]"
            multiline textAlignVertical="top" maxLength={3000}
         />
         <Text className="text-[#A79E96]/50 text-[10px] text-right">{liCustomCaption.length}/3000</Text>
      </View>
    )
  );
}
