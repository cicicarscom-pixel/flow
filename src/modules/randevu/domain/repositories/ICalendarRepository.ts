import { Calendar } from "../entities/Calendar";

export interface ICalendarRepository {
  getCalendars(): Promise<Calendar[]>;
  createCalendar(name: string): Promise<Calendar>;
  getMultiCalendarEnabled(): Promise<boolean>;
  updateCalendar(id: string, name: string): Promise<Calendar>;
  deleteCalendar(id: string): Promise<void>;
}

