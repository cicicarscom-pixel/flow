import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppointments, extractTime } from '../hooks/useAppointments';

const DAYS = [
  { name: 'Pzt', date: '11' }, { name: 'Sal', date: '12' },
  { name: 'Car', date: '13' }, { name: 'Per', date: '14' },
  { name: 'Cum', date: '15' }, { name: 'Cmt', date: '16' },
  { name: 'Paz', date: '17' },
];

// Generate 30-min slots from 08:00 to 00:00
const TIME_SLOTS = (() => {
  const slots = [];
  const fullSlots = new Set(['09:00', '09:30', '11:00', '13:00', '13:30', '16:00']);
  for (let h = 8; h < 24; h++) {
    ['00', '30'].forEach(m => {
      const time = `${String(h).padStart(2, '0')}:${m}`;
      slots.push({ time, full: fullSlots.has(time) });
    });
  }
  slots.push({ time: '00:00', full: false });
  return slots;
})();

// Renk paleti — randevu index'ine göre döngüsel
const CARD_COLORS = [
  { color: '#4edea3', border: 'rgba(78,222,163,0.35)', icon: 'cut-outline' },
  { color: '#ffb95f', border: 'rgba(255,185,95,0.35)',  icon: 'color-wand-outline' },
  { color: '#c0c1ff', border: 'rgba(192,193,255,0.25)', icon: 'leaf-outline' },
  { color: '#4edea3', border: 'rgba(78,222,163,0.25)',  icon: 'brush-outline' },
];

