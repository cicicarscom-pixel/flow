import { AppointmentStatus } from './AppointmentStatus.ts';

export interface AppointmentDTO {
  id?: string;
  customerPhone: string;
  customerName?: string | null;
  serviceId: string;
  employeeId?: string | null;
  date: string;
  status: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
  bookingToken: string;
}
