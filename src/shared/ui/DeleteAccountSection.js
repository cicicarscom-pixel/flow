import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { PRIVACY_POLICY_URL } from '../lib/legalUrls';

// Hesabı kalıcı silme (Google Play zorunluluğu). Sunucuda `delete-account` Edge Function'ı çalışır; kimlik JWT'den çözülür.
// Kullanıcı kendi e-postasını yazarak onaylar, ardından bir kez daha sorulur.
const CONFIRM_TOKEN = 'DELETE_MY_ACCOUNT';

export default function DeleteAccountSection({ email }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const matches = !!email && typed.trim().toLowerCase() === String(email).trim().toLowerCase();

  const doDelete = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: CONFIRM_TOKEN } });
      if (error || !data?.success) {
        let code = data?.error;
        try { code = code || (await error?.context?.json?.())?.error; } catch (_) { /* gövde okunamadı */ }
        Alert.alert(t('accountDelete.title'), code === 'ADMIN_ACCOUNT' ? t('accountDelete.adminBlocked') : t('accountDelete.error'));
        return;
      }
      await supabase.auth.signOut();
    } catch (e) {
      Alert.alert(t('accountDelete.title'), t('accountDelete.error'));
    } finally {
      setBusy(false);
    }
  };

  const confirmFinal = () => {
    Alert.alert(t('accountDelete.title'), t('accountDelete.finalConfirm'), [
      { text: t('accountDelete.cancel'), style: 'cancel' },
      { text: t('accountDelete.button'), style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <View style={{ marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
      <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} style={{ alignSelf: 'center', paddingVertical: 8 }}>
        <Text style={{ color: '#9CC2FF', fontSize: 13 }}>{t('accountDelete.privacy')}</Text>
      </TouchableOpacity>

      {!open ? (
        <TouchableOpacity onPress={() => setOpen(true)} style={{ alignSelf: 'center', paddingVertical: 10, marginTop: 6 }}>
          <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>{t('accountDelete.title')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ marginTop: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 15, marginBottom: 6 }}>{t('accountDelete.title')}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18, marginBottom: 12 }}>{t('accountDelete.warning')}</Text>
          <Text style={{ color: '#E2E8F0', fontSize: 12, marginBottom: 6 }}>{t('accountDelete.confirmLabel')}</Text>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{email}</Text>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholderTextColor="#A79E96"
            style={{ color: '#F6F1EC', backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => { setOpen(false); setTyped(''); }} disabled={busy} style={{ paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 }}>
              <Text style={{ color: '#A79E96', fontWeight: '700' }}>{t('accountDelete.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmFinal} disabled={!matches || busy} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#EF4444', opacity: matches && !busy ? 1 : 0.5, minWidth: 120, alignItems: 'center' }}>
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>{t('accountDelete.button')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
