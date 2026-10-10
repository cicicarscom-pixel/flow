import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { styles } from './randevuStyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ReserveModal({ activeCalendarId, add30Mins, calendars, createCalendarBlock, isSaving, refreshDaySchedule, reserveDurationType, reserveError, reserveModal, reserveNote, reserveReason, reserveScope, selectedDate, setIsSaving, setReserveConflicts, setReserveDurationType, setReserveError, setReserveModal, setReserveNote, setReserveReason, setReserveScope, t }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={reserveModal.visible} transparent animationType="slide" onRequestClose={() => setReserveModal({ visible: false, time: '', endTime: '' })}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: 20 + Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('randevu.block.title', { defaultValue: 'Saati Rezerve Et' })}</Text>
              <TouchableOpacity onPress={() => setReserveModal({ visible: false, time: '', endTime: '' })}>
                <Ionicons name="close" size={24} color="#A79E96" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {reserveError ? (
                <View style={{ backgroundColor: 'rgba(255,0,0,0.1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#ff4444', fontSize: 13 }}>{reserveError}</Text>
                </View>
              ) : null}
    
              <Text style={styles.modalLabel}>{t('randevu.block.scope', { defaultValue: 'Kapsam' })}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setReserveScope('doctor')} style={[styles.chip, reserveScope === 'doctor' && styles.chipActive, { flex: 1 }]}>
                  <Text style={[styles.chipText, reserveScope === 'doctor' && styles.chipTextActive, { textAlign: 'center' }]}>{activeCalendarId ? calendars.find(c => c.id === activeCalendarId)?.name || t('randevu.block.selectedDoctor', { defaultValue: 'Seçili doktor' }) : t('randevu.block.selectedDoctor', { defaultValue: 'Seçili doktor' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReserveScope('clinic')} style={[styles.chip, reserveScope === 'clinic' && styles.chipActive, { flex: 1 }]}>
                  <Text style={[styles.chipText, reserveScope === 'clinic' && styles.chipTextActive, { textAlign: 'center' }]}>{t('randevu.block.entireClinic', { defaultValue: 'Tüm klinik' })}</Text>
                </TouchableOpacity>
              </View>
    
              <Text style={styles.modalLabel}>{t('randevu.block.duration', { defaultValue: 'Süre' })}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => { setReserveDurationType('single'); setReserveModal(p => ({...p, endTime: add30Mins(p.time)})); }} style={[styles.chip, reserveDurationType === 'single' && styles.chipActive, { flex: 1 }]}>
                  <Text style={[styles.chipText, reserveDurationType === 'single' && styles.chipTextActive, { textAlign: 'center' }]}>{t('randevu.block.singleSlot', { defaultValue: 'Tek slot' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReserveDurationType('range')} style={[styles.chip, reserveDurationType === 'range' && styles.chipActive, { flex: 1 }]}>
                  <Text style={[styles.chipText, reserveDurationType === 'range' && styles.chipTextActive, { textAlign: 'center' }]}>{t('randevu.block.range', { defaultValue: 'Başlangıç-bitiş' })}</Text>
                </TouchableOpacity>
              </View>
    
              {reserveDurationType === 'range' && (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.modalLabel}>{t('randevu.block.start', { defaultValue: 'Başlangıç' })}</Text>
                     <TextInput style={styles.modalInput} value={reserveModal.time} onChangeText={t => setReserveModal(p => ({...p, time: t}))} keyboardType="numbers-and-punctuation" />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.modalLabel}>{t('randevu.block.end', { defaultValue: 'Bitiş' })}</Text>
                     <TextInput style={styles.modalInput} value={reserveModal.endTime} onChangeText={t => setReserveModal(p => ({...p, endTime: t}))} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>
              )}
    
              <Text style={styles.modalLabel}>{t('randevu.block.reasonLabel', { defaultValue: 'Neden' })}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setReserveReason('meeting')} style={[styles.chip, reserveReason === 'meeting' && styles.chipActive, { marginBottom: 8 }]}>
                  <Text style={[styles.chipText, reserveReason === 'meeting' && styles.chipTextActive]}>{t('randevu.block.reasonMeeting')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReserveReason('leave')} style={[styles.chip, reserveReason === 'leave' && styles.chipActive, { marginBottom: 8 }]}>
                  <Text style={[styles.chipText, reserveReason === 'leave' && styles.chipTextActive]}>{t('randevu.block.reasonLeave')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReserveReason('break')} style={[styles.chip, reserveReason === 'break' && styles.chipActive, { marginBottom: 8 }]}>
                  <Text style={[styles.chipText, reserveReason === 'break' && styles.chipTextActive]}>{t('randevu.block.reasonBreak')}</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalLabel}>{t('randevu.block.noteLabel')}</Text>
              <TextInput style={[styles.modalInput, { marginBottom: 24 }]} value={reserveNote} onChangeText={setReserveNote} placeholder={t('randevu.block.notePlaceholder')} placeholderTextColor="#756D66" />
              
              <TouchableOpacity 
                disabled={isSaving}
                onPress={async () => {
                  if (isSaving) return;
                  setIsSaving(true);
                  try {
                    setReserveError(''); setReserveConflicts([]);
                    const blockCalId = reserveScope === 'clinic' ? null : (activeCalendarId || reserveScope);
                    const res = await createCalendarBlock(blockCalId, `${selectedDate}T${reserveModal.time}:00`, `${selectedDate}T${reserveModal.endTime}:00`, reserveReason, reserveNote);
                    
                    if (res.data?.status === 'SUCCESS') {
                      setReserveModal({ visible: false, time: '', endTime: '' });
                      refreshDaySchedule(activeCalendarId || undefined);
                    } else if (res.data?.status === 'CONFLICTS_WITH_APPOINTMENTS') {
                      setReserveError(t('randevu.block.conflicts', { defaultValue: 'Çakışan randevular var.' }));
                      setReserveConflicts(res.data.appointments || []);
                    } else if (res.data?.status === 'INVALID_RANGE') {
                      setReserveError(t('randevu.block.invalidRange'));
                    } else if (res.data?.status === 'ALREADY_BLOCKED') {
                      setReserveError(t('randevu.block.alreadyBlocked'));
                    } else {
                      setReserveError(t('musteriler.error'));
                    }
                  } catch (err) {
                    setReserveError(err.message || t('musteriler.error'));
                  } finally {
                    setIsSaving(false);
                  }
                }}
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
              >
                {isSaving ? (
                   <ActivityIndicator color="#1C3327" />
                ) : (
                   <Text style={styles.saveButtonText}>{t('randevu.block.save', { defaultValue: 'Kaydet' })}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
