const fs = require('fs');
let content = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', 'utf8');

if (!content.includes('import { todayInTimezone, addDaysYmd }')) {
  content = content.replace("import { todayInTimezone } from '../../../../lib/dates';", "import { todayInTimezone, addDaysYmd } from '../../../../lib/dates';");
}

content = content.replace(
  /const nextDay = new Date\(date\);\s*nextDay\.setDate\(nextDay\.getDate\(\) \+ 1\);\s*const nextDayStr = nextDay\.toISOString\(\)\.split\('T'\)\[0\];/g,
  `const nextDayStr = addDaysYmd(date, 1);`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', content, 'utf8');
