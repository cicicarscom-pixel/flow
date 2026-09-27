const fs = require("fs"); 
let c = fs.readFileSync("src/modules/randevu/infrastructure/mappers/AppointmentMapper.ts", "utf8"); 
c = c.replace("serviceId: raw.service_id,", "serviceId: raw.service_id,\n      startsAt: raw.starts_at,\n      endsAt: raw.ends_at,\n      timezone: raw.timezone,");
c = c.replace("service_id: entity.serviceId,", "service_id: entity.serviceId,\n      starts_at: entity.startsAt,\n      ends_at: entity.endsAt,\n      timezone: entity.timezone,");
fs.writeFileSync("src/modules/randevu/infrastructure/mappers/AppointmentMapper.ts", c, "utf8"); 
console.log("OK");
