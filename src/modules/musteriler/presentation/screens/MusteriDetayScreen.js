import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCustomers } from '../hooks/useCustomers';
import { useTranslation } from 'react-i18next';

export default function MusteriDetayScreen({ route, navigation }) {
  const { customerId } = route.params;
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { customers, repo } = useCustomers();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const customer = customers.find(c => c.id === customerId);

  useEffect(() => {
    if (customer) {
      setNotes(customer.notes || '');
      loadAppointments();
    }
  }, [customer]);

  const loadAppointments = async () => {
    setLoading(true);
    const list = await repo.getAppointments(customerId);
    setAppointments(list);
    setLoading(false);
  };

  const saveNotes = async () => {
    const res = await repo.updateNotes(customerId, notes);
    if (res.status === 'SUCCESS') {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const getAvatarColor = (id) => {
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) hash = (id || '').charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 60%, 40%)`;
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (isoStr, tz) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat(i18n.language || 'tr-TR', { 
        timeZone: tz || 'Europe/Istanbul', 
        day: 'numeric', month: 'short', weekday: 'short', hour: '2-digit', minute: '2-digit' 
      }).format(d);
    } catch(e) {
      return new Date(isoStr).toLocaleString(i18n.language || 'tr-TR');
    }
  };

  if (!customer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#131315', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF7A59" />
      </SafeAreaView>
    );
  }

  const cleanPhone = customer.phone_display?.replace(/\D/g, '') || '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#131315' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', marginRight: 8 }}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
          {/* Profile */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: getAvatarColor(customer.id), justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{getInitials(customer.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>{customer.name}</Text>
              <Text style={{ color: '#A79E96', fontSize: 14, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{customer.phone_display}</Text>
              <Text style={{ color: '#A79E96', fontSize: 12 }}>
                {new Date(customer.created_at).toLocaleDateString(i18n.language || 'tr-TR')} • {customer.source === 'whatsapp' ? 'WhatsApp' : 'Elle eklendi'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${cleanPhone}`)} style={{ flex: 1, backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:+${cleanPhone}`)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ara</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('RandevuMain')} style={{ flex: 1, backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Randevu</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {[
              { label: 'Toplam', val: customer.total },
              { label: 'Yaklaşan', val: customer.upcoming },
              { label: 'Geçmiş', val: customer.past },
              { label: 'İptal', val: customer.cancelled }
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#A79E96', fontSize: 11, marginBottom: 4 }}>{s.label}</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}>{s.val}</Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Notlar</Text>
              {saved && <Text style={{ color: '#7ddba8', fontSize: 12 }}>Kaydedildi</Text>}
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onEndEditing={saveNotes}
              multiline
              style={{ height: 100, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#fff', textAlignVertical: 'top' }}
              placeholder="Müşteri için not ekleyin..."
              placeholderTextColor="#A79E96"
            />
          </View>

          {/* Appointments */}
          <View>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Randevu Geçmişi</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#FF7A59" />
            ) : appointments.length === 0 ? (
              <Text style={{ color: '#A79E96', fontSize: 13 }}>Randevu bulunamadı.</Text>
            ) : (
              appointments.map(appt => (
                <View key={appt.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: appt.status === 'Approved' ? '#22c55e' : appt.status === 'Pending' ? '#eab308' : '#6b7280' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#FF7A59', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 'bold' }}>{formatDate(appt.starts_at, appt.timezone)}</Text>
                    <Text style={{ color: appt.status === 'Approved' ? '#22c55e' : appt.status === 'Pending' ? '#eab308' : '#9ca3af', fontSize: 12, fontWeight: '600' }}>{appt.status}</Text>
                  </View>
                  <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, marginBottom: 4 }}>"{appt.request}"</Text>
                  <Text style={{ color: '#7ddba8', fontSize: 12 }}>{appt.doctor}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}