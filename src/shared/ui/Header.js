import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function Header({ title }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  return (
    <View style={{ paddingTop: insets.top }}>
      <View 
        className="flex-row items-center justify-between px-4"
        style={{ height: 64 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-3">
            <Ionicons name="apps-outline" size={24} color="#e5e2e3" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white tracking-wide">
            {title || "Digital Assistant"}
          </Text>
        </View>
        <View className="flex-row items-center justify-end">
        </View>
      </View>
    </View>
  );
}
