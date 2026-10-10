/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './botStyles';
import { Ionicons } from '@expo/vector-icons';

export function IntegrationsCard({ connectedFolderId, handleRefreshQr, isWhatsAppConnected, setDriveModalVisible, setWhatsappModalVisible }) {
  return (
    <View style={styles.glassCard} className="p-4 mb-4 mt-2">
      <Text className="text-white text-sm font-bold mb-3">Bağlı Servisler</Text>
      
      {/* Google Drive Compact Item */}
      <View className="flex-row items-center justify-between mb-3 bg-black/20 p-3 rounded-xl border border-white/5">
         <View className="flex-row items-center gap-3">
           <Ionicons name="logo-google" size={20} color={connectedFolderId ? "#22B573" : "#A79E96"} />
           <View>
             <Text className="text-xs font-semibold text-white">Google Drive (Bilgi Bankası)</Text>
             <Text className="text-[10px] text-gray-400">{connectedFolderId ? '🟢 Bağlı ve güncel' : '🔴 Bağlı değil'}</Text>
           </View>
         </View>
         <TouchableOpacity onPress={() => setDriveModalVisible(true)} className="bg-white/10 px-4 py-1.5 rounded-full">
           <Text className="text-white text-[10px] font-bold">{connectedFolderId ? 'Yönet' : 'Bağla'}</Text>
         </TouchableOpacity>
      </View>
    
      {/* WhatsApp Compact Item */}
      <View className="flex-row items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
         <View className="flex-row items-center gap-3">
           <Ionicons name="logo-whatsapp" size={20} color={isWhatsAppConnected ? "#25D366" : "#A79E96"} />
           <View>
             <Text className="text-xs font-semibold text-white">WhatsApp</Text>
             <Text className="text-[10px] text-gray-400">{isWhatsAppConnected ? '🟢 WhatsApp bağlı' : '🔴 Bağlı değil'}</Text>
           </View>
         </View>
         <TouchableOpacity onPress={() => { setWhatsappModalVisible(true); if(!isWhatsAppConnected) handleRefreshQr(); }} className="bg-white/10 px-4 py-1.5 rounded-full">
           <Text className="text-white text-[10px] font-bold">{isWhatsAppConnected ? 'Yönet' : 'Bağla'}</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}
