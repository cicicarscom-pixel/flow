import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../../shared';

export default function HizmetAyarlariScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [isActive, setIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState([]);
  const [initialServices, setInitialServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const tabBarBottom = Math.max(insets.bottom + 10, 20);
  const tabBarHeight = 64;
  const actionBarBottom = tabBarBottom + tabBarHeight;
  const FAB_SIZE = 52;
  const scrollPaddingBottom = actionBarBottom + FAB_SIZE * 2.5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      // Load AI setting
      const { data: orgData } = await supabase
        .from('organization_ai_settings')
        .select('appointment_module_enabled')
        .eq('merchant_id', userId)
        .single();
      if (orgData) {
        setIsActive(orgData.appointment_module_enabled);
      }

      // Load services
      const { data: srvData } = await supabase
        .from('business_services')
        .select('*')
        .eq('merchant_id', userId)
        .order('created_at', { ascending: true });
        
      if (srvData) {
        setServices(srvData);
        setInitialServices(srvData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (val) => {
    setIsActive(val);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase
      .from('organization_ai_settings')
      .update({ appointment_module_enabled: val })
      .eq('merchant_id', session.user.id);
  };

  const handleAction = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    
    // Save mode
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      
      const currentIds = services.map(s => s.id).filter(Boolean);
      const toDelete = initialServices.filter(s => !currentIds.includes(s.id)).map(s => s.id);
      
      if (toDelete.length > 0) {
        await supabase.from('business_services').delete().in('id', toDelete);
      }
      
      const validServices = services.filter(s => s.name?.trim());
      for (const srv of validServices) {
        const payload = {
          merchant_id: userId,
          name: srv.name,
          price: parseFloat(srv.price) || 0,
          currency: 'TL',
          unit: srv.unit || 'seans',
          duration_minutes: parseInt(srv.duration_minutes, 10) || 30,
          is_visible: true
        };
        
        if (srv.id) {
          await supabase.from('business_services').update(payload).eq('id', srv.id);
        } else {
          await supabase.from('business_services').insert([payload]);
        }
      }
      
      await loadData();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Hata", "Kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addService = () => {
    if (services.length >= 10) return;
    setServices([...services, { name: '', price: '', unit: 'seans', duration_minutes: 30 }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
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
          <Text style={styles.headerTitle}>{t('randevu.hizmetAyarlari.title')}</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color="#A79E96" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
      >
        {/* Visibility Toggle */}
        <View style={styles.visibilityCard}>
          <View style={styles.visibilityTextWrap}>
            <Text style={styles.visibilityTitle}>{t('randevu.hizmetAyarlari.visibilityTitle')}</Text>
            <Text style={styles.visibilitySubtitle}>
              {isActive
                ? t('randevu.hizmetAyarlari.visibilitySubtitleActive')
                : t('randevu.hizmetAyarlari.visibilitySubtitleInactive')}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggle}
            trackColor={{ false: '#3A3540', true: '#10b981' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isActive ? t('randevu.hizmetAyarlari.activeServices') : t('randevu.hizmetAyarlari.inactiveServices')} ({services.length}/10)
          </Text>
          <Ionicons name="information-circle-outline" size={16} color="#22B573" />
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
                      placeholder={t('randevu.hizmetAyarlari.serviceNamePlaceholder')}
                      placeholderTextColor="#756D66"
                    />
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeService(index)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.editBottomRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={service.price?.toString()}
                      onChangeText={v => updateService(index, 'price', v)}
                      placeholder={t('randevu.hizmetAyarlari.pricePlaceholder')}
                      placeholderTextColor="#756D66"
                      keyboardType="numeric"
                    />
                    <Text style={styles.sep}>{t('randevu.hizmetAyarlari.currencyUnit')}</Text>
                    <TextInput
                      style={[styles.input, { width: 76 }]}
                      value={service.unit}
                      onChangeText={v => updateService(index, 'unit', v)}
                      placeholder={t('randevu.hizmetAyarlari.unitPlaceholder')}
                      placeholderTextColor="#756D66"
                    />
                    <TextInput
                      style={[styles.input, { width: 66 }]}
                      value={service.duration_minutes?.toString()}
                      onChangeText={v => updateService(index, 'duration_minutes', v)}
                      placeholder="Süre(dk)"
                      placeholderTextColor="#756D66"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                /* ── VIEW MODE ── */
                <View style={styles.viewRow}>
                  <Text style={styles.serviceName}>
                    {service.name || t('randevu.hizmetAyarlari.noName')}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {service.price ? `${service.price} TL / ${service.unit}` : '—'}
                    {service.duration_minutes ? ` • ${service.duration_minutes} dk` : ''}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Add button — only in edit mode */}
          {isEditing && services.length < 10 && (
            <TouchableOpacity style={styles.addBtn} onPress={addService}>
              <Ionicons name="add-circle-outline" size={18} color="#22B573" />
              <Text style={styles.addBtnText}>{t('randevu.hizmetAyarlari.addService', { current: services.length, max: 10 })}</Text>
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
              { backgroundColor: isEditing ? '#10b981' : '#22B573' }
            ]}
            onPress={handleAction}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#1C3327" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
                  size={20}
                  color="#1C3327"
                />
                <Text style={styles.mainBtnText}>
                  {isEditing ? t('randevu.hizmetAyarlari.save') : t('randevu.hizmetAyarlari.edit')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#201D24' },
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
  avatar: {
    width: 36, height: 36, borderRadius: 16,
    backgroundColor: 'rgba(53,52,55,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.3)',
  },
  scrollContent: { padding: 14, gap: 10 },
  visibilityCard: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  visibilityTextWrap: { flex: 1, marginRight: 12, gap: 4 },
  visibilityTitle: { fontSize: 15, fontWeight: '600', color: '#F6F1EC' },
  visibilitySubtitle: { fontSize: 11, color: '#A79E96', lineHeight: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#A79E96', letterSpacing: 1,
  },
  serviceCard: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  viewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#F6F1EC', flex: 1 },
  servicePrice: { fontSize: 11, fontWeight: '700', color: '#22B573', letterSpacing: 0.3 },
  editWrap: { gap: 8 },
  editTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    backgroundColor: '#2A2631',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.4)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 13, color: '#F6F1EC',
  },
  sep: { fontSize: 12, color: '#A79E96' },
  deleteBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 8,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(34, 181, 115,0.3)',
    borderStyle: 'dashed', marginTop: 2,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#22B573' },
  actionBar: { position: 'absolute', left: 0, right: 0 },
  actionGradient: {
    paddingHorizontal: 14, paddingTop: 24, paddingBottom: 10,
    backgroundColor: 'rgba(19,19,21,0.97)',
  },
  mainBtn: {
    height: 52, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#1C3327' },
});
