import { IAppointmentRepository } from '@domain/repositories/IAppointmentRepository';
import { Appointment } from '@domain/entities/Appointment';
import { AppointmentMapper } from '../mappers/AppointmentMapper';
import { AppointmentStatus } from '@domain/enums/AppointmentStatus';
import { supabase } from '../../../../shared';
import { NetworkError } from '../../../../shared/errors/NetworkError';
import { todayInTimezone, addDaysYmd } from '../../../../lib/dates';

export class SupabaseAppointmentRepository implements IAppointmentRepository {

  async getDaySchedule(dateYmd: string, calendarId?: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_day_schedule', {
      p_date: dateYmd,
      p_calendar_id: calendarId || null
    });
    if (error) {
      console.error("getDaySchedule error:", error);
      return [];
    }
    return data || [];
  }

  async createCalendarBlock(calendarId: string | null, startLocal: string, endLocal: string, reason: string, note?: string): Promise<any> {
    const { data, error } = await supabase.rpc('create_calendar_block', {
      p_calendar_id: calendarId,
      p_local_start: startLocal,
      p_local_end: endLocal,
      p_reason: reason,
      p_note: note || null
    });
    if (error) return { error: error.message };
    return { data };
  }

  async deleteCalendarBlock(blockId: string): Promise<any> {
    const { data, error } = await supabase.rpc('delete_calendar_block', {
      p_block_id: blockId
    });
    if (error) return { error: error.message };
    return { data };
  }

  async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const { data, error } = await supabase.rpc('create_manual_appointment', {
      p_local_start: appointmentData.date.substring(0, 16),
      p_customer_name: appointmentData.customerName || null,
      p_customer_phone: appointmentData.customerPhone,
      p_calendar_id: appointmentData.calendarId || null,
      p_service_id: appointmentData.serviceId === 'Bilinmiyor' ? null : (appointmentData.serviceId || null),
      p_request_raw: appointmentData.customerRequestRaw || null,
      p_source: 'mobile'
    });

    if (error) {
      throw new Error("Ağ/Yetki hatası: " + error.message);
    }

    switch (data.status) {
      case "SUCCESS":
        return new Appointment({
          id: data.appointment_id,
          customerPhone: appointmentData.customerPhone,
          serviceId: appointmentData.serviceId || "",
          date: appointmentData.date,
          status: AppointmentStatus.Pending,
          bookingToken: "",
          startsAt: data.starts_at,
          endsAt: data.ends_at,
        });
      case "SLOT_TAKEN": throw new Error("Bu saat dolu");
      case "CUSTOMER_TIME_CONFLICT": throw new Error("Bu müşterinin bu saatte başka randevusu var");
      case "CALENDAR_REQUIRED": throw new Error("Lütfen bir doktor/takvim seçin");
      case "INVALID_LOCAL_TIME": throw new Error("Bu saat, saat değişikliği nedeniyle mevcut değil");
      case "CUSTOMER_REQUIRED": throw new Error("Müşteri adı ve telefonu zorunlu");
      default: throw new Error("Randevu oluşturulamadı (" + data.status + ")");
    }
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

  async cancel(id: string, reason?: string): Promise<void> {
    const { data, error } = await supabase.rpc('cancel_appointment', {
      p_appointment_id: id,
      p_reason: reason || null
    });

    if (error) {
      throw new NetworkError(`Randevu iptal edilirken hata: ${error.message}`);
    }

    if (data?.status !== 'SUCCESS') {
      throw new NetworkError(`Randevu iptal edilemedi (${data?.status})`);
    }
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await supabase.rpc('delete_appointment', {
      p_appointment_id: id
    });

    if (error) {
      throw new NetworkError(`Randevu silinirken hata: ${error.message}`);
    }

    if (data?.status !== 'SUCCESS') {
      throw new NetworkError(`Randevu silinemedi (${data?.status})`);
    }
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

  async getDayAppointmentsForCalendar(date: string, calendarId?: string): Promise<{starts_at: string | null, ends_at: string | null, timezone: string | null, status: string}[]> {
    const nextDayStr = addDaysYmd(date, 1);
    let query = supabase.from("appointments").select("starts_at, ends_at, timezone, status").gte("date", `${date}T00:00:00`).lt("date", `${nextDayStr}T00:00:00`);
    if (calendarId) query = query.eq("calendar_id", calendarId);
    const { data, error } = await query;
    if (error) throw new NetworkError(`Müsaitlik çekilemedi: ${error.message}`);
    return data || [];
  }

  async getAppointmentsByDate(date: string, calendarId?: string): Promise<Appointment[]> {
    const nextDayStr = addDaysYmd(date, 1);
    let query = supabase.from("appointments").select("*").gte("date", `${date}T00:00:00`).lt("date", `${nextDayStr}T00:00:00`).in("status", [AppointmentStatus.Pending, AppointmentStatus.Approved, AppointmentStatus.Cancelled]).order("created_at", { ascending: true });
    if (calendarId) query = query.eq("calendar_id", calendarId);
    const { data: appointments, error } = await query;

    if (error) {
      throw new NetworkError(`Randevular cekilemedi: ${error.message}`);
    }

    return this.enrichWithServices(appointments || []);
  }

  /** YENİ: Dashboard'daki "Randevu / Rezervasyon" widget'ı için — bugünden itibaren
   * kronolojik sırayla en yakın N adet Pending/Approved randevu/rezervasyon. */
  async getUpcomingAppointments(limit: number = 7): Promise<Appointment[]> {
    let timezone = 'Europe/Istanbul';
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.id) {
      const { data: orgData } = await supabase.from('organizations').select('timezone').eq('owner_id', user.user.id).maybeSingle();
      if (orgData?.timezone) timezone = orgData.timezone;
    }
    const todayStr = todayInTimezone(timezone);
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .in('status', [AppointmentStatus.Pending, AppointmentStatus.Approved])
      .order('starts_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new NetworkError(`Yaklaşan randevular çekilemedi: ${error.message}`);
    }

    return this.enrichWithServices(appointments || []);
  }

  /** appointment_services + business_services join'i ile services[] alanını doldurur.
   * Daha önce getAppointmentsByDate içinde inline duran kod — değişmedi, sadece taşındı. */
  
  private async enrichWithServices(appointments: any[]): Promise<Appointment[]> {
    if (!appointments || appointments.length === 0) return [];

    const { data: user } = await supabase.auth.getUser();
    let calsMap = new Map<string, string>();
    if (user?.user?.id) {
      const { data: cals } = await supabase.from('calendars').select('id, name');
      if (cals) {
        cals.forEach((c: any) => calsMap.set(c.id, c.name));
      }
    }


    const appointmentIds = appointments.map((a: any) => a.id);
    const { data: links } = await supabase
      .from('appointment_services')
      .select('appointment_id, service_id')
      .in('appointment_id', appointmentIds);

    const serviceIds = new Set<string>();
    appointments.forEach((a: any) => { if (a.service_id) serviceIds.add(a.service_id); });
    (links || []).forEach((l: any) => { if (l.service_id) serviceIds.add(l.service_id); });

    let services: any[] | null = null;
    if (serviceIds.size > 0 && user?.user?.id) {
      const { data } = await supabase
        .from('business_services')
        .select('id, name')
        .in('id', Array.from(serviceIds));
      services = data;
    }

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
      if (raw.calendar_id && calsMap.has(raw.calendar_id)) { raw.calendar_name = calsMap.get(raw.calendar_id); }
      const mapped = AppointmentMapper.toDomain(raw);
      const apptServices = servicesByAppointment.get(raw.id) || (raw.service_id && serviceNameById.get(raw.service_id) ? [serviceNameById.get(raw.service_id) as string] : []);
      mapped.services = apptServices;
      return mapped;
    });
  }

  subscribeToAppointments(
    date: string,
    calendarId: string | undefined,
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
          const fresh = await this.getAppointmentsByDate(date, calendarId);
          callback(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}


