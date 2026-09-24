const fs = require('fs');

// 1. ICalendarRepository
let iRepoPath = 'src/modules/randevu/domain/repositories/ICalendarRepository.ts';
let iRepoCode = fs.readFileSync(iRepoPath, 'utf8');
if (!iRepoCode.includes('updateCalendar')) {
    iRepoCode = iRepoCode.replace(
        /getMultiCalendarEnabled\(\): Promise<boolean>;/,
        `getMultiCalendarEnabled(): Promise<boolean>;\n  updateCalendar(id: string, name: string): Promise<Calendar>;\n  deleteCalendar(id: string): Promise<void>;`
    );
    fs.writeFileSync(iRepoPath, iRepoCode, 'utf8');
}

// 2. SupabaseCalendarRepository
let supaRepoPath = 'src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts';
let supaRepoCode = fs.readFileSync(supaRepoPath, 'utf8');

if (!supaRepoCode.includes('updateCalendar')) {
    const updateMethods = `
  async updateCalendar(id: string, name: string): Promise<Calendar> {
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
  }

  async deleteCalendar(id: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");
    
    const { error } = await supabase
      .from('calendars')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
`;
    // Insert before the last closing brace
    const lastBraceIndex = supaRepoCode.lastIndexOf('}');
    supaRepoCode = supaRepoCode.substring(0, lastBraceIndex) + updateMethods + supaRepoCode.substring(lastBraceIndex);
    fs.writeFileSync(supaRepoPath, supaRepoCode, 'utf8');
}
console.log('Done with repos');
