import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, ImageBackground, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { decode } from 'base64-arraybuffer';
import { GlobalAppBar , supabase } from '../shared';

import { CustomButton } from '../shared';
import { CustomInput } from '../shared';
import AddressSelector from '../shared/ui/AddressSelector';
import { setAppLanguage, getSavedLanguageOverride } from '../core/i18n';

const LANGUAGE_OPTIONS = [
  { code: 'tr', labelKey: 'common.language.turkish' },
  { code: 'en', labelKey: 'common.language.english' },
  { code: 'de', labelKey: 'common.language.german' },
];

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [savedOverride, setSavedOverride] = useState(null);

  useEffect(() => {
    getSavedLanguageOverride().then(setSavedOverride);
  }, [i18n.language]);

  const handleSelect = async (code) => {
    if (code === i18n.language) return;
    await setAppLanguage(code);
    setSavedOverride(code);
  };

  return (
    <View style={{ marginBottom: 32 }}>
      <Text className="text-gray-400 text-xs font-semibold mb-1">{t('common.language.title')}</Text>
      <Text className="text-gray-500 text-[11px] mb-3">{t('common.language.subtitle')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {LANGUAGE_OPTIONS.map((opt) => {
          const isActive = i18n.language === opt.code;
          return (
            <TouchableOpacity
              key={opt.code}
              onPress={() => handleSelect(opt.code)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isActive ? '#4edea3' : 'rgba(255,255,255,0.1)',
                backgroundColor: isActive ? 'rgba(78,222,163,0.12)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <Text style={{ color: isActive ? '#4edea3' : '#e5e1e4', fontSize: 13, fontWeight: isActive ? '700' : '500' }}>
                {t(opt.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!savedOverride && (
        <Text className="text-gray-600 text-[10px] mt-2">{t('common.language.systemDefault')}</Text>
      )}
    </View>
  );
}

export default function ProfilScreen() {
  const { t } = useTranslation();
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
  const { showActionSheetWithOptions } = useActionSheet();
  const [heroImageUrl, setHeroImageUrl] = useState(null);

  const fetchProfileData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email || '');
        const { data, error } = await supabase
          .from('profiles')
          .select('business_name, authorized_person, category, phone_number, address, avatar_url, hero_image_url')
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
          if (data.hero_image_url) {
            setHeroImageUrl(data.hero_image_url);
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
            avatar_url: avatar,
            hero_image_url: heroImageUrl
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
        
        Alert.alert(t('profil.saveSuccessTitle'), t('profil.saveSuccessMessage'));
      } else {
        Alert.alert(t('profil.noSessionTitle'), t('profil.noSessionMessage'));
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert(t('profil.saveErrorTitle'), t('profil.saveErrorMessage', { error: err.message }));
    } finally {
      setSaving(false);
    }
  };
  const handleHeroImageChange = () => {
    showActionSheetWithOptions(
      {
        options: ['Galeriden Seç', 'Varsayılana Dön', 'İptal'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          // Galeriden Seç
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const oldHeroImageUrl = heroImageUrl;

            try {
              // Optimistic UI update
              setHeroImageUrl(asset.uri);

              // 1. Optimize image
              const manipResult = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
              );

              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const fileName = `${session.user.id}-hero.jpg`;

                // 2. Upload to Supabase Storage (upsert) using base64 arraybuffer
                const { error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(fileName, decode(manipResult.base64), { contentType: 'image/jpeg', upsert: true });

                if (uploadError) throw uploadError;

                // 4. Get public URL and apply cache-busting
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                const finalUrl = `${publicUrl}?t=${Date.now()}`;

                // 5. Update profiles table
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ hero_image_url: finalUrl })
                  .eq('id', session.user.id);

                if (updateError) throw updateError;

                setHeroImageUrl(finalUrl);
              }
            } catch (e) {
              console.warn("Hero image upload failed:", e);
              setHeroImageUrl(oldHeroImageUrl);
              Alert.alert("Hata", "Kapak resmi yüklenemedi. Lütfen tekrar deneyin.");
            }
          }
        } else if (buttonIndex === 1) {
          // Varsayılana Dön
          const oldHeroImageUrl = heroImageUrl;
          try {
            setHeroImageUrl(null);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { error } = await supabase
                .from('profiles')
                .update({ hero_image_url: null })
                .eq('id', session.user.id);
              if (error) throw error;
              
              const fileName = `${session.user.id}-hero.jpg`;
              await supabase.storage.from('avatars').remove([fileName]);
            }
          } catch (e) {
            console.warn("Hero image reset failed:", e);
            setHeroImageUrl(oldHeroImageUrl);
            Alert.alert("Hata", "Varsayılana dönerken bir hata oluştu.");
          }
        }
      }
    );
  };

  return (
    <View className="flex-1 bg-[#17151A]">
      <ImageBackground 
        source={{ uri: heroImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      <GlobalAppBar level={2} module="genel" title={t('profil.title')} showProfile={true} />
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Main Card */}
        <View 
          className="rounded-[24px] p-6 mb-6 mt-4 border border-white/5"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          {/* Avatar Area */}
          <View className="items-center mb-6">
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
            
            <TouchableOpacity onPress={handleHeroImageChange} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
              <Ionicons name="image-outline" size={14} color="#aaa" />
              <Text style={{ color: '#aaa', fontSize: 12, marginLeft: 6 }}>Kapak Resmini Değiştir</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#22B573" />
              <Text className="text-gray-400 mt-4 text-sm">{t('profil.loading')}</Text>
            </View>
          ) : (
            <>
              <LanguageSwitcher />

              <CustomInput
                label={t('profil.authorizedPerson')}
                value={authorizedPerson}
                onChangeText={setAuthorizedPerson}
                placeholder={t('profil.authorizedPersonPlaceholder')}
                containerClassName="mb-4"
              />
              <CustomInput
                label={t('profil.businessName')}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder={t('profil.businessNamePlaceholder')}
                containerClassName="mb-4"
              />

              <CustomInput
                label={t('profil.email')}
                value={email}
                editable={false}
                containerClassName="mb-4"
              />

              <CustomInput
                label={t('profil.phone')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={t('profil.phonePlaceholder')}
                containerClassName="mb-4"
              />

              <CustomInput
                label={t('profil.taxId')}
                value={vkn}
                onChangeText={setVkn}
                keyboardType="numeric"
                placeholder={t('profil.taxIdPlaceholder')}
                containerClassName="mb-4"
              />

              <CustomInput
                label={t('profil.taxOffice')}
                value={taxOffice}
                onChangeText={setTaxOffice}
                placeholder={t('profil.taxOfficePlaceholder')}
                containerClassName="mb-4"
              />

              <CustomInput
                label={t('profil.category')}
                value={category}
                onChangeText={setCategory}
                placeholder={t('profil.categoryPlaceholder')}
                containerClassName="mb-6"
              />

              <View style={{ marginBottom: 32 }}>
                <Text className="text-gray-400 text-xs font-semibold mb-2">{t('profil.addressInfo')}</Text>
                <AddressSelector initialData={addressData} onAddressChange={setAddressData} />
              </View>

              {/* Gradient Button */}
              <CustomButton
                title={t('profil.save')}
                onPress={handleSave}
                isLoading={saving}
                className="mb-4"
              />

              {/* Sign Out Button */}
              <CustomButton
                title={t('profil.signOut')}
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







