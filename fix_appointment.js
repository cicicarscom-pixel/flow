const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/domain/entities/Appointment.ts', 'utf8');

c = c.replace(
  "private _services?: string[];\\n    customerRequestRaw?: string | null;",
  "private _services?: string[];"
);
c = c.replace(
  "private _services?: string[];\\\\n    customerRequestRaw?: string | null;",
  "private _services?: string[];"
);
// Make sure to add it in the constructor data interface correctly
c = c.replace(
  "services?: string[];\n  })",
  "services?: string[];\n    customerRequestRaw?: string | null;\n  })"
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/domain/entities/Appointment.ts', c, 'utf8');
