import React from 'react';
import { FlowHighlight } from '../../../../flow_ai';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function PlatformSelectorSection({ handlePlatformToggle, navigation, scrollRef, scrollYRef, selectedPlatforms, t, zernioAccounts }) {
  return (
    <FlowHighlight screen="ai_uretim" id="platform_selector" scrollRef={scrollRef} scrollYRef={scrollYRef} style={{ marginTop: 24, marginBottom: 24 }}>
    <View>
      <Text className="text-[#A79E96] text-xs font-medium mb-3">{t('sosyalMedya.aiUretim.connectedAccounts')}</Text>
      
      {zernioAccounts.length === 0 ? (
        <View className="items-center p-4 bg-[#2A2631]/30 rounded-lg border border-white/5">
          <Text className="text-[#A79E96]/70 text-xs mb-2">{t('sosyalMedya.aiUretim.noAccounts')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SosyalMedya')}>
            <Text className="text-[#22B573] text-xs font-medium">{t('sosyalMedya.aiUretim.connectAccount')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
        {zernioAccounts.map((acc, index) => {
          const isSelected = selectedPlatforms[acc.platform];
          const platformId = acc.platform.toLowerCase();
          const platformColor = platformId === 'instagram' ? '#C2478D' : 
                                platformId === 'facebook' ? '#1877F2' : 
                                platformId === 'youtube' ? '#ff0000' : 
                                platformId === 'twitter' ? '#1DA1F2' : 
                                platformId === 'linkedin' ? '#0A66C2' : 
                                platformId === 'bluesky' ? '#0085ff' : 
                                platformId.includes('google') ? '#4285F4' : '#A79E96';
          
          let iconName = `logo-${platformId}`;
          if (platformId === 'twitter' || platformId === 'x') iconName = 'close';
          else if (platformId === 'telegram') iconName = 'paper-plane';
          else if (platformId === 'bluesky') iconName = 'cloud';
          else if (platformId === 'threads') iconName = 'at';
          else if (platformId.includes('google')) iconName = 'business';
    
          return (
            <TouchableOpacity 
              key={index}
              onPress={() => handlePlatformToggle(acc.platform)}
              className={`flex-row items-center justify-between rounded-lg border p-3 mb-3 w-[48%] ${isSelected ? 'bg-[#22B573]/10 border-[#22B573]/50' : 'bg-[#2A2631]/50 border-white/5'}`}
            >
              <View className="flex-row items-center flex-1 overflow-hidden">
                 <Ionicons name={iconName} size={18} color={platformColor} style={{ marginRight: 8 }} />
                 <View className="flex-1 overflow-hidden">
                   <Text className="text-[#F6F1EC] text-[12px] capitalize font-semibold" numberOfLines={1}>{acc.platform}</Text>
                   <Text className="text-[#A79E96]/60 text-[10px]" numberOfLines={1}>@{acc.username || 'hesap'}</Text>
                 </View>
              </View>
              {isSelected && (
                 <View className="w-4 h-4 rounded-full bg-[#22B573] items-center justify-center ml-2 shrink-0">
                    <MaterialIcons name="check" size={12} color="#1C3327" />
                 </View>
              )}
            </TouchableOpacity>
          );
        })}
        </View>
      )}
    </View>
    </FlowHighlight>
  );
}
