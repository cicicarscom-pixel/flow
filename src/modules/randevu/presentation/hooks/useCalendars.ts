import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { container } from "../../../../core/container";
import { Calendar } from "../../domain/entities/Calendar";
import { ICalendarRepository } from "../../domain/repositories/ICalendarRepository";

export function useCalendars() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [multiCalendarEnabled, setMultiCalendarEnabled] = useState(false);
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const repo = useMemo(() => container.resolve("CalendarRepository") as ICalendarRepository, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      async function fetchAll() {
        setLoading(true);
        try {
          const enabled = await repo.getMultiCalendarEnabled();
          if (isActive) setMultiCalendarEnabled(enabled);
          if (enabled) {
            const data = await repo.getCalendars();
            if (isActive) setCalendars(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (isActive) setLoading(false);
        }
      }
      fetchAll();
      return () => { isActive = false; };
    }, [repo])
  );

  const createCalendar = async (name: string) => {
    try {
      const newCal = await repo.createCalendar(name);
      setCalendars(prev => [...prev, newCal]);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  
  const updateCalendar = async (id: string, name: string) => {
    try {
      const updatedCal = await repo.updateCalendar(id, name);
      setCalendars(prev => prev.map(c => c.id === id ? updatedCal : c));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteCalendar = async (id: string) => {
    try {
      await repo.deleteCalendar(id);
      setCalendars(prev => prev.filter(c => c.id !== id));
      if (activeCalendarId === id) setActiveCalendarId(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return {
    calendars,
    multiCalendarEnabled,
    activeCalendarId,
    setActiveCalendarId,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    loading
  };
}

