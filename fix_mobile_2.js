const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  "  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);",
  `  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);
  
  React.useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (d.getMonth() !== currentDate.getMonth() || d.getFullYear() !== currentDate.getFullYear()) {
          setCurrentDate(d);
        }
      }
    }
  }, [selectedDate, currentDate]);`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
