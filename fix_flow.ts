let c = Deno.readTextFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts');

c = c.replace(
  "import { supabase } from '@/core/infrastructure/supabase/supabaseClient';",
  "import { supabase } from '@/core/infrastructure/supabase/supabaseClient';\nimport { todayInTimezone } from '@/lib/dates';"
);

const oldCode = `  async getUpcomingAppointments(limit: number = 7): Promise<Appointment[]> {
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"`;

const newCode = `  async getUpcomingAppointments(limit: number = 7): Promise<Appointment[]> {
    // In a real app we'd fetch org timezone, using fallback for now
    const todayStr = todayInTimezone('Europe/Istanbul'); // "YYYY-MM-DD"`;

c = c.replace(oldCode, newCode);

Deno.writeTextFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', c);
console.log("Updated flow repo");
