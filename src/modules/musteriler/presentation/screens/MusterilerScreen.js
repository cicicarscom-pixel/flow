import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCustomers } from '../hooks/useCustomers';
import { useTranslation } from 'react-i18next';

export default function MusterilerScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { customers, loading, refetch, repo } = useCustomers();
  const [search, setSearch] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addError, setAddError] = useState('');

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    const pDigits = c.phone_display?.replace(/\D/g, '') || '';
    const sDigits = search.replace(/\D/g, '');
    return (c.name || '').toLowerCase().includes(s) || (sDigits && pDigits.includes(sDigits));
  });

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

  const handleAdd = async () => {
    setAddError('');
    if (!addName.trim()) { setAddError(t('musteriler.nameRequired')); return; }
    if (!addPhone.trim()) { setAddError(t('musteriler.phoneRequired')); return; }
    
    const res = await repo.create(addName, addPhone);
    if (res.status === 'SUCCESS') {
      setIsAddOpen(false);
      setAddName('');
      setAddPhone('');
      refetch();
      if (res.id) navigation.navigate('MusteriDetay', { customerId: res.id });
    } else if (res.status === 'ALREADY_EXISTS') {
      Alert.alert('', t('musteriler.alreadyExists'));
      setIsAddOpen(false);
      setAddName('');
      setAddPhone('');
      if (res.id) navigation.navigate('MusteriDetay', { customerId: res.id });
    } else if (res.status === 'INVALID_PHONE') {
      setAddError(t('musteriler.invalidPhone'));
    } else {
      setAddError(t('musteriler.error'));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('MusteriDetay', { customerId: item.id })}
      style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 16, marginBottom: 12
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: getAvatarColor(item.id), justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{getInitials(item.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{item.name}</Text>
          <Text style={{ color: '#A79E96', fontSize: 12, fontFamily: 'JetBrains Mono' }}>{item.phone_display}</Text>
        </View>
        <View style={{ backgroundColor: item.source === 'whatsapp' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
          <Text style={{ color: item.source === 'whatsapp' ? '#22c55e' : '#3b82f6', fontSize: 10, fontWeight: '600' }}>{item.source === 'whatsapp' ? 'WhatsApp' : 'Elle eklendi'}</Text>
        </View>
      </View>
      
      <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12 }}>
        {item.next_starts_at ? (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#FF7A59', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '600' }}>{formatDate(item.next_starts_at)}</Text>
              <Text style={{ color: '#A79E96', fontSize: 11 }}>{item.total} {t('musteriler.randevu', { defaultValue: 'randevu' })}</Text>
            </View>
            <Text numberOfLines={1} style={{ color: '#E5E1E4', fontSize: 13 }}>"{item.next_request}"</Text>
            {item.next_doctor && <Text style={{ color: '#7ddba8', fontSize: 11, marginTop: 4 }}>{item.next_doctor}</Text>}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#A79E96', fontSize: 12 }}>{t('musteriler.noUpcoming', { defaultValue: 'Yaklaşan randevu yok' })}</Text>
            <Text style={{ color: '#A79E96', fontSize: 11 }}>{item.total} {t('musteriler.randevu', { defaultValue: 'randevu' })}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#131315' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>{t('header.titles.customers', { defaultValue: 'Müşteriler' })}</Text>
        <TouchableOpacity onPress={() => setIsAddOpen(true)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF7A59', justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <MaterialIcons name="search" size={20} color="#A79E96" />
          <TextInput
            placeholder={t('musteriler.search', { defaultValue: 'İsim veya telefon ara...' })}
            placeholderTextColor="#A79E96"
            style={{ flex: 1, color: '#fff', marginLeft: 8, fontSize: 15 }}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FF7A59" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
          ListEmptyComponent={<Text style={{ color: '#A79E96', textAlign: 'center', marginTop: 40 }}>{t('musteriler.empty', { defaultValue: 'Müşteri bulunamadı.' })}</Text>}
        />
      )}

      {/* Add Modal */}
      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1c1b1d', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{t('musteriler.addCustomer', { defaultValue: 'Yeni Müşteri Ekle' })}</Text>
              <TouchableOpacity onPress={() => setIsAddOpen(false)}><MaterialIcons name="close" size={24} color="#A79E96" /></TouchableOpacity>
            </View>
            
            <Text style={{ color: '#A79E96', fontSize: 12, marginBottom: 8 }}>İsim Soyisim</Text>
            <TextInput 
              value={addName} onChangeText={setAddName} 
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, color: '#fff', padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} 
            />
            
            <Text style={{ color: '#A79E96', fontSize: 12, marginBottom: 8 }}>Telefon (+90 5XX ...)</Text>
            <TextInput 
              value={addPhone} onChangeText={setAddPhone} keyboardType="phone-pad"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, color: '#fff', padding: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} 
            />
            
            {addError ? <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 16 }}>{addError}</Text> : null}
            
            <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('musteriler.add', { defaultValue: 'Ekle' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}