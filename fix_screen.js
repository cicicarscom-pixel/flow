const fs = require("fs"); let c = fs.readFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", "utf8"); 

c = c.replace(/import \{ useAppointments, extractTime \} from \x27\.\.\/hooks\/useAppointments\x27;/, "import { useAppointments, extractTime } from \x27../hooks/useAppointments\x27;\nimport { useCalendars } from \x27../hooks/useCalendars\x27;");

// In functional component
c = c.replace(/const \[newApptService, setNewApptService\] = useState\(\x27Genel Bakım\x27\);/g, "const [newApptService, setNewApptService] = useState(\x27Genel Bakım\x27);\n  const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar } = useCalendars();\n  const [newApptCalendarId, setNewApptCalendarId] = useState(null);");

// Hook integration
c = c.replace(/const \{ appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment \} = useAppointments\(todayStr\);/g, "const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);\n  \n  React.useEffect(() => { if(isModalVisible && activeCalendarId) setNewApptCalendarId(activeCalendarId); else if(isModalVisible) setNewApptCalendarId(calendars[0]?.id || null); }, [isModalVisible, activeCalendarId, calendars]);");

// Add Chip Bar
c = c.replace(/\{\/\* Date Picker Strip \*\/\}/g, "{/* Multi-Calendar Chip Bar */}\n        {multiCalendarEnabled && (\n          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 14, marginBottom: 16 }}>\n            <TouchableOpacity \n              onPress={() => setActiveCalendarId(null)} \n              style={[styles.chip, activeCalendarId === null && styles.chipActive]}\n            >\n              <Text style={[styles.chipText, activeCalendarId === null && styles.chipTextActive]}>Tümü</Text>\n            </TouchableOpacity>\n            {calendars.map(cal => (\n              <TouchableOpacity \n                key={cal.id} \n                onPress={() => setActiveCalendarId(cal.id)}\n                style={[styles.chip, activeCalendarId === cal.id && styles.chipActive]}\n              >\n                <Text style={[styles.chipText, activeCalendarId === cal.id && styles.chipTextActive]}>{cal.name}</Text>\n              </TouchableOpacity>\n            ))}\n            <TouchableOpacity \n              onPress={() => { /* Alert/prompt not easily supported in plain RN, but we can fake it or use Alert.prompt on iOS */ \n                // To keep it simple: \n                const name = `Takvim ${calendars.length + 1}`; \n                createCalendar(name); \n              }} \n              style={[styles.chip, { borderColor: \x27#00c6ff\x27, borderWidth: 1, backgroundColor: \x27transparent\x27 }]}\n            >\n              <Text style={[styles.chipText, { color: \x27#00c6ff\x27 }]}>+ Takvim Ekle</Text>\n            </TouchableOpacity>\n          </ScrollView>\n        )}\n\n        {/* Date Picker Strip */}");

// Add badge to appt card
c = c.replace(/<Text style=\{styles\.apptService\}>\{appt\.services\?\.\[0\] \|\| \x27Genel\x27\}<\/Text>/g, "<Text style={styles.apptService}>{appt.services?.[0] || \x27Genel\x27}</Text>\n                        {multiCalendarEnabled && activeCalendarId === null && appt.calendarId && (\n                          <View style={{ backgroundColor: \x27rgba(34,181,115,0.1)\x27, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginLeft: 8 }}>\n                            <Text style={{ fontSize: 10, color: \x27#22B573\x27 }}>{calendars.find(c => c.id === appt.calendarId)?.name || \x27Takvim\x27}</Text>\n                          </View>\n                        )}");

// Appt form logic
c = c.replace(/serviceId: newApptService,/g, "serviceId: newApptService,\n          calendarId: multiCalendarEnabled ? newApptCalendarId : undefined,");

// Update Modal UI
c = c.replace(/<Text style=\{styles\.modalLabel\}>Saat<\/Text>/g, `
                  {multiCalendarEnabled && (
                    <>
                      <Text style={styles.modalLabel}>Takvim Seçimi</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {calendars.map(cal => (
                          <TouchableOpacity 
                            key={cal.id} 
                            onPress={() => setNewApptCalendarId(cal.id)}
                            style={[styles.chip, newApptCalendarId === cal.id && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, newApptCalendarId === cal.id && styles.chipTextActive]}>{cal.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}
                  <Text style={styles.modalLabel}>Saat</Text>`);

// Convert Time TextInput to available hours chip selector
c = c.replace(/<TextInput\s*style=\{styles\.modalInput\}\s*placeholder="10:00"\s*placeholderTextColor="rgba\(185, 202, 203, 0\.5\)"\s*value=\{newApptTime\}\s*onChangeText=\{setNewApptTime\}\s*\/>/g, `<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                      {TIME_SLOTS.filter(s => !s.full && !isSlotBusy(s.time)).map(s => (
                        <TouchableOpacity 
                          key={s.time}
                          onPress={() => setNewApptTime(s.time)}
                          style={[styles.chip, newApptTime === s.time && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, newApptTime === s.time && styles.chipTextActive]}>{s.time}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>`);

// Add styles
c = c.replace(/modalInput: \{/g, "chip: { backgroundColor: \x27rgba(255,255,255,0.05)\x27, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: \x27rgba(255,255,255,0.1)\x27 },\n  chipActive: { backgroundColor: \x27#22B573\x27, borderColor: \x27#22B573\x27 },\n  chipText: { color: \x27#A79E96\x27, fontSize: 13, fontWeight: \x27600\x27 },\n  chipTextActive: { color: \x27#17151A\x27 },\n  modalInput: {");

fs.writeFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", c, "utf8"); console.log("OK");
