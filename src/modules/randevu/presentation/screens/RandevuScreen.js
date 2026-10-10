/* eslint-disable i18next/no-literal-string, no-unused-vars */
import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Animated, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useAppointments } from '../hooks/useAppointments';
import { useCalendars } from '../hooks/useCalendars';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';
import { supabase } from '../../../../shared';
import { styles } from './randevu/randevuStyles';
import { CalendarStepperSelector } from './randevu/CalendarStepperSelector';
import { SlotsHeatmapCard } from './randevu/SlotsHeatmapCard';
import { AppointmentTimeline } from './randevu/AppointmentTimeline';
import { ManageCalendarsModal } from './randevu/ManageCalendarsModal';
import { AppointmentFormModal } from './randevu/AppointmentFormModal';
import { ReserveModal } from './randevu/ReserveModal';


export default function RandevuScreen() {
  const { showActionSheetWithOptions } = useActionSheet();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [pulseAnim] = useState(() => new Animated.Value(1));

  const [reserveModal, setReserveModal] = useState({ visible: false, time: '', endTime: '' });
  const [reserveScope, setReserveScope] = useState('doctor');
  const [reserveDurationType, setReserveDurationType] = useState('single');
  const [reserveReason, setReserveReason] = useState('meeting');
  const [reserveNote, setReserveNote] = useState('');
  const [reserveError, setReserveError] = useState('');
  const [reserveConflicts, setReserveConflicts] = useState([]);

  const add30Mins = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const d = new Date(); d.setHours(h, m + 30, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };


  const handleCardOptions = (appt) => {
    const isCancelled = appt.status === AppointmentStatus.Cancelled;
    const options = isCancelled 
      ? [t('randevu.randevuScreen.actions.delete'), t('randevu.randevuScreen.actions.back')] 
      : [t('randevu.randevuScreen.actions.cancel'), t('randevu.randevuScreen.actions.delete'), t('randevu.randevuScreen.actions.back')];
    const destructiveIndex = isCancelled ? 0 : 1;
    const cancelIndex = isCancelled ? 1 : 2;

    showActionSheetWithOptions({
      options,
      cancelButtonIndex: cancelIndex,
      destructiveButtonIndex: destructiveIndex,
    }, (btnIndex) => {
      if (btnIndex === (isCancelled ? 0 : 1)) {
        Alert.alert(t('randevu.randevuScreen.actions.deleteTitle'), t('randevu.randevuScreen.actions.deleteWarning'), [
          { text: t('randevu.randevuScreen.actions.back'), style: 'cancel' },
          { text: t('randevu.randevuScreen.actions.delete'), style: 'destructive', onPress: async () => {
            try {
              if (deleteAppointment) await deleteAppointment(appt.id);
              Alert.alert('', t('randevu.randevuScreen.actions.deleteSuccess'));
            } catch (err) {
              Alert.alert(t('randevu.randevuScreen.actions.genericError'), err.message);
            }
          }}
        ]);
      } else if (!isCancelled && btnIndex === 0) {
        setPromptConfig({
          visible: true,
          title: t('randevu.randevuScreen.actions.cancelTitle'),
          placeholder: t('randevu.randevuScreen.actions.reasonLabel'),
          value: '',
          onSave: async (reason) => {
            try {
              if (cancelAppointment) await cancelAppointment(appt.id, reason);
              Alert.alert('', t('randevu.randevuScreen.actions.cancelSuccess'));
            } catch (err) {
              Alert.alert(t('randevu.randevuScreen.actions.genericError'), err.message);
            }
          }
        });
      }
    });
  };


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

  const { appointments, loading, daySchedule, refreshDaySchedule, createCalendarBlock, deleteCalendarBlock, selectedDate, setSelectedDate, addAppointment, cancelAppointment, deleteAppointment } = useAppointments(route.params?.date || todayStr, activeCalendarId); // MODIFIED
  
  
  React.useEffect(() => {
    if (route.params?.date) {
      setSelectedDate(route.params.date);
    }
  }, [route.params?.date]);

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
          const { data } = await supabase.from('business_services').select('*');
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
        try {
          const { data, error } = await supabase.rpc('get_available_slots', { p_date: selectedDate, p_service_id: newApptService || null, p_calendar_id: newApptCalendarId || null });
          if (error) throw error;
          setAvailableModalHours(data || []);
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
            
              <CalendarStepperSelector activeCalendarId={activeCalendarId} calendars={calendars} createCalendar={createCalendar} setActiveCalendarId={setActiveCalendarId} setIsManageModalVisible={setIsManageModalVisible} setPromptConfig={setPromptConfig} />

            
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
          
            <SlotsHeatmapCard activeCalendarId={activeCalendarId} add30Mins={add30Mins} daySchedule={daySchedule} deleteCalendarBlock={deleteCalendarBlock} refreshDaySchedule={refreshDaySchedule} setIsModalVisible={setIsModalVisible} setNewApptTime={setNewApptTime} setReserveConflicts={setReserveConflicts} setReserveDurationType={setReserveDurationType} setReserveError={setReserveError} setReserveModal={setReserveModal} setReserveScope={setReserveScope} showActionSheetWithOptions={showActionSheetWithOptions} t={t} />
        </View>

        {/* ── SCROLLABLE: Appointment Timeline ── */}
        <AppointmentTimeline appointments={appointments} handleCardOptions={handleCardOptions} loading={loading} t={t} />
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
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalOverlay, { justifyContent: 'flex-start', paddingTop: insets.top + 90, paddingHorizontal: 16 }]}>
            <View style={[styles.modalContent, { borderRadius: 24, paddingBottom: 20 }]}>
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
        <ManageCalendarsModal calendars={calendars} deleteCalendar={deleteCalendar} isManageModalVisible={isManageModalVisible} setIsManageModalVisible={setIsManageModalVisible} setPromptConfig={setPromptConfig} updateCalendar={updateCalendar} />

        <AppointmentFormModal availableModalHours={availableModalHours} calendars={calendars} handleSaveAppointment={handleSaveAppointment} isModalVisible={isModalVisible} isSaving={isSaving} newApptCalendarId={newApptCalendarId} newApptName={newApptName} newApptNote={newApptNote} newApptPhone={newApptPhone} newApptService={newApptService} newApptTime={newApptTime} selectedDate={selectedDate} services={services} setIsModalVisible={setIsModalVisible} setNewApptCalendarId={setNewApptCalendarId} setNewApptName={setNewApptName} setNewApptNote={setNewApptNote} setNewApptPhone={setNewApptPhone} setNewApptService={setNewApptService} setNewApptTime={setNewApptTime} setSelectedDate={setSelectedDate} setShowCalendarDropdown={setShowCalendarDropdown} setShowDatePicker={setShowDatePicker} showCalendarDropdown={showCalendarDropdown} showDatePicker={showDatePicker} t={t} />


      {/* Reserve Modal */}
      <ReserveModal activeCalendarId={activeCalendarId} add30Mins={add30Mins} calendars={calendars} createCalendarBlock={createCalendarBlock} isSaving={isSaving} refreshDaySchedule={refreshDaySchedule} reserveDurationType={reserveDurationType} reserveError={reserveError} reserveModal={reserveModal} reserveNote={reserveNote} reserveReason={reserveReason} reserveScope={reserveScope} selectedDate={selectedDate} setIsSaving={setIsSaving} setReserveConflicts={setReserveConflicts} setReserveDurationType={setReserveDurationType} setReserveError={setReserveError} setReserveModal={setReserveModal} setReserveNote={setReserveNote} setReserveReason={setReserveReason} setReserveScope={setReserveScope} t={t} />

    </SafeAreaView>
  );
}

