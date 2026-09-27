const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// 1. We want to take ALL these lines:
const statesStr = `  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newApptName, setNewApptName] = useState('');
  const [newApptPhone, setNewApptPhone] = useState('');
  const [newApptTime, setNewApptTime] = useState('10:00');
  const [newApptService, setNewApptService] = useState('Genel Bakım');
  const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar, updateCalendar, deleteCalendar } = useCalendars();
  const [newApptCalendarId, setNewApptCalendarId] = useState(null);
  const [availableModalHours, setAvailableModalHours] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
    const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
    const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [promptConfig, setPromptConfig] = useState({ visible: false, title: "", placeholder: "", value: "", onSave: null });`;

// Remove them from where they currently are
// Since "Genel Bakım" might have weird encoding, let's use a regex to remove everything from `isModalVisible` to `promptConfig`
const matchRegex = /\\s*const \\[isModalVisible[\\s\\S]*?setPromptConfig.*?\\);/;
c = c.replace(matchRegex, "");

// 2. Insert them at the top, right after `todayStr` is declared
const insertAnchor = `  const todayStr = useMemo(() => {
    const d = new Date();
    return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
  }, []);`;

c = c.replace(insertAnchor, insertAnchor + "\\n\\n" + statesStr + "\\n");

// 3. Fix Modal Layout
// Find the <View style={{ flexDirection: 'row', gap: 16 }}> ... </View> block
// and replace it with full-width Takvim + 2-col Hizmet/Saat
const oldLayout = `              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={styles.webModalLabel}>Takvim</Text>
                        <TouchableOpacity 
                          style={[styles.webModalInput, { paddingVertical: 14 }]} 
                          onPress={() => setShowCalendarDropdown(!showCalendarDropdown)}
                        >
                          <Text style={{ color: newApptCalendarId ? '#fff' : 'rgba(255, 255, 255, 0.4)' }}>
                            {newApptCalendarId ? calendars.find(c => c.id === newApptCalendarId)?.name : "Seçiniz"}
                          </Text>
                        </TouchableOpacity>
                        
                        {showCalendarDropdown && (
                          <View style={{ backgroundColor: '#1A181C', borderRadius: 16, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                            {calendars.map(cal => (
                              <TouchableOpacity 
                                key={cal.id} 
                                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                                onPress={() => { setNewApptCalendarId(cal.id); setShowCalendarDropdown(false); }}
                              >
                                <Text style={{ color: newApptCalendarId === cal.id ? '#22B573' : '#fff' }}>{cal.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                  <Text style={styles.webModalLabel}>Saat</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      {availableModalHours.map(hour => (
                        <TouchableOpacity 
                          key={hour}
                          onPress={() => setNewApptTime(hour)}
                          style={[styles.chip, newApptTime === hour && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, newApptTime === hour && styles.chipTextActive]}>{hour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                </View>
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

const newLayout = `              <View style={{ marginBottom: 16, zIndex: 10 }}>
                <Text style={styles.webModalLabel}>Takvim</Text>
                <TouchableOpacity 
                  style={[styles.webModalInput, { paddingVertical: 14, marginBottom: 0 }]} 
                  onPress={() => setShowCalendarDropdown(!showCalendarDropdown)}
                >
                  <Text style={{ color: newApptCalendarId ? '#fff' : 'rgba(255, 255, 255, 0.4)' }}>
                    {newApptCalendarId ? calendars.find(c => c.id === newApptCalendarId)?.name : "Seçiniz"}
                  </Text>
                </TouchableOpacity>
                
                {showCalendarDropdown && (
                  <View style={{ position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: '#1A181C', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', zIndex: 20 }}>
                    {calendars.map(cal => (
                      <TouchableOpacity 
                        key={cal.id} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                        onPress={() => { setNewApptCalendarId(cal.id); setShowCalendarDropdown(false); }}
                      >
                        <Text style={{ color: newApptCalendarId === cal.id ? '#22B573' : '#fff' }}>{cal.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 16, zIndex: 1 }}>
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
              </View>
              
              <View style={{ zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Saat</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {availableModalHours.map(hour => (
                      <TouchableOpacity 
                        key={hour}
                        onPress={() => setNewApptTime(hour)}
                        style={[styles.chip, newApptTime === hour && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, newApptTime === hour && styles.chipTextActive]}>{hour}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>`;

// Need to handle encoding for "Genel Bakım" / "Seçiniz" in regex replacing since oldLayout might contain weird chars
const oldLayoutRegex = /<View style=\{\{\s*flexDirection:\s*'row',\s*gap:\s*16\s*\}\}>[\s\S]*?<\/View>\s*<\/View>\s*<\/View>/;

c = c.replace(oldLayoutRegex, newLayout);
fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
