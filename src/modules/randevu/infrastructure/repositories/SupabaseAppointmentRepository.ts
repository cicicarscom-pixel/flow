import { IAppointmentRepository } from '@domain/repositories/IAppointmentRepository';
import { Appointment } from '@domain/entities/Appointment';
import { AppointmentMapper } from '../mappers/AppointmentMapper';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';
import { supabase } from '../../../../shared';
import { NetworkError } from '../../../../shared/errors/NetworkError';

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const rawData = {
      customer_phone: appointmentData.customerPhone,
      customer_name: appointmentData.customerName,
      service_id: appointmentData.serviceId,
      employee_id: appointmentData.employeeId,
      date: appointmentData.date,
      status: appointmentData.status,
      booking_token: appointmentData.bookingToken
    };

    const { data, error } = await supabase.from('appointments').insert([rawData]).select().single();
    
    if (error) {
      throw new NetworkError(`Randevu oluşturulurken hata: ${error.message}`);
    }
    
    return AppointmentMapper.toDomain(data);
  }

  async approve(id: string): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: AppointmentStatus.Approved, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NetworkError(`Randevu onaylanırken hata: ${error.message}`);
    }

    return AppointmentMapper.toDomain(data);
  }

  async cancel(id: string): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: AppointmentStatus.Cancelled, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NetworkError(`Randevu iptal edilirken hata: ${error.message}`);
    }

    return AppointmentMapper.toDomain(data);
  }

  async findByToken(token: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('booking_token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new NetworkError(`Randevu token ile aranırken hata: ${error.message}`);
    }

    return AppointmentMapper.toDomain(data);
  }

  async findAvailableHours(date: string, serviceId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('date')
      .like('date', `${date}%`)
      .in('status', [AppointmentStatus.Pending, AppointmentStatus.Approved]);

    if (error) return [];
    const bookedTimes = (data || []).map((r: any) => {
      const d = r.date || '';
      const t = d.includes('T') ? d.split('T')[1] : d.split(' ')[1] || '';
      return t.substring(0, 5);
    });
    const allHours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
    return allHours.filter(h => !bookedTimes.includes(h));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .like('date', `${date}%`)
      .in('status', [AppointmentStatus.Pending, AppointmentStatus.Approved])
      .order('created_at', { ascending: true });

    if (error) {
      throw new NetworkError(`Randevular cekilemedi: ${error.message}`);
    }
    
    if (!appointments || appointments.length === 0) return [];
    
    const appointmentIds = appointments.map((a: any) => a.id);
    const { data: links } = await supabase
      .from('appointment_services')
      .select('appointment_id, service_id')
      .in('appointment_id', appointmentIds);
      
    const { data: services } = await supabase
      .from('business_services')
      .select('id, name');
      
    const serviceNameById = new Map((services || []).map((s: any) => [s.id, s.name]));
    const servicesByAppointment = new Map<string, string[]>();
    for (const link of links || []) {
      const name = serviceNameById.get(link.service_id);
      if (!name) continue;
      const list = servicesByAppointment.get(link.appointment_id) || [];
      list.push(name);
      servicesByAppointment.set(link.appointment_id, list);
    }
    
    return appointments.map((raw: any) => {
      const mapped = AppointmentMapper.toDomain(raw);
      const apptServices = servicesByAppointment.get(raw.id) || (raw.service_id && serviceNameById.get(raw.service_id) ? [serviceNameById.get(raw.service_id) as string] : []);
      mapped.services = apptServices;
      return mapped;
    });
  }

  subscribeToAppointments(
    date: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    const channel = supabase
      .channel(`appointments-date-${date}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        async () => {
          // Re-fetch tüm randevuları her değişiklikte
          const fresh = await this.getAppointmentsByDate(date);
          callback(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
