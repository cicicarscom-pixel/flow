const entityFile = 'C:/Users/roman/flow/src/modules/randevu/domain/entities/Appointment.ts';
let entityContent = await Deno.readTextFile(entityFile);

entityContent = entityContent.replace(
  "private readonly _calendarId: string | null;",
  "private readonly _calendarId: string | null;\n  private readonly _customerRequestRaw: string | null;"
);
entityContent = entityContent.replace(
  "calendarId?: string | null;\n    services?: string[];",
  "calendarId?: string | null;\n    customerRequestRaw?: string | null;\n    services?: string[];"
);
entityContent = entityContent.replace(
  "this._calendarId = data.calendarId || null;",
  "this._calendarId = data.calendarId || null;\n    this._customerRequestRaw = data.customerRequestRaw || null;"
);
entityContent = entityContent.replace(
  "get calendarId(): string | null { return this._calendarId; }",
  "get calendarId(): string | null { return this._calendarId; }\n  get customerRequestRaw(): string | null { return this._customerRequestRaw; }"
);

await Deno.writeTextFile(entityFile, entityContent);

const mapperFile = 'C:/Users/roman/flow/src/modules/randevu/infrastructure/mappers/AppointmentMapper.ts';
let mapperContent = await Deno.readTextFile(mapperFile);

mapperContent = mapperContent.replace(
  "calendarId: raw.calendar_id",
  "calendarId: raw.calendar_id,\n      customerRequestRaw: raw.customer_request_raw"
);

mapperContent = mapperContent.replace(
  "calendar_id: entity.calendarId",
  "calendar_id: entity.calendarId,\n      customer_request_raw: entity.customerRequestRaw"
);

await Deno.writeTextFile(mapperFile, mapperContent);
console.log("Updated Appointment & AppointmentMapper!");
