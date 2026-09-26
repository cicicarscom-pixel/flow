const m = 'C:/Users/roman/flow/src/modules/randevu/infrastructure/mappers/AppointmentMapper.ts';
let cm = await Deno.readTextFile(m);
cm = cm.replace('customerRequestRaw: raw.customer_request_raw', 'customerRequestRaw: raw.customer_request_raw,\n      startsAt: raw.starts_at,\n      timezone: raw.timezone');
cm = cm.replace('customer_request_raw: entity.customerRequestRaw', 'customer_request_raw: entity.customerRequestRaw,\n      starts_at: entity.startsAt,\n      timezone: entity.timezone');
await Deno.writeTextFile(m, cm);

const a = 'C:/Users/roman/flow/src/modules/randevu/domain/entities/Appointment.ts';
let ca = await Deno.readTextFile(a);
ca = ca.replace('customerRequestRaw?: string | null;', 'customerRequestRaw?: string | null;\n  startsAt?: string | null;\n  timezone?: string | null;');
ca = ca.replace('this.customerRequestRaw = props.customerRequestRaw || null;', 'this.customerRequestRaw = props.customerRequestRaw || null;\n    this.startsAt = props.startsAt || null;\n    this.timezone = props.timezone || null;');
await Deno.writeTextFile(a, ca);
console.log("Updated Appointment domain");
