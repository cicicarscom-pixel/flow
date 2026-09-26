const f = 'C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js';
let c = await Deno.readTextFile(f);

const targetSvcName = "{appt.services?.length > 0 ? appt.services.join(' + ') : (appt.customerRequestRaw ? `?? Not: ${appt.customerRequestRaw}` : t('randevu.randevuScreen.noAppointments'))}";

const newSvcName = "{(() => { if (appt.services?.length > 0) return appt.services.join(' + '); if (appt.serviceId && services.find(s => s.id === appt.serviceId)) return services.find(s => s.id === appt.serviceId).name; if (appt.customerRequestRaw?.trim()) return `📝 Not: ${appt.customerRequestRaw.trim()}`; return t('randevu.randevuScreen.noAppointments'); })()}";

c = c.replace(targetSvcName, newSvcName);

const targetApptTime = "const apptTime = extractTime(appt.date);";
const newApptTime = "const apptTime = appt.startsAt ? new Date(appt.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: appt.timezone ?? 'Europe/Istanbul' }) : extractTime(appt.date);";

c = c.replace(targetApptTime, newApptTime);

await Deno.writeTextFile(f, c);
console.log("Updated RandevuScreen.js");
