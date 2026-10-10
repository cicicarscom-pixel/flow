import React from 'react';
import { Animated } from 'react-native';
import { CustomButton } from '../../../../../shared';
import { Ionicons } from '@expo/vector-icons';

export function SaveButtonInline({ handleSave, isSaveBtnActive, isSavingSettings }) {
  return (
    isSaveBtnActive && (
      <Animated.View style={{ 
        marginBottom: 16,
        shadowColor: '#22B573',
        shadowOpacity: 0.35,
        shadowRadius: 15,
        elevation: 10
      }}>
        <CustomButton
          title="Değişiklikleri Kaydet"
          onPress={handleSave}
          isLoading={isSavingSettings}
          leftIcon={<Ionicons name="save-outline" size={18} color="#1C3327" />}
          className="w-full bg-[#22B573]"
          textClassName="text-[#1C3327] font-bold text-sm"
        />
      </Animated.View>
    )
  );
}
