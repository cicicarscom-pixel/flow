export interface ICustomerRepository {
  getAll(): Promise<any[]>;
  getAppointments(id: string): Promise<any[]>;
  updateNotes(id: string, notes: string): Promise<any>;
  create(name: string, phone: string): Promise<any>;
}