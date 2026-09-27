const fs = require('fs');

let content = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/hooks/useAppointments.ts', 'utf8');

if (!content.includes('import { todayInTimezone }')) {
  content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { todayInTimezone } from "../../../../lib/dates";');
}

content = content.replace(
  `const today = toDateString(new Date());`,
  `const today = todayInTimezone('Europe/Istanbul'); // Will be updated by component if needed`
);

content = content.replace(
  `function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}`,
  `function toDateString(date: Date): string {
  return todayInTimezone('Europe/Istanbul', date);
}`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/hooks/useAppointments.ts', content, 'utf8');
