import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../shared';
import { isBelowMin } from './versionCompare';

// F4-2 — Zorunlu güncelleme kapısı. Veritabanındaki app_version_policy (platform başına asgari sürüm) bu uygulamanın
// sürümünden büyükse tam ekran kilit gösterir. FAIL-OPEN: ağ/okuma hatasında kilitlemez (yanlışlıkla herkesi kilitlemeyiz).
// Kapıyı açan/kapatan tek şey veritabanındaki satırdır; uygulama içinde sürüm sabiti tutulmaz.

const CURRENT_VERSION = Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? null;

export default function ForceUpdateGate({ children }) {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState(null); // {min_version, store_url} | null

  const check = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_version_policy')
        .select('min_version, store_url')
        .eq('platform', Platform.OS === 'ios' ? 'ios' : 'android')
        .maybeSingle();
      if (error) return; // fail-open
      setPolicy(data || null);
    } catch (_) {
      // fail-open
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => sub.remove();
  }, [check]);

  if (policy && isBelowMin(CURRENT_VERSION, policy.min_version)) {
    return (
      <View testID="force_update_gate" style={{ flex: 1, backgroundColor: '#0B0F14', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>{t('updateGate.title')}</Text>
        <Text style={{ color: '#B8C4D2', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 }}>{t('updateGate.body')}</Text>
        {policy.store_url ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(policy.store_url).catch(() => {})}
            style={{ marginTop: 24, backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('updateGate.button')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  return children;
}
