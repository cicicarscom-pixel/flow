import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function GlobalAppBar({
  level = 2,
  module = 'genel',
  title = '',
  showProfile = false,
  actions = [],
  onBackPress,
  onMenuPress
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Determine accent color
  let accentColor = 'transparent';
  if (module === 'finans') accentColor = '#00f0ff';
  else if (module === 'sosyal') accentColor = '#bc13fe';
  else if (module === 'ai') accentColor = '#208AEF';

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: '#070B1F' }}>
      <View 
        className="flex-row items-center justify-between px-4"
        style={{ height: 64 }}
      >
        {/* Left Section */}
        <View className="flex-row items-center flex-1">
          {level === 1 ? (
            <TouchableOpacity onPress={onMenuPress} className="w-11 h-11 justify-center">
              <MaterialIcons name="menu" size={24} color="#e5e2e3" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleBack} className="w-11 h-11 justify-center">
              <MaterialIcons name="arrow-back" size={24} color="#e5e2e3" />
            </TouchableOpacity>
          )}

          <Text 
            className="text-white text-lg font-bold tracking-tight ml-2"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {level === 1 ? "Workigom AI" : title}
          </Text>
        </View>

        {/* Right Section */}
        <View className="flex-row items-center justify-end">
          {actions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={action.onPress}
              className="w-11 h-11 items-center justify-center ml-1"
            >
              <MaterialIcons name={action.icon} size={24} color="#e5e2e3" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
