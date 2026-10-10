import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './dashboardStyles';
import { Skeleton } from './DashboardUi';
import { COLORS } from './dashboardTheme';

export function AppointmentsSection({ appointments, isLoading, navigation, t, todayAppointments, totalAppointments }) {
  return (
    <>
      {/* Bugünkü Randevu/Rezervasyonlar — dikey liste */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('dashboardScreen.appointments.todayTitle', 'Bugünkü Randevular')}</Text>
      </View>
      {isLoading ? (
        <View style={styles.apptList}><Skeleton width="100%" height={44} borderRadius={14} /><Skeleton width="100%" height={44} borderRadius={14} /></View>
      ) : todayAppointments.length > 0 ? (
        <View style={styles.apptList}>
          {todayAppointments.map(a => {
            const targetDate = a.dateText ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(a.dateText)) : null;
            return (
              <TouchableOpacity key={a.id} style={styles.apptListRow} onPress={() => {
                if (targetDate) navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
              }}>
                <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                <Text style={styles.apptListTime}>{a.time}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apptListTitle} numberOfLines={1}>{a.customerName}</Text>
                  {(a.calendarName || a.serviceName || a.note) ? (
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                       {a.calendarName ? <View style={{ backgroundColor: 'rgba(34,181,115,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}><Text style={{ color: '#22B573', fontSize: 11, fontWeight: '500' }}>{a.calendarName}</Text></View> : null}
                       {a.serviceName ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11 }}>🏷️ {a.serviceName}</Text> : null}
                       {a.note ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12 }}>📝 {a.note}</Text> : null}
                     </View>
                  ) : null}
                </View>
              </TouchableOpacity>
          )})}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('dashboardScreen.appointments.todayEmpty', 'Bugün için planlı randevu yok.')}</Text>
      )}
      
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('dashboardScreen.appointments.upcomingTitle', 'Yaklaşan Randevular')}</Text>
      </View>
      {isLoading ? (
        <View style={styles.apptList}><Skeleton width="100%" height={44} borderRadius={14} /><Skeleton width="100%" height={44} borderRadius={14} /></View>
      ) : appointments.length > 0 ? (
        <View style={styles.apptList}>
          {appointments.map(a => {
            const targetDate = a.dateText ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(a.dateText)) : null;
            const displayTime = (new Date(a.dateText).getDate() === new Date().getDate() ? '' : new Date(a.dateText).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + a.time;
            return (
              <TouchableOpacity key={a.id} style={styles.apptListRow} onPress={() => {
                if (targetDate) navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: targetDate } });
              }}>
                <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                <Text style={[styles.apptListTime, { width: 55, textAlign: 'right' }]}>{displayTime}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.apptListTitle} numberOfLines={1}>{a.customerName}</Text>
                  {(a.calendarName || a.serviceName || a.note) ? (
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                       {a.calendarName ? <View style={{ backgroundColor: 'rgba(34,181,115,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}><Text style={{ color: '#22B573', fontSize: 11, fontWeight: '500' }}>{a.calendarName}</Text></View> : null}
                       {a.serviceName ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11 }}>🏷️ {a.serviceName}</Text> : null}
                       {a.note ? <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12 }}>📝 {a.note}</Text> : null}
                     </View>
                  ) : null}
                </View>
              </TouchableOpacity>
          )})}
          {totalAppointments > appointments.length && (
            <TouchableOpacity onPress={() => navigation.navigate('Ai Asistan', { screen: 'RandevuMain' })} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#00F2FE', fontSize: 13, fontWeight: '500' }}>{t('dashboardScreen.appointments.viewAll', 'Tümünü gör')} ({totalAppointments})</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('dashboardScreen.appointments.empty', 'Yaklaşan randevu veya rezervasyon bulunmuyor.')}</Text>
      )}
    </>
  );
}
