import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { CustomerMapper } from '../mappers/CustomerMapper';
import { supabase } from '../../../../shared';

export class SupabaseCustomerRepository implements ICustomerRepository {
  async getCustomers(): Promise<Customer[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) return [];

    const orgId = session.user.id;

    // 1. Müşterileri çek
    const { data: customersRaw, error: cErr } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', orgId);

    if (cErr || !customersRaw) return [];

    // 2. Randevuları çek
    const { data: appointmentsRaw, error: aErr } = await supabase
      .from('appointments')
      .select('id, date, status, customer_phone, service_id')
      .eq('organization_id', orgId);

    const appointments = appointmentsRaw || [];

    // 3. Çoklu hizmet ilişkisini çek
    const appointmentIds = appointments.map((a: any) => a.id);
    let links: any[] = [];
    if (appointmentIds.length > 0) {
      const { data: linkData } = await supabase
        .from('appointment_services')
        .select('appointment_id, service_id')
        .in('appointment_id', appointmentIds);
      links = linkData || [];
    }

    const { data: servicesRaw } = await supabase
      .from('business_services')
      .select('id, name');

    const serviceNameById = new Map((servicesRaw || []).map((s: any) => [s.id, s.name]));
    
    // Randevu ID -> Hizmet isimleri listesi
    const servicesByAppointment = new Map<string, string[]>();
    for (const link of links) {
      const name = serviceNameById.get(link.service_id);
      if (!name) continue;
      const list = servicesByAppointment.get(link.appointment_id) || [];
      list.push(name);
      servicesByAppointment.set(link.appointment_id, list);
    }

    const customers = customersRaw.map((raw: any) => CustomerMapper.toDomain(raw));

    // 4. JS eşleştirme (customer.phone === appointment.customer_phone)
    return customers.map(c => {
      const cAppts = appointments.filter((a: any) => a.customer_phone === c.phone);
      
      const history = cAppts.map((a: any) => {
        let apptServices = servicesByAppointment.get(a.id) || [];
        if (apptServices.length === 0 && a.service_id && serviceNameById.get(a.service_id)) {
          apptServices = [serviceNameById.get(a.service_id) as string];
        }
        return {
          id: a.id,
          date: a.date,
          status: a.status,
          services: apptServices
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      c.history = history;
      c.totalAppointments = history.length;
      c.lastVisit = history.length > 0 ? history[0].date : null;
      
      return c;
    });
  }
}
