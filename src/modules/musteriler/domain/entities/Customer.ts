export class Customer {
  id: string;
  organizationId: string;
  phone: string;
  name: string | null;
  notes: string | null;
  createdAt: string;
  history?: Array<{
    id: string;
    date: string;
    status: string;
    services: string[];
  }>;
  totalAppointments?: number;
  lastVisit?: string | null;

  constructor(data: {
    id: string;
    organizationId: string;
    phone: string;
    name?: string | null;
    notes?: string | null;
    createdAt?: string;
    history?: Array<{
      id: string;
      date: string;
      status: string;
      services: string[];
    }>;
    totalAppointments?: number;
    lastVisit?: string | null;
  }) {
    this.id = data.id;
    this.organizationId = data.organizationId;
    this.phone = data.phone;
    this.name = data.name || null;
    this.notes = data.notes || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.history = data.history;
    this.totalAppointments = data.totalAppointments;
    this.lastVisit = data.lastVisit;
  }
}
