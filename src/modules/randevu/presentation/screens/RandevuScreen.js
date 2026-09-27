/* eslint-disable i18next/no-literal-string, no-unused-vars */
import React, { useState, useRef, useMemo } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, Animated, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppointments, extractTime } from '../hooks/useAppointments';
import { useCalendars } from '../hooks/useCalendars';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';
import { supabase } from '../../../../shared';

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
  { color: '#22B573', border: 'rgba(34, 181, 115,0.35)', icon: 'cut-outline' },
  { color: '#F59E0B', border: 'rgba(245, 158, 11,0.35)',  icon: 'color-wand-outline' },
  { color: '#F4D9B8', border: 'rgba(192,193,255,0.25)', icon: 'leaf-outline' },
  { color: '#22B573', border: 'rgba(34, 181, 115,0.25)',  icon: 'brush-outline' },
];

export default function RandevuScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // -- Dynamic Date State --
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const calendarScrollRef = useRef(null);

  React.useEffect(() => {
    const index = dynamicDays.findIndex(d => d.fullDate === selectedDate);
    if (index !== -1 && calendarScrollRef.current) {
      calendarScrollRef.current.scrollTo({ x: index * 60 - 150, animated: true });
    }
  }, [selectedDate, dynamicDays]);

  const dynamicDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    const locale = i18n.language || 'tr-TR';

    for (let i = 1; i <= numDays; i++) {
      const d = new Date(year, month, i);
      let dayName = d.toLocaleString(locale, { weekday: 'short' });
      if (dayName) {
        dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        if (dayName.endsWith('.')) dayName = dayName.slice(0, -1);
      } else {
        dayName = '';
      }
      
      days.push({
        name: dayName,
        date: String(i).padStart(2, '0'),
        fullDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    return days;
  }, [currentDate.getFullYear(), currentDate.getMonth(), i18n.language]);

  // Initial selected date is today
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  
  // ── Supabase veri bağlantısı ──
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newApptName, setNewApptName] = useState('');
  const [newApptPhone, setNewApptPhone] = useState('');
  const [newApptTime, setNewApptTime] = useState('10:00');
  const [newApptService, setNewApptService] = useState('');
  const [newApptNote, setNewApptNote] = useState('');
  const [services, setServices] = useState([]);
  const [newApptCalendarId, setNewApptCalendarId] = useState(null);
  const [availableModalHours, setAvailableModalHours] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [promptConfig, setPromptConfig] = useState({ visible: false, title: "", placeholder: "", value: "", onSave: null });

  const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar, updateCalendar, deleteCalendar } = useCalendars();

  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);
  
  React.useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        setCurrentDate(prev => {
          if (d.getMonth() !== prev.getMonth() || d.getFullYear() !== prev.getFullYear()) {
            return d;
          }
          return prev;
        });
      }
    }
  }, [selectedDate]);
  
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('business_services').select('*').eq('merchant_id', user.id);
          if (data && data.length > 0) {
            setServices(data);
            setNewApptService(data[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchServices();
  }, []);
  
  React.useEffect(() => { if(isModalVisible && activeCalendarId) setNewApptCalendarId(activeCalendarId); else if(isModalVisible) setNewApptCalendarId(calendars[0]?.id || null); }, [isModalVisible, activeCalendarId, calendars]);
  
  React.useEffect(() => {
    if (isModalVisible) {
      const fetchHours = async () => {
        const repo = require("../../../../core/container").container.resolve("AppointmentRepository");
        const { isSlotBusy } = require("../../../../lib/slotBusy");
        try {
          const dayAppts = await repo.getDayAppointmentsForCalendar(selectedDate, newApptCalendarId || undefined);
          const allHours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
          const hours = allHours.filter(hour => !isSlotBusy(hour, selectedDate, dayAppts));
          setAvailableModalHours(hours);
        } catch (e) {
          Alert.alert("Hata", e.message || "Saatler cekilemedi");
        }
      };
      fetchHours();
    }
  }, [isModalVisible, selectedDate, newApptService, newApptCalendarId]);

  const handleDaySelect = (dayObj) => {
    setSelectedDate(dayObj.fullDate);
  };

  const handleSaveAppointment = async () => {
    if (!newApptName || !newApptPhone || !newApptTime) {
      Alert.alert('Eksik Bilgi', 'Lütfen müşteri adı, telefon numarası ve saat seçiniz.');
      return;
    }
    try {
      setIsSaving(true);
      await addAppointment({
        customerName: newApptName,
        customerPhone: newApptPhone,
        date: `${selectedDate}T${newApptTime}:00`,
        serviceId: newApptService || null,
          calendarId: newApptCalendarId || undefined,
          customerRequestRaw: newApptNote || null,
          status: AppointmentStatus.Pending,
        bookingToken: Math.random().toString(36).substring(7)
      });
      setIsModalVisible(false);
      setNewApptName('');
      setNewApptPhone('');
      setNewApptTime('10:00');
      setNewApptNote('');
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", e.message || "Randevu eklenemedi");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString(i18n.language || 'tr-TR', { month: 'long' });
  const monthYearStr = monthName ? `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}, ${currentDate.getFullYear()}` : '';

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
            <Ionicons name="person" size={18} color="#22B573" />
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Text style={styles.headerLabel}>RANDEVU</Text>
          </View>
        </View>

        <View style={styles.dateSelectorPill}>
          <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={18} color="#A79E96" />
          </TouchableOpacity>
          <Text style={styles.dateSelectorText}>{monthYearStr}</Text>
          <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 4 }}>
            <Ionicons name="chevron-forward" size={18} color="#A79E96" />
          </TouchableOpacity>
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
            {/* Personel / Takvim Stepper Selector */}
            
              <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14, gap: 16, width: '100%' }}>
                  <TouchableOpacity 
                      onPress={() => setIsManageModalVisible(true)}
                      style={{ width: '45%', maxWidth: 160, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '500' }}>Düzenle</Text>
                    </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      setPromptConfig({
                        visible: true,
                        title: "Yeni Takvim",
                        placeholder: "Yeni takvim/personel adını girin",
                        value: "",
                        onSave: (name) => {
                          if (name && name.trim()) {
                            createCalendar(name.trim()).catch(e => Alert.alert("Hata", e.message));
                          }
                        }
                      });
                    }}
                    style={{ width: '45%', maxWidth: 160, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(34, 181, 115, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 181, 115, 0.3)' }}
                  >
                    <Text style={{ color: '#22B573', fontSize: 14, fontWeight: '500' }}>+ Yeni Ekle</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.dateSelectorPill, { width: '100%', maxWidth: '100%' }]}>
                  <TouchableOpacity 
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 10 }}
                    onPress={() => {
                      const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
                      if (allOptions.length <= 1) return;
                      const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
                      const prevIndex = (currentIndex - 1 + allOptions.length) % allOptions.length;
                      setActiveCalendarId(allOptions[prevIndex].id);
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#A79E96" />
                  </TouchableOpacity>
                  
                  <Text style={[styles.dateSelectorText, { flex: 1, textAlign: 'center', fontSize: 16 }]} numberOfLines={1}>
                    {activeCalendarId ? (calendars.find(c => c.id === activeCalendarId)?.name || 'Bilinmiyor') : 'Tümü'}
                  </Text>
                  
                  <TouchableOpacity 
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 10 }}
                    onPress={() => {
                      const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
                      if (allOptions.length <= 1) return;
                      const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
                      const nextIndex = (currentIndex + 1) % allOptions.length;
                      setActiveCalendarId(allOptions[nextIndex].id);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#A79E96" />
                  </TouchableOpacity>
                </View>
              </View>

            
            {/* Weekly Calendar Strip */}
          <ScrollView
            ref={calendarScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarStrip}
            style={styles.calendarScroll}
          >
            {dynamicDays.map((day, i) => {
              const isActive = selectedDate === day.fullDate;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayCard, isActive && styles.dayCardActive]}
                  onPress={() => handleDaySelect(day)}
                >
                  <Text style={[styles.dayName, isActive && styles.dayNameActive]}>
                    {day.name}
                  </Text>
                  <Text style={[styles.dayDate, isActive && styles.dayDateActive]}>
                    {day.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Slots — 3-row heatmap */}
          
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
            <ActivityIndicator color="#22B573" style={{ marginTop: 24 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#756D66" />
              <Text style={styles.emptyText}>{t('randevu.randevuScreen.noAppointments')}</Text>
            </View>
          ) : (
            appointments.map((appt, index) => {
              const palette = CARD_COLORS[index % CARD_COLORS.length];
              const apptTime = appt.startsAt ? new Date(appt.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: appt.timezone ?? 'Europe/Istanbul' }) : extractTime(appt.date);
              return (
                <View key={appt.id} style={styles.timelineRow}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: palette.color }]}>{apptTime || '??:??'}</Text>
                    <View style={styles.timeLine} />
                  </View>
                  <View style={[styles.card, { borderLeftColor: palette.border }]}>
                    <View style={[styles.cardTint, { backgroundColor: palette.color + '08' }]} />
                    <View style={styles.cardContent}>
                      <View style={[styles.iconBox, { backgroundColor: '#34303C' }]}>
                        <Ionicons name={palette.icon} size={20} color={palette.color} />
                      </View>
                      <View style={styles.cardInfo}>
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
      </ScrollView>

      {/* ── FAB ── */}
      <Animated.View style={[styles.fab, { bottom: fabBottom, transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity style={styles.fabInner} activeOpacity={0.8} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add" size={28} color="#1C3327" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── ADD APPOINTMENT MODAL ── */}
      
        
        {/* Custom Prompt Modal */}
        <Modal visible={promptConfig.visible} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{promptConfig.title}</Text>
              <TextInput
                 style={[styles.modalInput, { marginTop: 20 }]}
                 placeholder={promptConfig.placeholder}
                 placeholderTextColor="#A79E96"
                 value={promptConfig.value}
                 onChangeText={(t) => setPromptConfig(p => ({...p, value: t}))}
                 autoFocus
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 15 }}>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null })}>
                  <Text style={{ color: '#A79E96', fontSize: 16 }}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        
        {/* Personel Yönetimi Modalı */}
        <Modal visible={isManageModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Takvim / Personel Yönetimi</Text>
                <TouchableOpacity onPress={() => setIsManageModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#A79E96" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {calendars.length === 0 ? (
                  <Text style={{ color: '#A79E96', textAlign: 'center', marginVertical: 20 }}>Henüz takvim bulunmuyor.</Text>
                ) : (
                  calendars.map(cal => (
                    <View key={cal.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                      <Text style={{ color: '#fff', fontSize: 16, flex: 1 }} numberOfLines={1}>{cal.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 20, marginLeft: 10 }}>
                        <TouchableOpacity onPress={() => {
                            setPromptConfig({
                            visible: true,
                            title: "Takvimi Düzenle",
                            placeholder: "Yeni takvim adı",
                            value: cal.name,
                            onSave: (newName) => {
                              if (newName && newName.trim()) {
                                updateCalendar(cal.id, newName.trim()).catch(e => Alert.alert("Hata", e.message));
                              }
                            }
                          });
                        }}>
                          <Ionicons name="pencil" size={22} color="#22B573" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            Alert.alert("Emin misiniz?", `'${cal.name}' silinecek.`, [
                              { text: "İptal", style: "cancel" },
                              { text: "Sil", style: "destructive", onPress: () => {
                                  deleteCalendar(cal.id).catch(e => Alert.alert("Hata", e.message));
                                }
                              }
                            ]);
                        }}>
                          <Ionicons name="trash" size={22} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { 
              backgroundColor: '#201D24', padding: 32, borderRadius: 32, 
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, 
              shadowOpacity: 0.4, shadowRadius: 48, elevation: 10,
                maxHeight: Platform.OS === 'ios' ? '85%' : '90%'
              }]}>
              
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={{ 
                  position: 'absolute', top: 20, right: 20, width: 36, height: 36, 
                  borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', 
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', 
                  alignItems: 'center', justifyContent: 'center', zIndex: 10 
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
              
              <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  keyboardShouldPersistTaps="handled"
                  style={{ flexShrink: 1, width: '100%' }}
                  contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
                >
                <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <View style={{ 
                  width: 64, height: 64, borderRadius: 32, 
                  backgroundColor: 'rgba(34,181,115,0.2)', 
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12 
                }}>
                  <Text style={{ fontSize: 32 }}>🪄</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', margin: 0 }}>
                  {t('randevu.randevuScreen.addAppointment', 'Yeni Randevu Ekle')}
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                  Takviminize yeni bir kayıt oluşturun
                </Text>
              </View>
              
                            <Text style={styles.webModalLabel}>Tarih</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.webModalInput, { marginBottom: 16, justifyContent: 'center' }]}
              >
                <Text style={{ color: selectedDate ? '#fff' : '#A79E96', fontSize: 14 }}>
                  {selectedDate || 'YYYY-AA-GG'}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate ? new Date(selectedDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onValueChange={(selectedDateObj) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selectedDateObj) {
                      const y = selectedDateObj.getFullYear();
                      const m = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
                      const d = String(selectedDateObj.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${d}`);
                    }
                  }}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 }}>
                  <Text style={{ color: '#22B573', fontWeight: 'bold' }}>Bitti</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.webModalLabel}>Müşteri Adı</Text>
              <TextInput
                style={styles.webModalInput}
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newApptName}
                onChangeText={setNewApptName}
              />

              <Text style={styles.webModalLabel}>Telefon Numarası</Text>
              <TextInput
                style={styles.webModalInput}
                placeholder="Örn: +90 555 123 4567"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newApptPhone}
                onChangeText={setNewApptPhone}
                keyboardType="phone-pad"
              />

              <View style={{ marginBottom: 16, zIndex: 10 }}>
                <Text style={styles.webModalLabel}>Takvim</Text>
                <TouchableOpacity 
                  style={[styles.webModalInput, { paddingVertical: 14, marginBottom: 0 }]} 
                  onPress={() => setShowCalendarDropdown(!showCalendarDropdown)}
                >
                  <Text style={{ color: newApptCalendarId ? '#fff' : 'rgba(255, 255, 255, 0.4)' }}>
                    {newApptCalendarId ? calendars.find(c => c.id === newApptCalendarId)?.name : "Seçiniz"}
                  </Text>
                </TouchableOpacity>
                
                {showCalendarDropdown && (
                  <View style={{ position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: '#1A181C', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', zIndex: 20 }}>
                    {calendars.map(cal => (
                      <TouchableOpacity 
                        key={cal.id} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                        onPress={() => { setNewApptCalendarId(cal.id); setShowCalendarDropdown(false); }}
                      >
                        <Text style={{ color: newApptCalendarId === cal.id ? '#22B573' : '#fff' }}>{cal.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              
              
              {services.length > 0 && (
                <View style={{ marginBottom: 16, zIndex: 1 }}>
                  <Text style={styles.webModalLabel}>Hizmet Tipi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {services.map(s => (
                      <TouchableOpacity 
                        key={s.id}
                        onPress={() => setNewApptService(s.id)}
                        style={[styles.chip, newApptService === s.id && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, newApptService === s.id && styles.chipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ marginBottom: 16, zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Açıklama / Not</Text>
                <TextInput
                  style={[styles.webModalInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Yapay zekaya verilen notlar gibi... (Örn: Dolgum düştü dolgu yaptırmak istiyorum)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  value={newApptNote}
                  onChangeText={setNewApptNote}
                />
              </View>

              <View style={{ zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Saat</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {availableModalHours.map(hour => (
                      <TouchableOpacity 
                        key={hour}
                        onPress={() => setNewApptTime(hour)}
                        style={[styles.chip, newApptTime === hour && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, newApptTime === hour && styles.chipTextActive]}>{hour}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={styles.webSaveButton}
                activeOpacity={0.8}
                onPress={handleSaveAppointment}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#1C3327" />
                ) : (
                  <Text style={styles.webSaveButtonText}>{t('randevu.randevuScreen.saveAppointment', 'Randevu Oluştur')}</Text>
                )}
              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#201D24' },
  scroll: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(60,74,66,0.12)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 20,
    backgroundColor: 'rgba(34, 181, 115,0.12)',
    borderWidth: 1, borderColor: 'rgba(34, 181, 115,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerLabel: { fontSize: 12, fontWeight: '700', color: '#22B573', letterSpacing: 1.5 },
  dateSelectorPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  dateSelectorText: { fontSize: 15, fontWeight: '700', color: '#F6F1EC' },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(53,52,55,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#22B573', borderWidth: 1, borderColor: '#201D24',
  },

  /* Sticky Block */
  stickyBlock: { backgroundColor: '#201D24', paddingBottom: 6 },

  /* Calendar Strip */
  calendarScroll: { marginTop: 12, marginBottom: 4 },
  calendarStrip: { paddingHorizontal: 14, gap: 8 },
  dayCard: {
    alignItems: 'center', justifyContent: 'center',
    width: 52, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCardActive: {
    backgroundColor: '#22B573',
    shadowColor: '#22B573', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  dayName: { fontSize: 10, fontWeight: '700', color: '#A79E96' },
  dayNameActive: { color: '#1C3327', opacity: 0.85 },
  dayDate: { fontSize: 16, fontWeight: '700', color: '#F6F1EC', marginTop: 2 },
  dayDateActive: { color: '#1C3327' },

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
  slotsTitle: { fontSize: 14, fontWeight: '600', color: '#F6F1EC' },
  slotsLegend: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendDotEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#756D66' },
  legendText: { fontSize: 10, fontWeight: '700', color: '#A79E96', letterSpacing: 0.5 },

  /* Heatmap grid */
  heatmapWrap: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  rowLabels: { justifyContent: 'space-around', paddingVertical: 2, gap: 5 },
  rowLabel: {
    fontSize: 8, fontWeight: '700', color: '#A79E96',
    letterSpacing: 0.5, textAlign: 'right', width: 36,
  },
  heatmapGrid: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  heatmapCol: { flexDirection: 'column', gap: 5 },
  heatCell: {
    width: 44, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(42,42,44,0.7)',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heatCellFull: {
    backgroundColor: '#22B573',
    borderColor: 'transparent',
    shadowColor: '#22B573', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  heatLabel: { fontSize: 9, fontWeight: '700', color: '#A79E96' },
  heatLabelFull: { color: '#1C3327' },

  /* Timeline */
  timeline: { paddingHorizontal: 14, paddingTop: 16, gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  timeCol: { alignItems: 'center', width: 44, paddingTop: 2 },
  timeText: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  timeLine: {
    width: 1.5, flex: 1,
    backgroundColor: 'rgba(60,74,66,0.3)', borderRadius: 4,
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
  cardName: { fontSize: 14, fontWeight: '700', color: '#F6F1EC' },
  cardService: { fontSize: 10, color: '#A79E96', marginTop: 2 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  cardTimeText: { fontSize: 10, fontWeight: '600', color: '#A79E96' },

  badge: {
    borderLeftWidth: 2, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, zIndex: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  /* FAB */
  fab: { position: 'absolute', right: 18 },
  fabInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, gap: 10,
  },
  emptyText: {
    fontSize: 13, color: '#756D66', fontWeight: '600',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: '#201D24',
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      maxHeight: '90%'
    },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F6F1EC' },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#A79E96', marginBottom: 6, marginTop: 12 },
  chip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    chipActive: { backgroundColor: '#22B573', borderColor: '#22B573' },
    chipText: { color: '#A79E96', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#17151A' },
  
  webModalLabel: {
    fontSize: 12, fontWeight: '600', color: '#A79E96', marginBottom: 8, paddingLeft: 4
  },
  webModalInput: {
    width: '100%', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, marginBottom: 16
  },
  webSaveButton: {
    width: '100%', padding: 16, borderRadius: 16, marginTop: 8,
    backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4
  },
  webSaveButtonText: {
    color: '#17151A', fontWeight: '700', fontSize: 15
  },
  modalInput: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: '#F6F1EC', fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#22B573',
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
    shadowColor: '#22B573', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#1C3327' }
});
