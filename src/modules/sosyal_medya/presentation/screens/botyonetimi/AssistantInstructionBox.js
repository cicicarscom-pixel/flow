/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, TextInput } from 'react-native';

export function AssistantInstructionBox({ promptConfig, setCustomInstruction, setIsSaveBtnActive }) {
  return (
    <View className="mb-4 mt-2 px-1">
      <Text className="text-white text-sm font-bold mb-2">Asistan Talimatı Oluştur</Text>
      <View className="bg-black/20 border border-white/5 rounded-xl p-3">
        <TextInput
          value={promptConfig.customInstruction || ''}
          onChangeText={(text) => { 
            setCustomInstruction(text); 
            setIsSaveBtnActive(true); 
          }}
          placeholder="Örn: Sen bir berber dükkanı asistanısın, fiyat bilgisi verip randevu alırsın..."
          placeholderTextColor="#A79E96"
          multiline
          style={{ color: '#F6F1EC', fontSize: 13, minHeight: 60, textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}
