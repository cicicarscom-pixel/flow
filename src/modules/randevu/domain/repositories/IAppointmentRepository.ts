import { Appointment } from '@domain/entities/Appointment';

export interface IAppointmentRepository {
  create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment>;
  approve(id: string): Promise<Appointment>;
  cancel(id: string, reason?: string): Promise<void>;
  delete(id: string): Promise<void>;
  findByToken(token: string): Promise<Appointment | null>;
  getDayAppointmentsForCalendar(date: string, calendarId?: string): Promise<{starts_at: string | null, ends_at: string | null, timezone: string | null, status: string}[]>;
  getAppointmentsByDate(date: string, calendarId?: string): Promise<Appointment[]>;
  getUpcomingAppointments(limit: number): Promise<Appointment[]>;
  subscribeToAppointments(date: string, calendarId: string | undefined, callback: (appointments: Appointment[]) => void): () => void;
}
