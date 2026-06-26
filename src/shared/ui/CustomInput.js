import React, { forwardRef } from 'react';
import { TextInput, View, Text } from 'react-native';

const CustomInput = forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  className = "",
  containerClassName = "",
  secureTextEntry = false,
  error,
  leftIcon,
  ...props
}, ref) => {
  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-text-secondary text-sm mb-2 ml-1">
          {label}
        </Text>
      )}
      <View className={`bg-surface border-transparent rounded-small flex-row items-center p-4 ${
          error ? 'border-red-500 border' : ''
        }`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8" // text-secondary
          secureTextEntry={secureTextEntry}
          className={`flex-1 text-text-primary text-[12px] ${className}`}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

export default CustomInput;
