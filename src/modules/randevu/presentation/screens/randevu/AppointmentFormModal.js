/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { Modal, KeyboardAvoidingView, Platform, View, TouchableOpacity, ScrollView, Text, TextInput, ActivityIndicator } from 'react-native';
import { styles } from './randevuStyles';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppointmentFormModal({ availableModalHours, calendars, handleSaveAppointment, isModalVisible, isSaving, newApptCalendarId, newApptName, newApptNote, newApptPhone, newApptService, newApptTime, selectedDate, services, setIsModalVisible, setNewApptCalendarId, setNewApptName, setNewApptNote, setNewApptPhone, setNewApptService, setNewApptTime, setSelectedDate, setShowCalendarDropdown, setShowDatePicker, showCalendarDropdown, showDatePicker, t }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
    visible={isModalVisible}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setIsModalVisible(false)}
    >
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { 
          backgroundColor: '#201D24', padding: 32, paddingBottom: 32 + Math.max(insets.bottom, 16), borderRadius: 32, 
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, 
          shadowOpacity: 0.4, shadowRadius: 48, elevation: 10,
            maxHeight: Platform.OS === 'ios' ? '85%' : '90%'
          }]}>
          
          <TouchableOpacity 
            onPress={() => setIsModalVisible(false)}
            style={{ 
              position: 'absolute', top: 20, right: 20, width: 36, height: 36, 
              borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', 
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', 
              alignItems: 'center', justifyContent: 'center', zIndex: 10 
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              style={{ flexShrink: 1, width: '100%' }}
              contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            >
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ 
              width: 64, height: 64, borderRadius: 32, 
              backgroundColor: 'rgba(34,181,115,0.2)', 
              alignItems: 'center', justifyContent: 'center', marginBottom: 12 
            }}>
              <Text style={{ fontSize: 32 }}>🪄</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', margin: 0 }}>
              {t('randevu.randevuScreen.addAppointment', 'Yeni Randevu Ekle')}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Takviminize yeni bir kayıt oluşturun
            </Text>
          </View>
          
                        <Text style={styles.webModalLabel}>Tarih</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.webModalInput, { marginBottom: 16, justifyContent: 'center' }]}
          >
            <Text style={{ color: selectedDate ? '#fff' : '#A79E96', fontSize: 14 }}>
              {selectedDate || 'YYYY-AA-GG'}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate ? new Date(selectedDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={(selectedDateObj) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (selectedDateObj) {
                  const y = selectedDateObj.getFullYear();
                  const m = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
                  const d = String(selectedDateObj.getDate()).padStart(2, '0');
                  setSelectedDate(`${y}-${m}-${d}`);
                }
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 }}>
              <Text style={{ color: '#22B573', fontWeight: 'bold' }}>Bitti</Text>
            </TouchableOpacity>
          )}
    
          <Text style={styles.webModalLabel}>Müşteri Adı</Text>
          <TextInput
            style={styles.webModalInput}
            placeholder="Örn: Ahmet Yılmaz"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={newApptName}
            onChangeText={setNewApptName}
          />
    
          <Text style={styles.webModalLabel}>Telefon Numarası</Text>
          <TextInput
            style={styles.webModalInput}
            placeholder="Örn: +90 555 123 4567"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={newApptPhone}
            onChangeText={setNewApptPhone}
            keyboardType="phone-pad"
          />
    
          <View style={{ marginBottom: 16, zIndex: 10 }}>
            <Text style={styles.webModalLabel}>Takvim</Text>
            <TouchableOpacity 
              style={[styles.webModalInput, { paddingVertical: 14, marginBottom: 0 }]} 
              onPress={() => setShowCalendarDropdown(!showCalendarDropdown)}
            >
              <Text style={{ color: newApptCalendarId ? '#fff' : 'rgba(255, 255, 255, 0.4)' }}>
                {newApptCalendarId ? calendars.find(c => c.id === newApptCalendarId)?.name : "Seçiniz"}
              </Text>
            </TouchableOpacity>
            
            {showCalendarDropdown && (
              <View style={{ position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: '#1A181C', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', zIndex: 20 }}>
                {calendars.map(cal => (
                  <TouchableOpacity 
                    key={cal.id} 
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                    onPress={() => { setNewApptCalendarId(cal.id); setShowCalendarDropdown(false); }}
                  >
                    <Text style={{ color: newApptCalendarId === cal.id ? '#22B573' : '#fff' }}>{cal.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
    
          
          
          {services.length > 0 && (
            <View style={{ marginBottom: 16, zIndex: 1 }}>
              <Text style={styles.webModalLabel}>Hizmet Tipi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {services.map(s => (
                  <TouchableOpacity 
                    key={s.id}
                    onPress={() => setNewApptService(s.id)}
                    style={[styles.chip, newApptService === s.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, newApptService === s.id && styles.chipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
    
          <View style={{ marginBottom: 16, zIndex: 1 }}>
            <Text style={styles.webModalLabel}>Açıklama / Not</Text>
            <TextInput
              style={[styles.webModalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Yapay zekaya verilen notlar gibi... (Örn: Dolgum düştü dolgu yaptırmak istiyorum)"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              value={newApptNote}
              onChangeText={setNewApptNote}
            />
          </View>
    
          <View style={{ zIndex: 1 }}>
            <Text style={styles.webModalLabel}>Saat</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {availableModalHours.map(hour => (
                  <TouchableOpacity 
                    key={hour}
                    onPress={() => setNewApptTime(hour)}
                    style={[styles.chip, newApptTime === hour && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, newApptTime === hour && styles.chipTextActive]}>{hour}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
    
          <TouchableOpacity 
            style={styles.webSaveButton}
            activeOpacity={0.8}
            onPress={handleSaveAppointment}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#1C3327" />
            ) : (
              <Text style={styles.webSaveButtonText}>{t('randevu.randevuScreen.saveAppointment', 'Randevu Oluştur')}</Text>
            )}
          </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
    </Modal>
  );
}
