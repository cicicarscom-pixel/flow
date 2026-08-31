import { AppointmentStatus } from '@domain/enums/AppointmentStatus';

export class Appointment {
  private readonly _id: string;
  private readonly _customerPhone: string;
  private readonly _customerName: string | null;
  private readonly _serviceId: string;
  private readonly _employeeId: string | null;
  private readonly _date: string;
  private readonly _status: AppointmentStatus;
  private readonly _createdAt: string;
  private readonly _updatedAt: string;
  private readonly _bookingToken: string;
  private _services?: string[];

  constructor(data: {
    id: string;
    customerPhone: string;
    customerName?: string | null;
    serviceId: string;
    employeeId?: string | null;
    date: string;
    status: AppointmentStatus;
    createdAt?: string;
    updatedAt?: string;
    bookingToken: string;
    services?: string[];
  }) {
    this._id = data.id;
    this._customerPhone = data.customerPhone;
    this._customerName = data.customerName || null;
    this._serviceId = data.serviceId;
    this._employeeId = data.employeeId || null;
    this._date = data.date;
    this._status = data.status;
    this._createdAt = data.createdAt || new Date().toISOString();
    this._updatedAt = data.updatedAt || new Date().toISOString();
    this._bookingToken = data.bookingToken;
    this._services = data.services;
  }

  get id(): string { return this._id; }
  get customerPhone(): string { return this._customerPhone; }
  get customerName(): string | null { return this._customerName; }
  get serviceId(): string { return this._serviceId; }
  get employeeId(): string | null { return this._employeeId; }
  get date(): string { return this._date; }
  get status(): AppointmentStatus { return this._status; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  get bookingToken(): string { return this._bookingToken; }
  get services(): string[] | undefined { return this._services; }
  set services(val: string[] | undefined) { this._services = val; }
}
