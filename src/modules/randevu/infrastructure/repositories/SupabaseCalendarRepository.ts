import { ICalendarRepository } from "../../domain/repositories/ICalendarRepository";
import { Calendar } from "../../domain/entities/Calendar";
import { supabase } from "../../../../shared";

export class SupabaseCalendarRepository implements ICalendarRepository {
  async getCalendars(): Promise<Calendar[]> {
    const { data, error } = await supabase
      .from("calendars")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching calendars:", error);
      return [];
    }

    return (data || []).map((row: any) => new Calendar({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createCalendar(name: string): Promise<Calendar> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not logged in");

    // Need organization_id. For simplicity, just fetch the first org.
    const { data: orgDataResponse } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userData.user.id)
      .limit(1);
    
    const orgData = orgDataResponse?.[0];

    if (!orgData) throw new Error("Organization not found");

    const { data: insertResponse, error } = await supabase
      .from("calendars")
      .insert([{ name, organization_id: orgData.id, is_active: true }])
      .select();
      
    const data = insertResponse?.[0];

    if (error || !data) {
      throw new Error(`Takvim oluşturulamadı: ${error?.message || 'Bilinmeyen hata'}`);
    }

    return new Calendar({
      id: data.id,
      name: data.name,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  async getMultiCalendarEnabled(): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { data, error } = await supabase
      .from("organizations")
      .select("multi_calendar_enabled")
      .eq("owner_id", userData.user.id)
      .limit(1);

    if (error || !data || data.length === 0) return false;
    return !!data[0].multi_calendar_enabled;
  }
}
