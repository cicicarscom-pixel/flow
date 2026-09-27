const fs = require('fs');

let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// The lines that declare the states (which were improperly placed)
const stateLines = [
"  const [isModalVisible, setIsModalVisible] = useState(false);",
"  const [newApptName, setNewApptName] = useState('');",
"  const [newApptPhone, setNewApptPhone] = useState('');",
"  const [newApptTime, setNewApptTime] = useState('10:00');",
"  const [newApptService, setNewApptService] = useState('Genel Bakım');",
"  const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar, updateCalendar, deleteCalendar } = useCalendars();",
"  const [newApptCalendarId, setNewApptCalendarId] = useState(null);",
"  const [availableModalHours, setAvailableModalHours] = useState([]);",
"  const [isSaving, setIsSaving] = useState(false);",
"  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);",
"  const [isManageModalVisible, setIsManageModalVisible] = useState(false);",
"  const [promptConfig, setPromptConfig] = useState({ visible: false, title: \"\", placeholder: \"\", value: \"\", onSave: null });"
];

// Remove them from where they currently are
let lines = c.split(/\\r?\\n/);
let filteredLines = [];
let statesExtracted = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let isStateLine = false;
    for (const stateLine of stateLines) {
        if (line.includes(stateLine.trim()) && !line.includes("const { appointments, loading, isSlotBusy")) {
            isStateLine = true;
            break;
        }
    }
    // Handle the specific line for Genel Bakım which has an encoding issue
    if (line.includes("const [newApptService, setNewApptService] = useState('Genel Bak")) {
        isStateLine = true;
    }

    if (isStateLine) {
        // Skip it, we'll insert our clean array instead
    } else {
        filteredLines.push(line);
    }
}

// Now insert the state lines correctly right after `const todayStr = useMemo(() => { ... }, []);`
let insertIdx = -1;
for (let i = 0; i < filteredLines.length; i++) {
    if (filteredLines[i].includes("const { appointments, loading, isSlotBusy")) {
        insertIdx = i;
        break;
    }
}

if (insertIdx !== -1) {
    // Insert `// ── Supabase veri bağlantısı ──` too if it's there
    let offset = 0;
    if (filteredLines[insertIdx - 1].includes("Supabase veri")) {
        insertIdx--;
    }
    
    filteredLines.splice(insertIdx, 0, ...stateLines, "");
    
    fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', filteredLines.join('\\n'), 'utf8');
    console.log("Success");
} else {
    console.log("Could not find insert index.");
}
