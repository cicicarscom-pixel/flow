import { Appointment } from '@domain/entities/Appointment';

export interface IAppointmentRepository {
  create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment>;
  approve(id: string): Promise<Appointment>;
  cancel(id: string): Promise<Appointment>;
  findByToken(token: string): Promise<Appointment | null>;
  findAvailableHours(date: string, serviceId: string): Promise<string[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  subscribeToAppointments(date: string, callback: (appointments: Appointment[]) => void): () => void;
}
