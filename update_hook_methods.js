const fs = require('fs');

let hookPath = 'src/modules/randevu/presentation/hooks/useCalendars.ts';
let hookCode = fs.readFileSync(hookPath, 'utf8');

if (!hookCode.includes('updateCalendar')) {
    const methods = `
  const updateCalendar = async (id: string, name: string) => {
    try {
      const updatedCal = await repo.updateCalendar(id, name);
      setCalendars(prev => prev.map(c => c.id === id ? updatedCal : c));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteCalendar = async (id: string) => {
    try {
      await repo.deleteCalendar(id);
      setCalendars(prev => prev.filter(c => c.id !== id));
      if (activeCalendarId === id) setActiveCalendarId(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
`;
    hookCode = hookCode.replace(/return \{/, methods + '\n  return {');
    
    // Also expose them in return
    hookCode = hookCode.replace(/createCalendar,/, 'createCalendar,\n    updateCalendar,\n    deleteCalendar,');
    
    fs.writeFileSync(hookPath, hookCode, 'utf8');
}
console.log('Done with hook');
