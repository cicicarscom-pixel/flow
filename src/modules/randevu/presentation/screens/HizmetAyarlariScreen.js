import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const defaultServices = [
  { name: 'Sac Kesimi', price: '150', unit: 'seans' },
  { name: 'Sac Boyama', price: '300', unit: 'seans' },
  { name: 'Fon Teknik', price: '500', unit: 'seans' },
];

export default function HizmetAyarlariScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [isActive, setIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState(defaultServices);

  const tabBarBottom = Math.max(insets.bottom + 10, 20);
  const tabBarHeight = 64;
  const actionBarBottom = tabBarBottom + tabBarHeight;
  const FAB_SIZE = 52;
  const scrollPaddingBottom = actionBarBottom + FAB_SIZE * 2.5;

  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addService = () => {
    if (services.length >= 10) return;
    setServices([...services, { name: '', price: '', unit: 'seans' }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#4edea3" />
          <Text style={styles.headerTitle}>Hizmet Ayarlari</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color="#bbcabf" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
      >
        {/* Visibility Toggle */}
        <View style={styles.visibilityCard}>
          <View style={styles.visibilityTextWrap}>
            <Text style={styles.visibilityTitle}>Hizmet Gorunurlugu</Text>
            <Text style={styles.visibilitySubtitle}>
              {isActive
                ? 'Musterileriniz randevu alirken hizmetleri bu listeden secebilir'
                : 'Profiliniz su an gizli (Pasif)'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#353437', true: '#10b981' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isActive ? 'AKTIF HIZMETLER' : 'PASIF HIZMETLER'} ({services.length}/10)
          </Text>
          <Ionicons name="information-circle-outline" size={16} color="#4edea3" />
        </View>

        {/* Service Cards */}
        <View style={{ opacity: isActive ? 1 : 0.4 }} pointerEvents={isActive ? 'auto' : 'none'}>

          {services.map((service, index) => (
            <View key={index} style={styles.serviceCard}>
              {isEditing ? (
                /* ── EDIT MODE ── */
                <View style={styles.editWrap}>
                  <View style={styles.editTopRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={service.name}
                      onChangeText={v => updateService(index, 'name', v)}
                      placeholder="Hizmet adi"
                      placeholderTextColor="#3c4a42"
                    />
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeService(index)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.editBottomRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={service.price}
                      onChangeText={v => updateService(index, 'price', v)}
                      placeholder="Fiyat"
                      placeholderTextColor="#3c4a42"
                      keyboardType="numeric"
                    />
                    <Text style={styles.sep}>TL /</Text>
                    <TextInput
                      style={[styles.input, { width: 76 }]}
                      value={service.unit}
                      onChangeText={v => updateService(index, 'unit', v)}
                      placeholder="birim"
                      placeholderTextColor="#3c4a42"
                    />
                  </View>
                </View>
              ) : (
                /* ── VIEW MODE ── */
                <View style={styles.viewRow}>
                  <Text style={styles.serviceName}>
                    {service.name || 'Hizmet adi girilmedi'}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {service.price ? `${service.price} TL / ${service.unit}` : '—'}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Add button — only in edit mode */}
          {isEditing && services.length < 10 && (
            <TouchableOpacity style={styles.addBtn} onPress={addService}>
              <Ionicons name="add-circle-outline" size={18} color="#4edea3" />
              <Text style={styles.addBtnText}>Hizmet Ekle ({services.length}/10)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { bottom: actionBarBottom }]}>
        <View style={styles.actionGradient}>
          <TouchableOpacity
            style={[
              styles.mainBtn,
              { backgroundColor: isEditing ? '#10b981' : '#4edea3' }
            ]}
            onPress={() => setIsEditing(!isEditing)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
              size={20}
              color="#003824"
            />
            <Text style={styles.mainBtnText}>
              {isEditing ? 'Kaydet' : 'Duzenle'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#131315' },

  /* Header */
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#4edea3' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(53,52,55,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.3)',
  },

  /* Scroll */
  scrollContent: { padding: 14, gap: 10 },

  /* Visibility Card */
  visibilityCard: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  visibilityTextWrap: { flex: 1, marginRight: 12, gap: 4 },
  visibilityTitle: { fontSize: 15, fontWeight: '600', color: '#e5e1e4' },
  visibilitySubtitle: { fontSize: 11, color: '#bbcabf', lineHeight: 16 },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#bbcabf', letterSpacing: 1,
  },

  /* Service Cards */
  serviceCard: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12, marginBottom: 8,
  },

  /* View Mode */
  viewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#e5e1e4', flex: 1 },
  servicePrice: { fontSize: 11, fontWeight: '700', color: '#4edea3', letterSpacing: 0.3 },

  /* Edit Mode */
  editWrap: { gap: 8 },
  editTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    backgroundColor: '#1c1b1d',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.4)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 13, color: '#e5e1e4',
  },
  sep: { fontSize: 12, color: '#bbcabf' },
  deleteBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 8,
  },

  /* Add button */
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(78,222,163,0.3)',
    borderStyle: 'dashed', marginTop: 2,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#4edea3' },

  /* Action Bar */
  actionBar: { position: 'absolute', left: 0, right: 0 },
  actionGradient: {
    paddingHorizontal: 14, paddingTop: 24, paddingBottom: 10,
    backgroundColor: 'rgba(19,19,21,0.97)',
  },
  mainBtn: {
    height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#4edea3', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#003824' },
});
