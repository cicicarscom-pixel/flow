import { useState, useEffect } from 'react';
import { container } from '../../../../core/container';
import { SupabaseAppointmentRepository } from '../../infrastructure/repositories/SupabaseAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentStatus } from '../../domain/enums/AppointmentStatus';

// Appointment'ın date alanından "HH:MM" formatında saat çıkarır
export function extractTime(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr.split('T')[1].substring(0, 5);
  if (dateStr.includes(' ')) return dateStr.split(' ')[1].substring(0, 5);
  return '';
}

// Seçili tarihi "YYYY-MM-DD" formatında döndürür
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  /** Saat diliminin dolu olup olmadığını kontrol eder (PENDING veya APPROVED randevu varsa true) */
  isSlotBusy: (timeSlot: string) => boolean;
}

export function useAppointments(initialDate?: string): UseAppointmentsResult {
  const today = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const repo = container.resolve('AppointmentRepository') as SupabaseAppointmentRepository;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const fetchAndSubscribe = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await repo.getAppointmentsByDate(selectedDate);
        if (!cancelled) setAppointments(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Randevular yuklenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Realtime aboneliği başlat
      unsubscribe = repo.subscribeToAppointments(selectedDate, (fresh) => {
        if (!cancelled) setAppointments(fresh);
      });
    };

    fetchAndSubscribe();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedDate]);

  const isSlotBusy = (timeSlot: string): boolean => {
    return appointments.some(appt => {
      const apptTime = extractTime(appt.date);
      return (
        apptTime === timeSlot &&
        (appt.status === AppointmentStatus.Approved ||
          appt.status === AppointmentStatus.Pending)
      );
    });
  };

  return { appointments, loading, error, selectedDate, setSelectedDate, isSlotBusy };
}
