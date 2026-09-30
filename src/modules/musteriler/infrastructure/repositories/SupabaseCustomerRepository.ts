import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { supabase } from '../../../../shared';

export class SupabaseCustomerRepository implements ICustomerRepository {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_customers');
    if (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
    return data || [];
  }

  async getAppointments(id: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_customer_appointments', { p_customer_id: id });
    if (error) {
      console.error("Error fetching customer appointments:", error);
      return [];
    }
    return data || [];
  }

  async updateNotes(id: string, notes: string): Promise<any> {
    const { data, error } = await supabase.rpc('update_customer_notes', { p_customer_id: id, p_notes: notes });
    if (error) return { status: 'ERROR', error };
    return data || { status: 'ERROR' };
  }

  async create(name: string, phone: string): Promise<any> {
    const { data, error } = await supabase.rpc('create_customer', { p_name: name, p_phone: phone });
    if (error) return { status: 'ERROR', error };
    return data || { status: 'ERROR' };
  }
}