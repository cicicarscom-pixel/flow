import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

export default function CustomButton({ 
  onPress, 
  title, 
  isLoading = false, 
  disabled = false,
  className = "",
  textClassName = "",
  leftIcon,
  ...props 
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      className={`bg-primary rounded-small items-center justify-center p-4 flex-row ${disabled ? 'opacity-50' : 'opacity-100'} ${className}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`text-text-primary text-[16px] font-semibold ${textClassName}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
