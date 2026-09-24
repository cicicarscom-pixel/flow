import { useState, useEffect } from "react";
import { container } from "../../../../core/container";
import { Calendar } from "../../domain/entities/Calendar";
import { ICalendarRepository } from "../../domain/repositories/ICalendarRepository";

export function useCalendars() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [multiCalendarEnabled, setMultiCalendarEnabled] = useState(false);
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const repo = container.resolve("CalendarRepository") as ICalendarRepository;

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const enabled = await repo.getMultiCalendarEnabled();
        setMultiCalendarEnabled(enabled);
        if (enabled) {
          const data = await repo.getCalendars();
          setCalendars(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const createCalendar = async (name: string) => {
    try {
      const newCal = await repo.createCalendar(name);
      setCalendars(prev => [...prev, newCal]);
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
    loading
  };
}

