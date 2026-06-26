import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function Header({ title }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  return (
    <View 
      className="flex-row items-center justify-between px-4 pb-4"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center">
        <TouchableOpacity className="mr-3">
          <Ionicons name="apps-outline" size={24} color="#e5e2e3" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white tracking-wide">
          {title || "Digital Assistant"}
        </Text>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity className="mr-4">
          <Ionicons name="notifications-outline" size={22} color="#e5e2e3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profil')}>
          <View className="w-8 h-8 rounded-full bg-secondary/30 items-center justify-center border border-secondary/50 overflow-hidden">
            <Image 
              source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alex' }} 
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
