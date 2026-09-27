const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', 'utf8');

c = c.replace(
  `  async findAvailableHours(date: string, serviceId: string, calendarId?: string): Promise<string[]> {\r
    let query = supabase.from("appointments").select("date").like("date", \`\${date}%\`).in("status", [AppointmentStatus.Pending, AppointmentStatus.Approved]);\r
    if (calendarId) query = query.eq("calendar_id", calendarId);`,
  `  async findAvailableHours(date: string, serviceId: string, calendarId?: string): Promise<string[]> {\n    const nextDay = new Date(date);\n    nextDay.setDate(nextDay.getDate() + 1);\n    const nextDayStr = nextDay.toISOString().split('T')[0];\n    let query = supabase.from("appointments").select("date").gte("date", \`\${date}T00:00:00\`).lt("date", \`\${nextDayStr}T00:00:00\`).in("status", [AppointmentStatus.Pending, AppointmentStatus.Approved]);\n    if (calendarId) query = query.eq("calendar_id", calendarId);`
);

c = c.replace(
  `  async getAppointmentsByDate(date: string, calendarId?: string): Promise<Appointment[]> {\r
    let query = supabase.from("appointments").select("*").like("date", \`\${date}%\`).in("status", [AppointmentStatus.Pending, AppointmentStatus.Approved]).order("created_at", { ascending: true });\r
    if (calendarId) query = query.eq("calendar_id", calendarId);`,
  `  async getAppointmentsByDate(date: string, calendarId?: string): Promise<Appointment[]> {\n    const nextDay = new Date(date);\n    nextDay.setDate(nextDay.getDate() + 1);\n    const nextDayStr = nextDay.toISOString().split('T')[0];\n    let query = supabase.from("appointments").select("*").gte("date", \`\${date}T00:00:00\`).lt("date", \`\${nextDayStr}T00:00:00\`).in("status", [AppointmentStatus.Pending, AppointmentStatus.Approved]).order("created_at", { ascending: true });\n    if (calendarId) query = query.eq("calendar_id", calendarId);`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', c, 'utf8');
