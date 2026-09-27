const fs = require('fs');

let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const replacement = `  // Initial selected date is today
  const todayStr = useMemo(() => {
    const d = new Date();
    return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
  }, []);

  const [isModalVisible, setIsModalVisible] = useState(false);
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

const startIdx = c.indexOf("  // Initial selected date is today");
const endIdx = c.indexOf("  const [promptConfig, setPromptConfig] = useState({ visible: false, title: \"\", placeholder: \"\", value: \"\", onSave: null });");
const endActual = c.indexOf("\\n", endIdx);

c = c.substring(0, startIdx) + replacement + c.substring(endActual);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
