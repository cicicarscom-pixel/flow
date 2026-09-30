import { useState, useEffect } from "react";
import { todayInTimezone } from "../../../../lib/dates";
import { container } from "../../../../core/container";
import { SupabaseAppointmentRepository } from "@infrastructure/repositories/SupabaseAppointmentRepository";
import { Appointment } from "@domain/entities/Appointment";
import { AppointmentStatus } from "@domain/enums/AppointmentStatus";


export function extractTime(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr.split("T")[1].substring(0, 5);
  if (dateStr.includes(" ")) return dateStr.split(" ")[1].substring(0, 5);
  return "";
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export interface UseAppointmentsResult {
  daySchedule: any[];
  refreshDaySchedule: (calId?: string) => Promise<void>;
  createCalendarBlock: (calId: string | null, start: string, end: string, reason: string, note?: string) => Promise<any>;
  deleteCalendarBlock: (id: string) => Promise<any>;
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isSlotBusy: (timeSlot: string) => boolean;
  addAppointment: (appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

export function useAppointments(initialDate?: string, activeCalendarId?: string | null): UseAppointmentsResult {
  const today = todayInTimezone('Europe/Istanbul'); // Will be updated by component if needed
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const repo = container.resolve("AppointmentRepository") as SupabaseAppointmentRepository;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const fetchAndSubscribe = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await repo.getAppointmentsByDate(selectedDate, activeCalendarId || undefined);
        if (!cancelled) setAppointments(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Randevular yuklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }

      unsubscribe = repo.subscribeToAppointments(selectedDate, activeCalendarId || undefined, (fresh) => {
        if (!cancelled) setAppointments(fresh);
      });
    };

    fetchAndSubscribe();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedDate, activeCalendarId]);

  const isSlotBusy = (timeSlot: string): boolean => {
    return coreIsSlotBusy(
      timeSlot,
      selectedDate,
      appointments.map(a => ({
        starts_at: a.startsAt,
        ends_at: a.endsAt,
        timezone: a.timezone,
        status: a.status
      }))
    );
  };

  
  const reloadAppointments = async () => {
    try {
      const data = await repo.getAppointmentsByDate(selectedDate, activeCalendarId || undefined);
      setAppointments(data);
    } catch (e: any) {
      setError(e.message || "Yenileme hatası");
    }
  };

  const cancelAppointment = async (id: string, reason?: string) => {
    try {
      setLoading(true);
      if (repo.cancel) await repo.cancel(id, reason);
      await reloadAppointments();
    } catch (e: any) {
      setError(e.message || "İptal edilemedi");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      setLoading(true);
      if (repo.delete) await repo.delete(id);
      await reloadAppointments();
    } catch (e: any) {
      setError(e.message || "Silinemedi");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">) => {
    try {
      setLoading(true);
      await repo.create(appointment);
      const data = await repo.getAppointmentsByDate(selectedDate, activeCalendarId || undefined);
      setAppointments(data);
    } catch (e: any) {
      setError(e.message || "Randevu eklenemedi");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  
  const refreshDaySchedule = async (calId?: string) => {
    // @ts-ignore
    const data = await repo.getDaySchedule(selectedDate, calId);
    setDaySchedule(data);
  };
  const createCalendarBlock = async (calId: string | null, start: string, end: string, reason: string, note?: string) => {
    // @ts-ignore
    return repo.createCalendarBlock(calId, start, end, reason, note);
  };
  const deleteCalendarBlock = async (id: string) => {
    // @ts-ignore
    return repo.deleteCalendarBlock(id);
  };

  useEffect(() => {
    refreshDaySchedule();
  }, [selectedDate, appointments]);

  return {
    daySchedule,
    refreshDaySchedule,
    createCalendarBlock,
    deleteCalendarBlock, appointments, loading, error, selectedDate, setSelectedDate, isSlotBusy, addAppointment, cancelAppointment, deleteAppointment };
}

