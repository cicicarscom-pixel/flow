const fs = require("fs"); 
let c = fs.readFileSync("src/modules/randevu/domain/entities/Appointment.ts", "utf8"); 
c = c.replace("private readonly _serviceId: string;", "private readonly _serviceId: string | null;\n  private readonly _startsAt: string | null;\n  private readonly _endsAt: string | null;\n  private readonly _timezone: string | null;");
c = c.replace("serviceId: string;", "serviceId: string | null;\n    startsAt?: string | null;\n    endsAt?: string | null;\n    timezone?: string | null;");
c = c.replace("this._serviceId = data.serviceId;", "this._serviceId = data.serviceId || null;\n    this._startsAt = data.startsAt || null;\n    this._endsAt = data.endsAt || null;\n    this._timezone = data.timezone || null;");
c = c.replace("get serviceId(): string { return this._serviceId; }", "get serviceId(): string | null { return this._serviceId; }\n  get startsAt(): string | null { return this._startsAt; }\n  get endsAt(): string | null { return this._endsAt; }\n  get timezone(): string | null { return this._timezone; }");
fs.writeFileSync("src/modules/randevu/domain/entities/Appointment.ts", c, "utf8"); 
console.log("OK");
