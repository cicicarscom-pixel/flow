const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/hooks/useCalendars.ts', 'utf8');

if (!c.includes('useMemo')) {
    c = c.replace(
        'import { useState, useCallback } from "react";',
        'import { useState, useCallback, useMemo } from "react";'
    );
}

c = c.replace(
    'const repo = container.resolve("CalendarRepository") as ICalendarRepository;',
    'const repo = useMemo(() => container.resolve("CalendarRepository") as ICalendarRepository, []);'
);

fs.writeFileSync('src/modules/randevu/presentation/hooks/useCalendars.ts', c, 'utf8');
console.log("Fixed infinite loop in useCalendars");
