import { AppointmentStatus } from '@domain/enums/AppointmentStatus';

export class Appointment {
  private readonly _id: string;
  private readonly _customerPhone: string;
  private readonly _customerName: string | null;
  private readonly _serviceId: string | null;
  private readonly _startsAt: string | null;
  private readonly _endsAt: string | null;
  private readonly _timezone: string | null;
  private readonly _employeeId: string | null;
  private readonly _date: string;
  private readonly _status: AppointmentStatus;
  private readonly _createdAt: string;
  private readonly _updatedAt: string;
  private readonly _bookingToken: string;
  private readonly _calendarId: string | null;
  private readonly _customerRequestRaw: string | null;
  private _services?: string[];

  constructor(data: {
    id: string;
    customerPhone: string;
    customerName?: string | null;
    serviceId: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    timezone?: string | null;
    employeeId?: string | null;
    date: string;
    status: AppointmentStatus;
    createdAt?: string;
    updatedAt?: string;
    bookingToken: string;
    calendarId?: string | null;
    services?: string[];
    customerRequestRaw?: string | null;
  }) {
    this._id = data.id;
    this._customerPhone = data.customerPhone;
    this._customerName = data.customerName || null;
    this._serviceId = data.serviceId || null;
    this._startsAt = data.startsAt || null;
    this._endsAt = data.endsAt || null;
    this._timezone = data.timezone || null;
    this._employeeId = data.employeeId || null;
    this._date = data.date;
    this._status = data.status;
    this._createdAt = data.createdAt || new Date().toISOString();
    this._updatedAt = data.updatedAt || new Date().toISOString();
    this._bookingToken = data.bookingToken;
    this._calendarId = data.calendarId || null;
    this._customerRequestRaw = data.customerRequestRaw || null;
    this._services = data.services;
  }

  get id(): string { return this._id; }
  get customerPhone(): string { return this._customerPhone; }
  get customerName(): string | null { return this._customerName; }
  get serviceId(): string | null { return this._serviceId; }
  get startsAt(): string | null { return this._startsAt; }
  get endsAt(): string | null { return this._endsAt; }
  get timezone(): string | null { return this._timezone; }
  get employeeId(): string | null { return this._employeeId; }
  get date(): string { return this._date; }
  get status(): AppointmentStatus { return this._status; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  get bookingToken(): string { return this._bookingToken; }
  get calendarId(): string | null { return this._calendarId; }
  get customerRequestRaw(): string | null { return this._customerRequestRaw; }
  get services(): string[] | undefined { return this._services; }
  set services(val: string[] | undefined) { this._services = val; }
}
