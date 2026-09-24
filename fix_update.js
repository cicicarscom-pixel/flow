const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', 'utf8');

const oldUpdate = `async updateCalendar(id: string, name: string): Promise<Calendar> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");
    
    const { data, error } = await supabase
      .from('calendars')
      .update({ name })
      .eq('id', id)
      .select()
      .limit(1);
      
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Calendar not found");
    return data[0] as Calendar;
  }`;

const newUpdate = `async updateCalendar(id: string, name: string): Promise<Calendar> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");
    
    const { error } = await supabase
      .from('calendars')
      .update({ name })
      .eq('id', id);
      
    if (error) throw error;
    
    // Fetch it again to get the updated fields
    const { data, error: fetchError } = await supabase
      .from('calendars')
      .select('*')
      .eq('id', id)
      .limit(1);
      
    if (fetchError) throw fetchError;
    if (!data || data.length === 0) throw new Error("Calendar not found");
    
    const row = data[0];
    return new Calendar({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }`;

c = c.replace(oldUpdate, newUpdate);

fs.writeFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', c, 'utf8');
console.log("Fixed updateCalendar");
