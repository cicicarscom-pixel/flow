import React from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { styles, CARD_COLORS } from './randevuStyles';
import { Ionicons } from '@expo/vector-icons';
import { extractTime } from '../../hooks/useAppointments';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';

export function AppointmentTimeline({ appointments, handleCardOptions, loading, t }) {
  return (
    <View style={styles.timeline}>
      {loading ? (
        <ActivityIndicator color="#22B573" style={{ marginTop: 24 }} />
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color="#756D66" />
          <Text style={styles.emptyText}>{t('randevu.randevuScreen.noAppointments')}</Text>
        </View>
      ) : (
        [...appointments].sort((a, b) => {
            const dateA = new Date(a.startsAt || a.date).getTime();
            const dateB = new Date(b.startsAt || b.date).getTime();
            return dateA - dateB;
          }).map((appt, index) => {
          const palette = CARD_COLORS[index % CARD_COLORS.length];
          const apptTime = appt.startsAt ? new Date(appt.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: appt.timezone ?? 'Europe/Istanbul' }) : extractTime(appt.date);
          return (
            <View key={appt.id} style={styles.timelineRow}>
              <View style={styles.timeCol}>
                <Text style={[styles.timeText, { color: palette.color }]}>{apptTime || '??:??'}</Text>
                <View style={styles.timeLine} />
              </View>
              <View style={[styles.card, { borderLeftColor: (appt.status === AppointmentStatus.Cancelled) ? '#666' : palette.border, opacity: (appt.status === AppointmentStatus.Cancelled) ? 0.5 : 1 }]}>
                <View style={[styles.cardTint, { backgroundColor: (appt.status === AppointmentStatus.Cancelled) ? '#66666611' : (palette.color + '08') }]} />
                <View style={styles.cardContent}>
    
                  <View style={[styles.iconBox, { backgroundColor: '#34303C' }]}>
                    <Ionicons name={palette.icon} size={20} color={palette.color} />
                  </View>
                  <View style={styles.cardInfo}>
    <TouchableOpacity onPress={() => handleCardOptions(appt)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ position: 'absolute', top: 10, right: 10, padding: 8, justifyContent: 'center' }}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#A79E96" />
                    </TouchableOpacity>
                    <Text style={styles.cardName}>
                      {appt.customerName || appt.customerPhone}
                    </Text>
                    {(appt.services && appt.services.length > 0) && (
                        <Text style={styles.cardService}>
                          {appt.services.join(' + ')}
                        </Text>
                      )}
                      {appt.customerRequestRaw && (
                        <Text style={[styles.cardService, { color: '#F59E0B' }]}>
                          📝 {appt.customerRequestRaw}
                        </Text>
                      )}
                    
                    {(appt.status === AppointmentStatus.Cancelled) && (
                      <Text style={[styles.cardService, { color: '#9ca3af', marginTop: 4 }]}>
                        {t('randevu.randevuScreen.actions.cancelledBadge')}
                      </Text>
                    )}
                    {(appt.status === AppointmentStatus.Cancelled) && appt.cancelReason && (
                      <Text style={[styles.cardService, { color: '#9ca3af' }]}>
                        {t('randevu.randevuScreen.actions.reasonBadge')}{appt.cancelReason}
                      </Text>
                    )}
                    <View style={styles.cardTimeRow}>
                      <Ionicons name="time-outline" size={12} color="#A79E96" />
                      <Text style={styles.cardTimeText}>{apptTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
