const dbFile = 'C:/Users/roman/flow/src/screens/DashboardScreen.js';
let dbContent = await Deno.readTextFile(dbFile);

const originalDbLogic = "const serviceName = appt.services && appt.services.length > 0 ? appt.services[0] : '';";
const newDbLogic = "const serviceName = appt.services && appt.services.length > 0 ? appt.services.join(' + ') : (appt.customerRequestRaw ? `📝 Not: ${appt.customerRequestRaw}` : '');";

dbContent = dbContent.replace(originalDbLogic, newDbLogic);
await Deno.writeTextFile(dbFile, dbContent);

const randevuFile = 'C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js';
let randevuContent = await Deno.readTextFile(randevuFile);

const originalRandevuLogic = "{appt.services?.length > 0 ? appt.services.join(' + ') : appt.serviceId}";
const newRandevuLogic = "{appt.services?.length > 0 ? appt.services.join(' + ') : (appt.customerRequestRaw ? `📝 Not: ${appt.customerRequestRaw}` : t('randevu.randevuScreen.noAppointments'))}";

randevuContent = randevuContent.replace(originalRandevuLogic, newRandevuLogic);
await Deno.writeTextFile(randevuFile, randevuContent);

console.log("Updated both mobile screens!");
