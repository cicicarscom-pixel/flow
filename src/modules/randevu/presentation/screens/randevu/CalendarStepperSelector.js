/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { styles } from './randevuStyles';
import { Ionicons } from '@expo/vector-icons';

export function CalendarStepperSelector({ activeCalendarId, calendars, createCalendar, setActiveCalendarId, setIsManageModalVisible, setPromptConfig }) {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14, gap: 16, width: '100%' }}>
        <TouchableOpacity 
            onPress={() => setIsManageModalVisible(true)}
            style={{ width: '45%', maxWidth: 160, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '500' }}>Düzenle</Text>
          </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {
            setPromptConfig({
              visible: true,
              title: "Yeni Takvim",
              placeholder: "Yeni takvim/personel adını girin",
              value: "",
              onSave: (name) => {
                if (name && name.trim()) {
                  createCalendar(name.trim()).catch(e => Alert.alert("Hata", e.message));
                }
              }
            });
          }}
          style={{ width: '45%', maxWidth: 160, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(34, 181, 115, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 181, 115, 0.3)' }}
        >
          <Text style={{ color: '#22B573', fontSize: 14, fontWeight: '500' }}>+ Yeni Ekle</Text>
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
