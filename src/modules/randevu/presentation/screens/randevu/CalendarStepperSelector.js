import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { styles } from './randevuStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export function CalendarStepperSelector({ activeCalendarId, calendars, createCalendar, setActiveCalendarId, setIsManageModalVisible, setPromptConfig }) {
  const { t } = useTranslation();
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14, gap: 16, width: '100%' }}>
        <TouchableOpacity 
            onPress={() => setIsManageModalVisible(true)}
            style={{ flex: 1, maxWidth: 200, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            <Ionicons name="create-outline" size={16} color="#F6F1EC" />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: '#F6F1EC', fontSize: 14, fontWeight: '500', flexShrink: 1 }}>{t('randevu.randevuScreen.manageCalendars')}</Text>
          </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {
            setPromptConfig({
              visible: true,
              title: t('randevu.randevuScreen.newCalendarTitle'),
              placeholder: t('randevu.randevuScreen.newCalendarPlaceholder'),
              value: "",
              onSave: (name) => {
                if (name && name.trim()) {
                  createCalendar(name.trim()).catch(e => Alert.alert("Hata", e.message));
                }
              }
            });
          }}
          style={{ flex: 1, maxWidth: 200, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: 'rgba(34, 181, 115, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 181, 115, 0.3)' }}
        >
          <Ionicons name="add" size={18} color="#22B573" />
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: '#22B573', fontSize: 14, fontWeight: '500', flexShrink: 1 }}>{t('randevu.randevuScreen.addCalendar')}</Text>
        </TouchableOpacity>
      </View>
    
      <View style={[styles.dateSelectorPill, { width: '100%', maxWidth: '100%' }]}>
        <TouchableOpacity 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 10 }}
          onPress={() => {
            const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
            if (allOptions.length <= 1) return;
            const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
            const prevIndex = (currentIndex - 1 + allOptions.length) % allOptions.length;
            setActiveCalendarId(allOptions[prevIndex].id);
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#A79E96" />
        </TouchableOpacity>
        
        <Text style={[styles.dateSelectorText, { flex: 1, textAlign: 'center', fontSize: 16 }]} numberOfLines={1}>
          {activeCalendarId ? (calendars.find(c => c.id === activeCalendarId)?.name || 'Bilinmiyor') : 'Tümü'}
        </Text>
        
        <TouchableOpacity 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 10 }}
          onPress={() => {
            const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
            if (allOptions.length <= 1) return;
            const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
            const nextIndex = (currentIndex + 1) % allOptions.length;
            setActiveCalendarId(allOptions[nextIndex].id);
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#A79E96" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
