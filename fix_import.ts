let c = Deno.readTextFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts');

c = c.replace(
  "import { NetworkError } from '../../../../shared/errors/NetworkError';",
  "import { NetworkError } from '../../../../shared/errors/NetworkError';\nimport { todayInTimezone } from '../../../../lib/dates';"
);

Deno.writeTextFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', c);
console.log("Updated SupabaseAppointmentRepository import");
