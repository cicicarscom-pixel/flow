/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, Switch, TextInput } from 'react-native';
import { styles } from './botStyles';
import ReminderTemplateEditor from '../../components/ReminderTemplateEditor';

export function TimezoneAppointmentCard({ appointmentModuleEnabled, handleAutoSave, handleMultiCalendarSave, handleReminderSave, multiCalendarEnabled, reminderEnabled, setAppointmentModuleEnabled, setMultiCalendarEnabled, setTimezone, t, timezone }) {
  return (
    <View style={styles.glassCard} className="p-4 mb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 pr-2">
            <Text className="text-white text-sm font-bold mb-1">Randevu / Rezervasyon Özelliği</Text>
            <Text className="text-gray-400 text-[10px] leading-3">Kapatırsanız AI randevu almaya çalışmaz, sadece bilgi verir.</Text>
          </View>
          <Switch
            value={appointmentModuleEnabled}
            onValueChange={(val) => { setAppointmentModuleEnabled(val); handleAutoSave({ appointment_module_enabled: val }); }}
            trackColor={{ false: '#34303C', true: '#22B573' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
    
        <View className="flex-row justify-between items-center border-t border-white/5 pt-4 mb-4">
          <View className="flex-1 pr-2">
            <Text className="text-white text-sm font-bold mb-1">Personel / Çoklu Takvim Modu</Text>
            <Text className="text-gray-400 text-[10px] leading-3">Müşteriler randevu alırken personel veya hizmet veren seçebilir.</Text>
          </View>
          <Switch
            value={multiCalendarEnabled}
            onValueChange={(val) => { setMultiCalendarEnabled(val); handleMultiCalendarSave(val); }}
            trackColor={{ false: '#34303C', true: '#22B573' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
    
        <View className="flex-row justify-between items-center border-t border-white/5 pt-4 mb-4">
          <View className="flex-1 pr-2">
            <Text className="text-white text-sm font-bold mb-1">{t('reminders.title')}</Text>
            <Text className="text-gray-400 text-[10px] leading-3">{t('reminders.desc')}</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderSave}
            trackColor={{ false: '#34303C', true: '#22B573' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
        {reminderEnabled ? (
          <View className="mb-4">
            <ReminderTemplateEditor />
          </View>
        ) : null}
    
        <View className="flex-row justify-between items-center border-t border-white/5 pt-4">
          <View className="flex-1 mr-4">
            <Text className="text-white text-sm font-bold mb-1">Saat Dilimi (Timezone)</Text>
            <Text className="text-gray-400 text-[10px] leading-3">Örn: Europe/Istanbul</Text>
          </View>
          <View className="bg-white/5 border border-white/10 rounded-lg overflow-hidden" style={{ width: 140 }}>
            <TextInput
              value={timezone}
              onChangeText={(val) => setTimezone(val)}
              onEndEditing={(e) => handleAutoSave({ timezone: e.nativeEvent.text })}
              className="text-white text-xs px-2 py-2 text-center"
            />
          </View>
        </View>
      </View>
  );
}
