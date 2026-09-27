const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/domain/entities/Appointment.ts', 'utf8');

c = c.replace(
  /    calendarId\?: string \| null;\r?\n/,
  ""
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/domain/entities/Appointment.ts', c, 'utf8');
