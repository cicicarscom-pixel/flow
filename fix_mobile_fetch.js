import * as fs from 'fs';

let content = fs.readFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', 'utf8');

content = content.replace(
    'async getCalendars(): Promise<Calendar[]> {\n    const { data, error } = await supabase\n      .from("calendars")\n      .select("*")\n      .eq("is_active", true)\n      .order("created_at", { ascending: true });',
    'async getCalendars(): Promise<Calendar[]> {\n    const { data: { session } } = await supabase.auth.getSession();\n    if (!session) return [];\n\n    const { data, error } = await supabase\n      .from("calendars")\n      .select("*")\n      .eq("merchant_id", session.user.id)\n      .eq("is_active", true)\n      .order("created_at", { ascending: true });'
);

fs.writeFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', content, 'utf8');
console.log("Updated getCalendars in flow");
