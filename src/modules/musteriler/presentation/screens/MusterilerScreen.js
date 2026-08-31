import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../hooks/useCustomers';
import { AppointmentStatus } from '../../../randevu/domain/enums/AppointmentStatus';

export function MusterilerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { customers, loading, error } = useCustomers();

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const scrollPaddingBottom = Math.max(insets.bottom + 80, 100);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
      case AppointmentStatus.Approved:
        return '#10b981'; // Green
      case 'Cancelled':
      case AppointmentStatus.Cancelled:
        return '#ef4444'; // Red
      case 'Pending':
      case AppointmentStatus.Pending:
      default:
        return '#f59e0b'; // Yellow
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22B573" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#22B573" />
          <Text style={styles.headerTitle}>{t('musteriler.title') || 'Müşteriler'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
      >
        {error && (
          <Text style={{ color: '#ef4444', textAlign: 'center', margin: 10 }}>{error}</Text>
        )}

        {customers.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#A79E96" />
            <Text style={styles.emptyText}>{t('musteriler.empty') || 'Henüz müşteri bulunmuyor.'}</Text>
          </View>
        ) : (
          customers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.card}
              onPress={() => setSelectedCustomer(customer)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{customer.name || customer.phone}</Text>
                <Text style={styles.cardPhone}>{customer.name ? customer.phone : ''}</Text>
              </View>
              <View style={styles.cardBottomRow}>
                <View style={styles.badgeWrap}>
                  <Ionicons name="calendar-outline" size={12} color="#A79E96" />
                  <Text style={styles.badgeText}>{customer.totalAppointments} {t('musteriler.appointments') || 'Randevu'}</Text>
                </View>
                <View style={styles.badgeWrap}>
                  <Ionicons name="time-outline" size={12} color="#A79E96" />
                  <Text style={styles.badgeText}>
                    {t('musteriler.lastVisit') || 'Son'}: {formatDate(customer.lastVisit)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={!!selectedCustomer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCustomer(null)}
      >
        <SafeAreaView style={styles.modalArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedCustomer?.name || selectedCustomer?.phone}</Text>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#F6F1EC" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalInfoBar}>
            <Text style={styles.modalPhone}>{selectedCustomer?.name ? selectedCustomer.phone : ''}</Text>
            {selectedCustomer?.notes && (
              <Text style={styles.modalNotes}>{selectedCustomer.notes}</Text>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.historyScroll}>
            <Text style={styles.historyTitle}>{t('musteriler.history') || 'Geçmiş Randevular'}</Text>
            
            {(selectedCustomer?.history || []).length === 0 ? (
              <Text style={styles.emptyHistory}>{t('musteriler.noHistory') || 'Geçmiş randevu yok.'}</Text>
            ) : (
              selectedCustomer.history.map((appt) => (
                <View key={appt.id} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyServices}>
                      {appt.services?.length > 0 ? appt.services.join(' + ') : '—'}
                    </Text>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(appt.status) }]} />
                  </View>
                  <Text style={styles.historyDate}>{formatDate(appt.date)}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#201D24' },
  modalArea: { flex: 1, backgroundColor: '#201D24' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60,74,66,0.15)',
    backgroundColor: 'rgba(32,31,34,0.5)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#22B573' },

  scrollContent: { padding: 14, gap: 10 },
  
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  emptyText: {
    color: '#A79E96',
    fontSize: 14,
  },

  /* Card */
  card: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#F6F1EC' },
  cardPhone: { fontSize: 12, color: '#A79E96' },
  
  cardBottomRow: {
    flexDirection: 'row', gap: 12, alignItems: 'center'
  },
  badgeWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  badgeText: { fontSize: 11, color: '#A79E96' },

  /* Modal */
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F6F1EC' },
  closeBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16
  },
  modalInfoBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  modalPhone: { fontSize: 14, color: '#22B573', marginBottom: 4 },
  modalNotes: { fontSize: 13, color: '#A79E96', fontStyle: 'italic' },
  
  historyScroll: { padding: 16 },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#F6F1EC', marginBottom: 12 },
  emptyHistory: { fontSize: 13, color: '#A79E96', fontStyle: 'italic' },
  
  historyCard: {
    backgroundColor: 'rgba(32,31,34,0.3)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  historyTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6
  },
  historyServices: { fontSize: 14, fontWeight: '500', color: '#F6F1EC' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  historyDate: { fontSize: 12, color: '#A79E96' },
});
