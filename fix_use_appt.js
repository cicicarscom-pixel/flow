const fs = require("fs"); let c = fs.readFileSync("src/modules/randevu/presentation/hooks/useAppointments.ts", "utf8"); 
c = c.replace(/export function useAppointments\(initialDate\?: string\): UseAppointmentsResult \{/, "export function useAppointments(initialDate?: string, activeCalendarId?: string | null): UseAppointmentsResult {");
c = c.replace(/const data = await repo\.getAppointmentsByDate\(selectedDate\);/g, "const data = await repo.getAppointmentsByDate(selectedDate, activeCalendarId || undefined);");
c = c.replace(/unsubscribe = repo\.subscribeToAppointments\(selectedDate, \(fresh\) => \{/g, "unsubscribe = repo.subscribeToAppointments(selectedDate, activeCalendarId || undefined, (fresh) => {");
c = c.replace(/\[selectedDate\]\);/g, "[selectedDate, activeCalendarId]);");
fs.writeFileSync("src/modules/randevu/presentation/hooks/useAppointments.ts", c, "utf8"); console.log("OK");
