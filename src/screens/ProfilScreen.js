import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, ImageBackground, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { GlobalAppBar , supabase } from '../shared';

import { CustomButton } from '../shared';
import { CustomInput } from '../shared';
import AddressSelector from '../shared/ui/AddressSelector';

export default function ProfilScreen() {
  const [businessName, setBusinessName] = useState('');
  const [authorizedPerson, setAuthorizedPerson] = useState('');
  const [addressData, setAddressData] = useState(null);
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/png?seed=Alex');
  const [vkn, setVkn] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfileData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email || '');
        const { data, error } = await supabase
          .from('profiles')
          .select('business_name, authorized_person, category, phone_number, address, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile data:', error);
        } else if (data) {
          setBusinessName(data.business_name || '');
          setAuthorizedPerson(data.authorized_person || '');
          setCategory(data.category || 'Diğer');
          setPhone(data.phone_number || '');
          if (data.address) {
            setAddressData(data.address);
          }
          if (data.avatar_url) {
            setAvatar(data.avatar_url);
          }
        }
        
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (orgMember?.organization_id) {
          setOrganizationId(orgMember.organization_id);
          
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', orgMember.organization_id)
            .maybeSingle();
            
          if (orgData && orgData.name) {
            setBusinessName(orgData.name);
          }

          const { data: legalData } = await supabase
            .from('organization_legal_profiles')
            .select('tax_identifier, tax_office')
            .eq('organization_id', orgMember.organization_id)
            .maybeSingle();
            
          if (legalData) {
            setVkn(legalData.tax_identifier || '');
            setTaxOffice(legalData.tax_office || '');
          }
        }
      }
    } catch (err) {
      console.error('Fetch profile data exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchProfileData();
    }, 0);
  }, []);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAvatar(asset.uri); // Optimistic UI update

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && asset.base64) {
          const fileName = `${session.user.id}-${Date.now()}.jpg`;
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, decode(asset.base64), { contentType: 'image/jpeg' });
            
          if (!error && data) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setAvatar(publicUrl);
          } else {
            console.warn("Upload avatar error:", error);
          }
        }
      } catch(e) {
        console.warn("Avatar upload failed", e);
      }
    }
  };
const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('profiles')
          .update({
            business_name: businessName,
            authorized_person: authorizedPerson,
            category: category,
            phone_number: phone,
            address: addressData,
            avatar_url: avatar
          })
          .eq('id', session.user.id);

        if (error) throw error;
        
        if (organizationId) {
          await supabase
            .from('organizations')
            .update({ name: businessName })
            .eq('id', organizationId);

          const { data: existingLegal } = await supabase
            .from('organization_legal_profiles')
            .select('id')
            .eq('organization_id', organizationId)
            .maybeSingle();

          if (existingLegal) {
            await supabase
              .from('organization_legal_profiles')
              .update({ tax_identifier: vkn, tax_office: taxOffice })
              .eq('organization_id', organizationId);
          } else {
            await supabase
              .from('organization_legal_profiles')
              .insert({ organization_id: organizationId, tax_identifier: vkn, tax_office: taxOffice });
          }
        }
        
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
      } else {
        Alert.alert('Hata', 'Oturum bulunamadı.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Hata', 'Profil kaydedilemedi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#17151A]">
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      <GlobalAppBar level={2} module="genel" title="Profil Ayarları" showProfile={true} />
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Main Card */}
        <View 
          className="rounded-[24px] p-6 mb-6 mt-4 border border-white/5"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          {/* Avatar Area */}
          <View className="items-center mb-8">
            <TouchableOpacity onPress={pickImage} className="relative">
              <View className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary">
                <Image 
                  source={{ uri: avatar }} 
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
                <Ionicons name="camera" size={16} color="#000" />
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#22B573" />
              <Text className="text-gray-400 mt-4 text-sm">Profil yükleniyor...</Text>
            </View>
          ) : (
            <>
              <CustomInput
                label="Yetkili Kişi Adı Soyadı"
                value={authorizedPerson}
                onChangeText={setAuthorizedPerson}
                placeholder="Örn: Mehmet Yılmaz"
                containerClassName="mb-4"
              />
              <CustomInput
                label="İşletme Adı"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="İşletmenizin adını girin"
                containerClassName="mb-4"
              />

              <CustomInput
                label="E-posta"
                value={email}
                editable={false}
                containerClassName="mb-4"
              />

              <CustomInput
                label="Telefon"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Telefon numarasn girin"
                containerClassName="mb-4"
              />
              
              <CustomInput
                label="Vergi Numaras (VKN)"
                value={vkn}
                onChangeText={setVkn}
                keyboardType="numeric"
                placeholder="VKN girin"
                containerClassName="mb-4"
              />

              <CustomInput
                label="Vergi Dairesi"
                value={taxOffice}
                onChangeText={setTaxOffice}
                placeholder="Vergi dairesini girin"
                containerClassName="mb-4"
              />

              <CustomInput
                label="Mağaza Kategorisi"
                value={category}
                onChangeText={setCategory}
                placeholder="Örn: Cafe & Restoran, Kuaför..."
                containerClassName="mb-6"
              />

              <View style={{ marginBottom: 32 }}>
                <Text className="text-gray-400 text-xs font-semibold mb-2">Adres Bilgileri</Text>
                <AddressSelector initialData={addressData} onAddressChange={setAddressData} />
              </View>

              {/* Gradient Button */}
              <CustomButton
                title="Profili Kaydet"
                onPress={handleSave}
                isLoading={saving}
                className="mb-4"
              />

              {/* Sign Out Button */}
              <CustomButton
                title="Çıkış Yap"
                onPress={async () => {
                  await supabase.auth.signOut();
                }}
                className="bg-[#EF4444]/10 border border-[#EF4444]"
                textClassName="text-[#EF4444]"
              />
            </>
          )}

        </View>

      </ScrollView>
    </View>
  );
}







