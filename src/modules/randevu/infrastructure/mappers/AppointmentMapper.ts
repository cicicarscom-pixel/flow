import { Appointment } from '@domain/entities/Appointment';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';

export class AppointmentMapper {
  static toDomain(raw: any): Appointment {
    return new Appointment({
      id: raw.id,
      customerPhone: raw.customer_phone,
      customerName: raw.customer_name,
      serviceId: raw.service_id,
      startsAt: raw.starts_at,
      endsAt: raw.ends_at,
      timezone: raw.timezone,
      employeeId: raw.employee_id,
      date: raw.date,
      status: raw.status as AppointmentStatus,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      bookingToken: raw.booking_token,
      calendarId: raw.calendar_id,
      calendarName: raw.calendar_name,
      customerRequestRaw: raw.customer_request_raw,
      cancelReason: raw.cancel_reason
    });
  }

  static toPersistence(entity: Appointment): any {
    return {
      id: entity.id,
      customer_phone: entity.customerPhone,
      customer_name: entity.customerName,
      service_id: entity.serviceId,
      starts_at: entity.startsAt,
      ends_at: entity.endsAt,
      timezone: entity.timezone,
      employee_id: entity.employeeId,
      date: entity.date,
      status: entity.status,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      booking_token: entity.bookingToken,
      calendar_id: entity.calendarId,
      customer_request_raw: entity.customerRequestRaw,
      cancel_reason: entity.cancelReason
    };
  }
}
