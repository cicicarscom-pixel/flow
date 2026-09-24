import { Appointment } from '@domain/entities/Appointment';

export interface IAppointmentRepository {
  create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment>;
  approve(id: string): Promise<Appointment>;
  cancel(id: string): Promise<Appointment>;
  findByToken(token: string): Promise<Appointment | null>;
  findAvailableHours(date: string, serviceId: string, calendarId?: string): Promise<string[]>;
  getAppointmentsByDate(date: string, calendarId?: string): Promise<Appointment[]>;
  getUpcomingAppointments(limit: number): Promise<Appointment[]>;
  subscribeToAppointments(date: string, calendarId: string | undefined, callback: (appointments: Appointment[]) => void): () => void;
}
