import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";
import { AppointmentDTO } from '../contracts/AppointmentDTO.ts';
import { AppointmentStatus } from '../contracts/AppointmentStatus.ts';

// Add the missing enum to match the database
export enum AppointmentEventType {
  CREATED = 'CREATED',
  SLOT_SELECTED = 'SLOT_SELECTED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export class AppointmentService {
  private supabaseAdmin: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseAdmin = supabaseClient;
  }

  /**
   * Idempotency Layer (Tekrar Önleyici)
   * Gelen eventId (webhook id veya idempotency key) daha önce islenmis mi diye bakar.
   */
  private async processEvent(appointmentId: string, eventId: string, eventType: AppointmentEventType, payload: Record<string, unknown>): Promise<boolean> {
    try {
      // Idempotency Check: payload içerisinde aynı eventId var mı?
      const { data: existingEvent, error: searchError } = await this.supabaseAdmin
        .from('appointment_events')
        .select('id')
        .eq('appointment_id', appointmentId)
        .eq('event_type', eventType)
        .contains('payload', { eventId })
        .maybeSingle();

      if (searchError) {
        console.error(`[AppointmentService] Event aranırken hata oluştu: ${searchError.message}`);
        throw new Error(`Event arama hatası: ${searchError.message}`);
      }

      if (existingEvent) {
        console.warn(`[AppointmentService] Idempotency kalkanı: ${eventId} ID'li ${eventType} eventi zaten işlenmiş. Yoksayılıyor.`);
        return false; // Already processed
      }

      // Event'i sisteme kaydet (Append-only)
      const { error: insertError } = await this.supabaseAdmin
        .from('appointment_events')
        .insert([{
          appointment_id: appointmentId,
          event_type: eventType,
          payload: { ...payload, eventId }
        }]);

      if (insertError) {
        console.error(`[AppointmentService] Event kaydedilirken hata oluştu: ${insertError.message}`);
        throw new Error(`Event kayıt hatası: ${insertError.message}`);
      }

      return true; // Successfully processed and logged
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`processEvent Error: ${err.message}`);
      }
      throw new Error('processEvent Error: Unknown error');
    }
  }

  /**
   * State Transition Guard ve Onaylama İşlemi
   */
  async approveAppointment(appointmentId: string, timeSlot: string, eventId: string): Promise<AppointmentDTO | null> {
    try {
      // 1. Durum Kontrolü (State Transition Guard)
      const { data: currentAppt, error: fetchError } = await this.supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !currentAppt) {
        console.error(`[AppointmentService] Randevu bulunamadı: ${appointmentId}`);
        throw new Error("Randevu bulunamadı veya veritabanı hatası.");
      }

      // Guard Rule: PENDING veya SLOT_SELECTED değilse işlem yapılamaz
      if (currentAppt.status !== AppointmentStatus.Pending && currentAppt.status !== 'SLOT_SELECTED') {
        console.warn(`[AppointmentService] Geçersiz Durum Geçişi: Randevu zaten ${currentAppt.status} durumunda. Onaylama durduruldu.`);
        return null;
      }

      // 2. Event Sourcing İşlem Sırası (Idempotency + Insert Event)
      const isNewEvent = await this.processEvent(appointmentId, eventId, AppointmentEventType.APPROVED, { timeSlot });
      if (!isNewEvent) {
        // Zaten işlenmiş, silent return
        return this.mapToDTO(currentAppt);
      }

      // 3. Projeksiyon (Current State) Tablosunun Güncellenmesi
      const { data: updatedAppt, error: updateError } = await this.supabaseAdmin
        .from('appointments')
        .update({ 
          status: AppointmentStatus.Approved,
          date: timeSlot // Saati de güncelliyoruz
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (updateError) {
        console.error(`[AppointmentService] Projeksiyon güncellenirken hata: ${updateError.message}`);
        throw new Error(`Projeksiyon güncelleme hatası: ${updateError.message}`);
      }

      return this.mapToDTO(updatedAppt);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`[AppointmentService] approveAppointment Kritik Hata: ${err.message}`);
        throw err;
      }
      throw new Error('approveAppointment Kritik Hata: Unknown error');
    }
  }

  // --- Diger CRUD islemlerinin Deno & Strict halleri ---

  async create(appointment: Omit<AppointmentDTO, 'id' | 'createdAt' | 'updatedAt'>, eventId: string): Promise<AppointmentDTO | null> {
    try {
      const rawData = {
        customer_phone: appointment.customerPhone,
        customer_name: appointment.customerName || null,
        service_id: appointment.serviceId,
        employee_id: appointment.employeeId || null,
        date: appointment.date,
        status: appointment.status,
        booking_token: appointment.bookingToken
      };

      const { data, error } = await this.supabaseAdmin
        .from('appointments')
        .insert([rawData])
        .select()
        .single();

      if (error) throw new Error(`Oluşturma hatası: ${error.message}`);

      // Event Sourcing Log
      await this.processEvent(data.id, eventId, AppointmentEventType.CREATED, rawData);

      return this.mapToDTO(data);
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Bilinmeyen hata");
    }
  }

  async getAvailableSlots(date: string, serviceId: string): Promise<string[]> {
    // Şimdilik mock veri dönüyor
    return ['09:00', '10:00', '13:00', '15:00'];
  }

  private mapToDTO(raw: Record<string, unknown>): AppointmentDTO {
    return {
      id: raw.id as string,
      customerPhone: raw.customer_phone as string,
      customerName: raw.customer_name as string | null,
      serviceId: raw.service_id as string,
      employeeId: raw.employee_id as string | null,
      date: raw.date as string,
      status: raw.status as AppointmentStatus,
      createdAt: raw.created_at as string,
      updatedAt: raw.updated_at as string,
      bookingToken: raw.booking_token as string
    };
  }
}
