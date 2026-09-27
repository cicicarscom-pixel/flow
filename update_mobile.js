const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

if (!c.includes("import { supabase } from")) {
  c = c.replace(
    "import { AppointmentStatus } from '@domain/enums/AppointmentStatus';",
    "import { AppointmentStatus } from '@domain/enums/AppointmentStatus';\nimport { supabase } from '../../../../shared';"
  );
}

// Add state for note and services
c = c.replace(
  "const [newApptService, setNewApptService] = useState('Genel Bakım');",
  "const [newApptService, setNewApptService] = useState('');\n  const [newApptNote, setNewApptNote] = useState('');\n  const [services, setServices] = useState([]);"
);

// Add useEffect to fetch services
const useAppointmentsHookStr = "const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);";
c = c.replace(
  useAppointmentsHookStr,
  `${useAppointmentsHookStr}
  
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('business_services').select('*').eq('merchant_id', user.id);
          if (data && data.length > 0) {
            setServices(data);
            setNewApptService(data[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchServices();
  }, []);`
);

// Update save logic
c = c.replace(
  `customerName: newApptName,
          customerPhone: newApptPhone,
          date: \`\${selectedDate}T\${newApptTime}:00\`,
          serviceId: newApptService,
            calendarId: newApptCalendarId || undefined,
          status: AppointmentStatus.Pending,`,
  `customerName: newApptName,
          customerPhone: newApptPhone,
          date: \`\${selectedDate}T\${newApptTime}:00\`,
          serviceId: newApptService || 'Bilinmiyor',
          calendarId: newApptCalendarId || undefined,
          customerRequestRaw: newApptNote || null,
          status: AppointmentStatus.Pending,`
);

// Update reset logic
c = c.replace(
  `setNewApptTime('10:00');
      } catch (e) {`,
  `setNewApptTime('10:00');
        setNewApptNote('');
      } catch (e) {`
);

// Remove old Hizmet Tipi View
const oldHizmet = `<View style={{ flexDirection: 'row', gap: 16, zIndex: 1 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.webModalLabel}>Hizmet Tipi</Text>
                  <TextInput
                    style={styles.webModalInput}
                    placeholder="Genel Bakım"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={newApptService}
                    onChangeText={setNewApptService}
                  />
                </View>
              </View>`;
c = c.replace(oldHizmet, '');

// Insert new Hizmet Tipi and Açıklama UI
const saatUI = `<View style={{ zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Saat</Text>`;

c = c.replace(
  saatUI,
  `{services.length > 0 && (
                <View style={{ marginBottom: 16, zIndex: 1 }}>
                  <Text style={styles.webModalLabel}>Hizmet Tipi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {services.map(s => (
                      <TouchableOpacity 
                        key={s.id}
                        onPress={() => setNewApptService(s.id)}
                        style={[styles.chip, newApptService === s.id && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, newApptService === s.id && styles.chipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ marginBottom: 16, zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Açıklama / Not</Text>
                <TextInput
                  style={[styles.webModalInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Yapay zekaya verilen notlar gibi..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  value={newApptNote}
                  onChangeText={setNewApptNote}
                />
              </View>

              <View style={{ zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Saat</Text>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
