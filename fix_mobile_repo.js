const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', 'utf8');

c = c.replace(
  "      calendar_id: appointmentData.calendarId,calendar_id: appointmentData.calendarId,\\n      customer_request_raw: appointmentData.customerRequestRaw || nulln      customer_request_raw: appointmentData.customerRequestRaw || null",
  "      calendar_id: appointmentData.calendarId,\n      customer_request_raw: appointmentData.customerRequestRaw || null"
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', c, 'utf8');
