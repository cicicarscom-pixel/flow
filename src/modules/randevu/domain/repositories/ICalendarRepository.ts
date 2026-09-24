import { Calendar } from "../entities/Calendar";

export interface ICalendarRepository {
  getCalendars(): Promise<Calendar[]>;
  createCalendar(name: string): Promise<Calendar>;
  getMultiCalendarEnabled(): Promise<boolean>;
}

