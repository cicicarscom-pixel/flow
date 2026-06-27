import { Appointment } from '@domain/entities/Appointment';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';

export class AppointmentMapper {
  static toDomain(raw: any): Appointment {
    return new Appointment({
      id: raw.id,
      customerPhone: raw.customer_phone,
      customerName: raw.customer_name,
      serviceId: raw.service_id,
      employeeId: raw.employee_id,
      date: raw.date,
      status: raw.status as AppointmentStatus,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      bookingToken: raw.booking_token
    });
  }

  static toPersistence(entity: Appointment): any {
    return {
      id: entity.id,
      customer_phone: entity.customerPhone,
      customer_name: entity.customerName,
      service_id: entity.serviceId,
      employee_id: entity.employeeId,
      date: entity.date,
      status: entity.status,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      booking_token: entity.bookingToken
    };
  }
}
