import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { styles } from './randevuStyles';

export function SlotsHeatmapCard({ activeCalendarId, add30Mins, daySchedule, deleteCalendarBlock, refreshDaySchedule, setIsModalVisible, setNewApptTime, setReserveConflicts, setReserveDurationType, setReserveError, setReserveModal, setReserveScope, showActionSheetWithOptions, t }) {
  return (
    <View style={styles.slotsCard}>
    <View style={styles.slotsHeader}>
      <Text style={styles.slotsTitle}>{t('randevu.randevuScreen.dailyAvailability')}</Text>
      <View style={styles.slotsLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22B573' }]} />
          <Text style={styles.legendText}>{t('randevu.randevuScreen.busy')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotEmpty]} />
          <Text style={styles.legendText}>{t('randevu.randevuScreen.free')}</Text>
        </View>
      </View>
    </View>
    
    {/* 3-row heatmap grid */}
    <View style={styles.heatmapWrap}>
      {/* Fixed row labels */}
      <View style={styles.rowLabels}>
        <Text style={styles.rowLabel}>{t('randevu.randevuScreen.morning')}</Text>
        <Text style={styles.rowLabel}>{t('randevu.randevuScreen.afternoon')}</Text>
        <Text style={styles.rowLabel}>{t('randevu.randevuScreen.evening')}</Text>
      </View>
    
      {/* Scrollable 3-row grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.heatmapGrid}
      >
        
      {/* Heatmap Grid implementation using semantic rows */}
      {(() => {
        const uniqueTimes = Array.from(new Set(daySchedule.map(s => s.local_time))).sort();
        const morningSlots = uniqueTimes.filter(t => t < '13:00' && t >= '00:01');
        const noonSlots = uniqueTimes.filter(t => t >= '13:00' && t < '18:30');
        const eveningSlots = uniqueTimes.filter(t => t >= '18:30' || t === '00:00');
        const maxCols = Math.max(morningSlots.length, noonSlots.length, eveningSlots.length);
        
        return Array.from({ length: maxCols }).map((_, col) => (
          <View key={col} style={styles.heatmapCol}>
            {[0, 1, 2].map(row => {
              const slotTime = row === 0 ? morningSlots[col] : row === 1 ? noonSlots[col] : eveningSlots[col];
              if (!slotTime) return <View key={row} style={[styles.heatCell, { backgroundColor: 'transparent', borderWidth: 0 }]} />;
              
              const slots = daySchedule.filter(s => s.local_time === slotTime);
              let status = 'free';
              let badge = null;
              let bId = '', bReason = '', bNote = '';
    
              if (activeCalendarId) {
                status = slots[0]?.status || 'free';
                bId = slots[0]?.block_id; bReason = slots[0]?.block_reason; bNote = slots[0]?.block_note;
              } else {
                if (slots.some(s => s.status === 'booked')) status = 'booked';
                  else if (slots.every(s => s.status === 'blocked')) status = 'blocked';
                  else if (slots.some(s => s.status === 'free')) status = 'free';
                  else if (slots.every(s => s.status === 'past')) status = 'past';
                  else status = 'booked';
                
                const blockedSlot = slots.find(s => s.status === 'blocked');
                if (blockedSlot) { bId = blockedSlot.block_id; bReason = blockedSlot.block_reason; bNote = blockedSlot.block_note; }
              }
    
              let bg = "rgba(255,255,255,0.03)", border = "1px solid rgba(255,255,255,0.06)", color = "#A79E96", opacity = 1;
              if (status === 'booked') { bg = "#22B573"; border = "rgba(34, 181, 115, 0.3)"; color = "#17151A"; }
              else if (status === 'blocked') { bg = "rgba(255,255,255,0.05)"; border = "1px dashed rgba(255,255,255,0.3)"; color = "#A79E96"; }
              else if (status === 'past') { opacity = 0.3; }
    
              return (
                <TouchableOpacity
                  key={row}
                  onPress={() => {
                    if (status === 'free' || (status === 'booked' && !activeCalendarId)) {
                      showActionSheetWithOptions({
                        options: [t('randevu.block.createAppointment'), t('randevu.block.reserve'), t('common.cancel')],
                        cancelButtonIndex: 2
                      }, (idx) => {
                        if (idx === 0) {
                          setNewApptTime(slotTime);
                          setIsModalVisible(true);
                        } else if (idx === 1) {
                          setReserveModal({ visible: true, time: slotTime, endTime: add30Mins(slotTime) });
                          setReserveError('');
                          setReserveConflicts([]);
                          setReserveDurationType('single');
                          setReserveScope(activeCalendarId ? 'doctor' : 'clinic');
                        }
                      });
                    } else if (status === 'blocked') {
                      showActionSheetWithOptions({
                        options: [t('randevu.block.removeReservation'), t('common.cancel')],
                        destructiveButtonIndex: 0,
                        cancelButtonIndex: 1,
                        title: `${bReason}${bNote ? ' - ' + bNote : ''} (${slotTime})`
                      }, async (idx) => {
                        if (idx === 0) {
                          const res = await deleteCalendarBlock(bId);
                          if (res.error) Alert.alert('Hata', t('musteriler.error'));
                          else refreshDaySchedule(activeCalendarId || undefined);
                        }
                      });
                    } else if (status === 'past') {
                      Alert.alert('', t('randevu.randevuScreen.slotPast'));
                    }
                  }}
                  style={[styles.heatCell, { backgroundColor: bg, borderColor: border, opacity, minWidth: 46, minHeight: 40 }]}
                >
                  {status === 'blocked' ? (
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[styles.heatLabel, { color, fontWeight: '800', fontSize: 12 }]}>{slotTime}</Text>
                        <Text style={{ color, fontWeight: '500', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                          {bReason === 'meeting' ? t('randevu.block.reasonMeeting') : bReason === 'leave' ? t('randevu.block.reasonLeave') : bReason === 'break' ? t('randevu.block.reasonBreak') : t('randevu.block.reasonOther')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.heatLabel, { color, fontWeight: status !== 'free' ? '800' : '500', fontSize: 12, textAlign: 'center' }]} numberOfLines={1}>
                        {slotTime}
                      </Text>
                    )}
                  {badge && (
                    <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#22B573', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 8 }}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ));
      })()}
      </ScrollView>
    </View>
    </View>
  );
}
