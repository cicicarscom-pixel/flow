/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './botStyles';
import { Ionicons } from '@expo/vector-icons';

export function BusinessModulesCard({ navigation }) {
  return (
    <View style={styles.glassCard} className="p-4 mb-4">
      <View className="space-y-3">
        <TouchableOpacity 
          onPress={() => navigation.navigate('RandevuMain')}
          style={{ backgroundColor: 'rgba(34, 181, 115, 0.1)', borderColor: 'rgba(34, 181, 115, 0.3)', borderWidth: 1 }}
          className="flex-row items-center justify-between p-3.5 rounded-xl mb-3"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="calendar-outline" size={18} color="#22B573" />
            <Text className="text-xs text-[#22B573] font-semibold">Ai Randevu Yönetimi</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color="#22B573" />
        </TouchableOpacity>
    
        <TouchableOpacity 
          onPress={() => navigation.navigate('HizmetAyarlari')}
          style={{ backgroundColor: 'rgba(0, 162, 255, 0.1)', borderColor: 'rgba(0, 162, 255, 0.3)', borderWidth: 1 }}
          className="flex-row items-center justify-between p-3.5 rounded-xl mb-3"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="briefcase-outline" size={18} color="#FF7A59" />
            <Text className="text-xs text-[#FF7A59] font-semibold">Ai İşletme Hizmetleri</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color="#FF7A59" />
        </TouchableOpacity>
    
        <TouchableOpacity 
          onPress={() => navigation.navigate('Musteriler')}
          style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', borderWidth: 1 }}
          className="flex-row items-center justify-between p-3.5 rounded-xl"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="people-outline" size={18} color="#a855f7" />
            <Text className="text-xs text-[#a855f7] font-semibold">Müşteriler</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color="#a855f7" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
