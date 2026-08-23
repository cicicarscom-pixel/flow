/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommunicationLogs } from '../hooks/useCommunicationLogs';

export const CommunicationLogsTable = () => {
  const { logs, loading, clearLogs } = useCommunicationLogs();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <View className="mt-3 mb-4">
        <TouchableOpacity 
          className="bg-[#1A1D26] border border-[#3B82F6]/50 rounded-xl overflow-hidden py-4 px-6 items-center flex-row justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#3B82F6" className="mr-3" />
          <View>
            <Text className="text-white text-sm font-bold">İletişim Raporları</Text>
            <Text className="text-white/50 text-xs mt-1">Henüz bir iletişim geçmişi bulunmuyor.</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    const isWhatsApp = item.platform === 'whatsapp';
    const bgColor = index % 2 === 0 ? 'bg-white/5' : 'bg-transparent';
    const iconName = isWhatsApp ? 'logo-whatsapp' : 'logo-instagram';
    const iconColor = isWhatsApp ? '#25D366' : '#E1306C';

    return (
      <View key={item.id} className={`p-3 border-b border-white/5 ${bgColor}`}>
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name={iconName} size={14} color={iconColor} />
            <Text className="text-[10px] text-white/40 uppercase tracking-wider">
              {(item.sender_name || item.sender_id).substring(0, 15)}...
            </Text>
          </View>
          <Text className="text-[9px] text-white/30">
            {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text className="text-white/80 text-xs mb-1.5" numberOfLines={2}>
          <Text className="font-bold">Soru: </Text>{item.user_message}
        </Text>
        <Text className="text-[#22C55E]/80 text-xs" numberOfLines={2}>
          <Text className="font-bold">Yanıt: </Text>{item.ai_response}
        </Text>
      </View>
    );
  };

  return (
    <View className="bg-[#12141B] border border-white/10 rounded-xl overflow-hidden mt-3 max-h-[350px]">
      <View className="bg-black/40 p-3 border-b border-white/5">
        <Text className="text-white/80 text-xs font-bold uppercase tracking-wider">
          <Ionicons name="list" size={12} color="#ffffff" /> İletişim Raporları
        </Text>
      </View>
      <ScrollView 
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {logs.map((item, index) => renderItem({ item, index }))}
      </ScrollView>
      {/* Clear Logs Button */}
      <TouchableOpacity 
        onPress={clearLogs}
        className="bg-black/40 p-3 border-t border-white/5 items-center justify-center flex-row"
      >
        <Ionicons name="trash-outline" size={14} color="#EF4444" className="mr-2" />
        <Text className="text-[#EF4444] text-xs font-bold uppercase tracking-wider ml-1">
          Raporları Temizle
        </Text>
      </TouchableOpacity>
    </View>
  );
};
