/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, Switch } from 'react-native';
import { styles } from './botStyles';
import { Ionicons } from '@expo/vector-icons';

export function BotStatusHero({ setIsEditing, setIsSaveBtnActive, setWhatsappBotActive, whatsappBotActive }) {
  return (
    <View style={styles.statusHeroCard}>
        {/* Platform Toggles */}
        <View style={[styles.statusSubRow, { marginTop: 0 }]}>
            <View className="flex-row items-center flex-1">
              <View style={styles.statusSubIconWrapper}>
                <Ionicons name="logo-whatsapp" size={16} color={whatsappBotActive ? "#25D366" : "#756D66"} />
              </View>
              <Text className="text-white text-xs font-semibold ml-2">WhatsApp Asistanı</Text>
              <Switch
                value={whatsappBotActive}
                onValueChange={(val) => { setWhatsappBotActive(val); setIsSaveBtnActive(true); setIsEditing(true); }}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(37, 211, 102, 0.4)' }}
                thumbColor={whatsappBotActive ? '#25D366' : '#ffffff'}
                style={{ marginLeft: 'auto' }}
              />
            </View>
          </View>
    </View>
  );
}
