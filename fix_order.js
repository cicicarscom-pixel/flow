const fs = require('fs');

let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// The block to replace
const startMarker = "  //  Supabase veri balants ";
const endMarker = "  const [promptConfig, setPromptConfig] = useState({ visible: false, title: \"\", placeholder: \"\", value: \"\", onSave: null });";

let startIdx = c.indexOf("// ── Supabase veri bağlantısı ──");
if (startIdx === -1) {
    startIdx = c.indexOf("//  Supabase veri balants ");
}
if (startIdx === -1) {
    startIdx = c.indexOf("const { appointments, loading, isSlotBusy");
}

let endIdx = c.indexOf(endMarker);
if (endIdx === -1) {
    endIdx = c.indexOf("useState({ visible: false, title: \"\", placeholder: \"\", value: \"\", onSave: null });");
}

if (startIdx !== -1 && endIdx !== -1) {
    // find end of the promptConfig line
    const actualEndIdx = c.indexOf("\\n", endIdx);
    
    const replacement = `  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newApptName, setNewApptName] = useState('');
  const [newApptPhone, setNewApptPhone] = useState('');
  const [newApptTime, setNewApptTime] = useState('10:00');
  const [newApptService, setNewApptService] = useState('Genel Bakım');
  const [newApptCalendarId, setNewApptCalendarId] = useState(null);
  const [availableModalHours, setAvailableModalHours] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [promptConfig, setPromptConfig] = useState({ visible: false, title: "", placeholder: "", value: "", onSave: null });

  const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar, updateCalendar, deleteCalendar } = useCalendars();

  // ── Supabase veri bağlantısı ──
  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);

  React.useEffect(() => { 
    if(isModalVisible && activeCalendarId) setNewApptCalendarId(activeCalendarId); 
    else if(isModalVisible) setNewApptCalendarId(calendars[0]?.id || null); 
  }, [isModalVisible, activeCalendarId, calendars]);
  
  React.useEffect(() => {
    if (isModalVisible) {
      const fetchHours = async () => {
        const repo = require("../../../../core/container").container.resolve("AppointmentRepository");
        const hours = await repo.findAvailableHours(selectedDate, newApptService, newApptCalendarId || undefined);
        setAvailableModalHours(hours);
      };
      fetchHours();
    }
  }, [isModalVisible, selectedDate, newApptService, newApptCalendarId]);`;

    c = c.substring(0, startIdx) + replacement + c.substring(actualEndIdx);
    fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
    console.log("Success");
} else {
    console.log("Could not find markers.", startIdx, endIdx);
}