export default function RandevuScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeDay, setActiveDay] = useState(1);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // ── Supabase veri bağlantısı ──
  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate } = useAppointments('2025-11-12');

  const handleDaySelect = (index) => {
    setActiveDay(index);
    const dayObj = DAYS[index];
    setSelectedDate(`2025-11-${dayObj.date}`);
  };

  // FAB pulse
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const tabBarBottom = Math.max(insets.bottom + 10, 20);
  const tabBarHeight = 64;
  const fabBottom = tabBarBottom + tabBarHeight + 14;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── TOP APP BAR ── */}
      <BlurView intensity={40} tint="dark" style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={18} color="#4edea3" />
          </View>
          <View>
            <Text style={styles.headerLabel}>DASHBOARD</Text>
            <View style={styles.headerDateRow}>
              <Text style={styles.headerDate}>{t('randevu.randevuScreen.monthYear')}</Text>
              <Ionicons name="chevron-down" size={16} color="#4edea3" />
            </View>
          </View>
        </View>

      </BlurView>

      {/* ── MAIN SCROLL with sticky header ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: fabBottom + 80 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* ── STICKY BLOCK (index 0): Calendar + Time Slots ── */}
        <View style={styles.stickyBlock}>

          {/* Weekly Calendar Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarStrip}
            style={styles.calendarScroll}
          >
            {DAYS.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayCard, activeDay === i && styles.dayCardActive]}
                onPress={() => handleDaySelect(i)}
              >
                <Text style={[styles.dayName, activeDay === i && styles.dayNameActive]}>
                  {day.name}
                </Text>
                <Text style={[styles.dayDate, activeDay === i && styles.dayDateActive]}>
                  {day.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Slots — 3-row heatmap */}
          <View style={styles.slotsCard}>
            <View style={styles.slotsHeader}>
              <Text style={styles.slotsTitle}>{t('randevu.randevuScreen.dailyAvailability')}</Text>
              <View style={styles.slotsLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4edea3' }]} />
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
                {/* Column-per-slot: 11 columns × 3 rows */}
                {Array.from({ length: 11 }).map((_, col) => (
                  <View key={col} style={styles.heatmapCol}>
                    {[0, 1, 2].map(row => {
                      const slot = TIME_SLOTS[row * 11 + col];
                      if (!slot) return <View key={row} style={styles.heatCell} />;
                      const busy = isSlotBusy(slot.time);
                      return (
                        <TouchableOpacity
                          key={row}
                          style={[styles.heatCell, busy && styles.heatCellFull]}
                        >
                          <Text style={[styles.heatLabel, busy && styles.heatLabelFull]}>
                            {slot.time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* ── SCROLLABLE: Appointment Timeline ── */}
        <View style={styles.timeline}>
          {loading ? (
            <ActivityIndicator color="#4edea3" style={{ marginTop: 24 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#3c4a42" />
              <Text style={styles.emptyText}>{t('randevu.randevuScreen.noAppointments')}</Text>
            </View>
          ) : (
            appointments.map((appt, index) => {
              const palette = CARD_COLORS[index % CARD_COLORS.length];
              const apptTime = extractTime(appt.date);
              return (
                <View key={appt.id} style={styles.timelineRow}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: palette.color }]}>{apptTime || '??:??'}</Text>
                    <View style={styles.timeLine} />
                  </View>
                  <View style={[styles.card, { borderLeftColor: palette.border }]}>
                    <View style={[styles.cardTint, { backgroundColor: palette.color + '08' }]} />
                    <View style={styles.cardContent}>
                      <View style={[styles.iconBox, { backgroundColor: '#2a2a2c' }]}>
                        <Ionicons name={palette.icon} size={20} color={palette.color} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>
                          {appt.customerName || appt.customerPhone}
                        </Text>
                        <Text style={styles.cardService}>{appt.serviceId}</Text>
                        <View style={styles.cardTimeRow}>
                          <Ionicons name="time-outline" size={12} color="#bbcabf" />
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
      </ScrollView>

      {/* ── FAB ── */}
      <Animated.View style={[styles.fab, { bottom: fabBottom, transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity style={styles.fabInner} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#003824" />
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#131315' },
  scroll: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(60,74,66,0.12)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(78,222,163,0.12)',
    borderWidth: 1, borderColor: 'rgba(78,222,163,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerLabel: { fontSize: 10, fontWeight: '700', color: '#4edea3', letterSpacing: 1.5 },
  headerDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerDate: { fontSize: 14, fontWeight: '700', color: '#e5e1e4' },
  headerBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(53,52,55,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#4edea3', borderWidth: 1.5, borderColor: '#131315',
  },

  /* Sticky Block */
  stickyBlock: { backgroundColor: '#131315', paddingBottom: 6 },

  /* Calendar Strip */
  calendarScroll: { marginTop: 12, marginBottom: 4 },
  calendarStrip: { paddingHorizontal: 14, gap: 8 },
  dayCard: {
    alignItems: 'center', justifyContent: 'center',
    width: 52, height: 64, borderRadius: 14,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCardActive: {
    backgroundColor: '#4edea3',
    shadowColor: '#4edea3', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  dayName: { fontSize: 10, fontWeight: '700', color: '#bbcabf' },
  dayNameActive: { color: '#003824', opacity: 0.85 },
  dayDate: { fontSize: 16, fontWeight: '700', color: '#e5e1e4', marginTop: 2 },
  dayDateActive: { color: '#003824' },

  /* Slots Card */
  slotsCard: {
    marginHorizontal: 14, marginTop: 10,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 12,
  },
  slotsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  slotsTitle: { fontSize: 14, fontWeight: '600', color: '#e5e1e4' },
  slotsLegend: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendDotEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3c4a42' },
  legendText: { fontSize: 10, fontWeight: '700', color: '#bbcabf', letterSpacing: 0.5 },

  /* Heatmap grid */
  heatmapWrap: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  rowLabels: { justifyContent: 'space-around', paddingVertical: 2, gap: 5 },
  rowLabel: {
    fontSize: 8, fontWeight: '700', color: '#bbcabf',
    letterSpacing: 0.5, textAlign: 'right', width: 36,
  },
  heatmapGrid: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  heatmapCol: { flexDirection: 'column', gap: 5 },
  heatCell: {
    width: 44, height: 28, borderRadius: 7,
    backgroundColor: 'rgba(42,42,44,0.7)',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heatCellFull: {
    backgroundColor: '#4edea3',
    borderColor: 'transparent',
    shadowColor: '#4edea3', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  heatLabel: { fontSize: 9, fontWeight: '700', color: '#7a8a80' },
  heatLabelFull: { color: '#003824' },

  /* Timeline */
  timeline: { paddingHorizontal: 14, paddingTop: 16, gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  timeCol: { alignItems: 'center', width: 44, paddingTop: 2 },
  timeText: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  timeLine: {
    width: 1.5, flex: 1,
    backgroundColor: 'rgba(60,74,66,0.3)', borderRadius: 2,
  },

  /* Appointment Card */
  card: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 4, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardTint: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, zIndex: 1 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#e5e1e4' },
  cardService: { fontSize: 10, color: '#bbcabf', marginTop: 2 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  cardTimeText: { fontSize: 10, fontWeight: '600', color: '#bbcabf' },

  badge: {
    borderLeftWidth: 2, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, zIndex: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  /* FAB */
  fab: { position: 'absolute', right: 18 },
  fabInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#4edea3', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4edea3', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, gap: 10,
  },
  emptyText: {
    fontSize: 13, color: '#3c4a42', fontWeight: '600',
  },
});
