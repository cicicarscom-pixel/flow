import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { supabase } from '../../shared/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, ActivityIndicator, Text, View, TouchableOpacity } from 'react-native';
import { appointmentSentence } from '../../lib/appointmentSentence';
import { Ionicons } from '@expo/vector-icons';

export const AppointmentNotifications = ({ navigation, onRead, onCleared }) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchNotifs = async () => {
    try {
      setErrorMsg(null);
      // Tek doğru kaynak: silinen/iptal edilen randevuların bildirimleri gelmez (sunucu RPC'si).
      const { data, error } = await supabase.rpc('get_appointment_notifications', { p_limit: 10 });
      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.warn('Notifs error', e);
      setErrorMsg('Bildirimler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifs();
    }, [])
  );

  const handlePress = async (n) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, is_read: true } : p));
      if (onRead) onRead();
    }
    const targetDate = n.metadata?.starts_at ? new Intl.DateTimeFormat('en-CA', { timeZone: n.metadata.timezone || 'Europe/Istanbul' }).format(new Date(n.metadata.starts_at)) : null;
    if (targetDate) {
      navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
    }
  };

  // Yalnız randevu bildirimleri silinir (sunucu RPC'si kimliği kendisi çözer); randevular ve konuşmalar silinmez.
  const handleClear = () => {
    Alert.alert(
      t('dashboardScreen.appointmentNotifications.clearTitle'),
      t('dashboardScreen.appointmentNotifications.clearConfirm'),
      [
        { text: t('dashboardScreen.appointmentNotifications.clearCancel'), style: 'cancel' },
        {
          text: t('dashboardScreen.appointmentNotifications.clear'),
          style: 'destructive',
          onPress: async () => {
            const { data, error } = await supabase.rpc('clear_appointment_notifications');
            if (error || data?.status !== 'SUCCESS') {
              console.warn('Clear notifs error', error || data);
              Alert.alert(t('dashboardScreen.appointmentNotifications.clearFailed'));
              return;
            }
            setNotifications([]);
            if (onCleared) onCleared();
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator size="small" color="#00F2FE" />;
  if (errorMsg) return <Text style={{ color: '#FF4D4D', textAlign: 'center' }}>{errorMsg}</Text>;
  if (notifications.length === 0) return <Text style={{ color: '#849495', textAlign: 'center' }}>Henüz randevu bildirimi yok</Text>;

  return (
    <View style={{ gap: 10 }}>
      {notifications.map(n => {
        const m = n.metadata || {};
        const lang = i18n.language?.startsWith('en') ? 'en' : (i18n.language?.startsWith('de') ? 'de' : 'tr');
        const localeStr = lang === 'en' ? 'en-US' : (lang === 'de' ? 'de-DE' : 'tr-TR');
        const dateText = m.starts_at ? new Date(m.starts_at).toLocaleString(localeStr, { timeZone: m.timezone || 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
        const name = m.customer_name || t('dashboardScreen.appointmentNotifications.unknownCustomer');
        
        let title = '';
        if (lang === 'tr') {
            title = appointmentSentence(name, dateText, m.calendar_name);
        } else {
            title = m.calendar_name
              ? t('dashboardScreen.appointmentNotifications.sentenceWithResource', { name, when: dateText, resource: m.calendar_name })
              : t('dashboardScreen.appointmentNotifications.sentence', { name, when: dateText });
        }
        
        return (
          <TouchableOpacity key={n.id} onPress={() => handlePress(n)} style={{
            backgroundColor: n.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(34, 181, 115, 0.1)',
            padding: 12, borderRadius: 12, borderWidth: 1, 
            borderColor: n.is_read ? 'transparent' : '#22B573',
            borderLeftWidth: n.is_read ? 1 : 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22B573', marginRight: 8, marginTop: 4 }} />}
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: n.is_read ? '400' : 'bold', flex: 1 }}>{title}</Text>
            </View>
            {!!m.calendar_name && (
              <View style={{ backgroundColor: 'rgba(34,181,115,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: 'flex-start', marginTop: 6, marginLeft: n.is_read ? 0 : 16 }}>
                <Text style={{ color: '#22B573', fontSize: 11, fontWeight: '500' }}>{m.calendar_name}</Text>
              </View>
            )}
            {!!m.customer_request_raw && <Text style={{ color: '#849495', fontSize: 12, marginTop: 2, marginLeft: n.is_read ? 0 : 16 }}>📝 {m.customer_request_raw}</Text>}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={handleClear} style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(248,81,73,0.35)', backgroundColor: 'rgba(248,81,73,0.1)' }}>
        <Ionicons name="trash-outline" size={14} color="#FF7A70" />
        <Text style={{ color: '#FF7A70', fontSize: 12, fontWeight: '700', marginLeft: 6 }}>{t('dashboardScreen.appointmentNotifications.clear')}</Text>
      </TouchableOpacity>
    </View>
  );
};
