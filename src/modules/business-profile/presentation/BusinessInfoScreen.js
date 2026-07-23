import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { GlobalAppBar, supabase, CustomInput, CustomButton } from '../../../shared';

export default function BusinessInfoScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState(null);

  // Form Fields
  const [legalName, setLegalName] = useState('');
  const [entityType, setEntityType] = useState('other');
  const [taxIdType, setTaxIdType] = useState('VKN');
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [addressLine1, setAddressLine1] = useState('');

  const [initialData, setInitialData] = useState(null);

  const currentData = {
    legalName, entityType, taxIdType, taxIdentifier, taxOffice, phone, email, city, district, addressLine1
  };
  const hasChanges = !initialData || JSON.stringify(currentData) !== JSON.stringify(initialData);

  const fetchBusinessData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Get Organization ID
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();

      if (!orgMember) {
        setLoading(false);
        return;
      }
      setOrgId(orgMember.organization_id);

      // 2. Fetch Legal Profile & Org Name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgMember.organization_id)
        .single();
        
      if (org) setLegalName(org.name);

      const { data: legal } = await supabase
        .from('organization_legal_profiles')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .single();

      if (legal) {
        setEntityType(legal.entity_type || 'other');
        setTaxIdType(legal.tax_identifier_type || 'VKN');
        setTaxIdentifier(legal.tax_identifier || '');
        setTaxOffice(legal.tax_office || '');
      }

      // 3. Fetch Contacts
      const { data: contacts } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', orgMember.organization_id);

      let phoneVal = '';
      let emailVal = '';
      if (contacts) {
        const p = contacts.find(c => c.type === 'phone');
        const e = contacts.find(c => c.type === 'email');
        if (p) { setPhone(p.value); phoneVal = p.value; }
        if (e) { setEmail(e.value); emailVal = e.value; }
      }

      // 4. Fetch Address
      const { data: addr } = await supabase
        .from('organization_addresses')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .eq('is_primary', true)
        .single();

      if (addr) {
        setCity(addr.city || '');
        setDistrict(addr.district || '');
        setAddressLine1(addr.address_line_1 || '');
      }

      setInitialData({
        legalName: org?.name || '',
        entityType: legal?.entity_type || 'other',
        taxIdType: legal?.tax_identifier_type || 'VKN',
        taxIdentifier: legal?.tax_identifier || '',
        taxOffice: legal?.tax_office || '',
        phone: phoneVal,
        email: emailVal,
        city: addr?.city || '',
        district: addr?.district || '',
        addressLine1: addr?.address_line_1 || ''
      });

    } catch (err) {
      console.error('Fetch business data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const handleSave = async () => {
    if (!orgId) {
      Alert.alert('Hata', 'İşletme hesabı bulunamadı.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('update_business_profile', {
        p_organization_id: orgId,
        p_legal_name: legalName,
        p_entity_type: entityType,
        p_tax_identifier_type: taxIdType,
        p_tax_identifier: taxIdentifier,
        p_tax_office: taxOffice,
        p_city: city,
        p_district: district,
        p_address_line_1: addressLine1,
        p_phone: phone,
        p_email: email
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Güncelleme başarısız');
      }

      setInitialData(currentData);
      Alert.alert('Başarılı', 'İşletme bilgileriniz kaydedildi.');
    } catch (err) {
      Alert.alert('Hata', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <GlobalAppBar level={2} module="genel" title="İşletme Bilgileri" showProfile={false} />
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00f0ff" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="rounded-[24px] p-6 mb-6 mt-4 border border-white/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
            
            <Text className="text-white text-lg font-bold mb-4">Temel Bilgiler</Text>
            
            <CustomInput
              label="İşletme / Ticari Ünvan"
              value={legalName}
              onChangeText={setLegalName}
              placeholder="Tam ticari ünvan"
              containerClassName="mb-4"
            />

            <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">Firma Türü</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {[
                { label: 'Şahıs Şirketi', value: 'sole_proprietorship' },
                { label: 'Limited', value: 'limited_company' },
                { label: 'Anonim', value: 'joint_stock_company' },
                { label: 'Ortaklık', value: 'partnership' },
                { label: 'Diğer', value: 'other' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setEntityType(type.value)}
                  className={`px-4 py-2 rounded-full border ${entityType === type.value ? 'bg-primary border-primary' : 'border-white/10'}`}
                >
                  <Text className={`${entityType === type.value ? 'text-black font-bold' : 'text-gray-400'}`}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white text-lg font-bold mb-4 mt-4">Vergi ve Resmî Bilgiler</Text>
            
            <CustomInput
              label="Kimlik Tipi (VKN / TCKN)"
              value={taxIdType}
              onChangeText={setTaxIdType}
              placeholder="VKN"
              containerClassName="mb-4"
            />

            <CustomInput
              label="Vergi / Kimlik Numarası"
              value={taxIdentifier}
              onChangeText={setTaxIdentifier}
              placeholder="1234567890"
              keyboardType="number-pad"
              containerClassName="mb-4"
            />

            <CustomInput
              label="Vergi Dairesi"
              value={taxOffice}
              onChangeText={setTaxOffice}
              placeholder="Vergi Dairesi Adı"
              containerClassName="mb-4"
            />

            <Text className="text-white text-lg font-bold mb-4 mt-4">İletişim ve Adres</Text>

            <CustomInput
              label="İşletme Telefonu"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+90 555 123 4567"
              containerClassName="mb-4"
            />

            <CustomInput
              label="İşletme E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="info@sirket.com"
              containerClassName="mb-4"
            />

            <CustomInput
              label="İl"
              value={city}
              onChangeText={setCity}
              placeholder="İstanbul"
              containerClassName="mb-4"
            />

            <CustomInput
              label="İlçe"
              value={district}
              onChangeText={setDistrict}
              placeholder="Kadıköy"
              containerClassName="mb-4"
            />

            <CustomInput
              label="Açık Adres"
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Mahalle, Sokak, No"
              containerClassName="mb-8"
            />

            <CustomButton
              title={hasChanges ? "İşletme Bilgilerini Kaydet" : "Bilgiler Güncel"}
              onPress={handleSave}
              isLoading={saving}
              disabled={!hasChanges}
              className={`mb-4 ${!hasChanges ? 'opacity-50' : ''}`}
            />

          </View>
        </ScrollView>
      )}
    </View>
  );
}
