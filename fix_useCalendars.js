const fs = require('fs');
const file = 'src/modules/randevu/presentation/hooks/useCalendars.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/import \{ useState, useEffect \} from "react";/, `import { useState, useCallback } from "react";\nimport { useFocusEffect } from '@react-navigation/native';`);

c = c.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/, `useFocusEffect(
    useCallback(() => {
      let isActive = true;
      async function fetchAll() {
        setLoading(true);
        try {
          const enabled = await repo.getMultiCalendarEnabled();
          if (isActive) setMultiCalendarEnabled(enabled);
          if (enabled) {
            const data = await repo.getCalendars();
            if (isActive) setCalendars(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (isActive) setLoading(false);
        }
      }
      fetchAll();
      return () => { isActive = false; };
    }, [repo])
  );`);

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed useCalendars');
