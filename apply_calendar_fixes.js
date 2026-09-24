const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// 1. Add Alert import if not present
if (!c.includes('Alert,')) {
    c = c.replace(/import \{\s*View,\s*Text,\s*ScrollView,\s*TouchableOpacity,/, "import { View, Text, ScrollView, TouchableOpacity, Alert,");
}

// 2. Add showCalendarDropdown state
if (!c.includes('showCalendarDropdown')) {
    c = c.replace(/const \[isSaving, setIsSaving\] = useState\(false\);/, "const [isSaving, setIsSaving] = useState(false);\n    const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);");
}

// 3. Inject Chip Bar into Main Screen
const mainScreenPoint = "{/* Time Slots - 3-row heatmap */}";
if (!c.includes("{/* Calendar Selector Chip Bar */}")) {
    const insertIndex = c.indexOf(mainScreenPoint);
    if (insertIndex !== -1) {
        const before = c.substring(0, insertIndex);
        const after = c.substring(insertIndex);
        c = before + `
            {/* Calendar Selector Chip Bar */}
            {multiCalendarEnabled && (
              <View style={{ marginBottom: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                  <TouchableOpacity 
                    onPress={() => setActiveCalendarId(null)}
                    style={[styles.chip, !activeCalendarId && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, !activeCalendarId && styles.chipTextActive]}>Tümü</Text>
                  </TouchableOpacity>
                  {calendars.map(cal => (
                    <TouchableOpacity 
                      key={cal.id} 
                      onPress={() => setActiveCalendarId(cal.id)}
                      style={[styles.chip, activeCalendarId === cal.id && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, activeCalendarId === cal.id && styles.chipTextActive]}>{cal.name}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Create Calendar Button */}
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.prompt(
                        "Yeni Takvim",
                        "Yeni takvim/personel adını girin:",
                        [
                          { text: "İptal", style: "cancel" },
                          { text: "Ekle", onPress: (name) => {
                              if (name && name.trim()) {
                                createCalendar(name.trim()).catch(e => Alert.alert("Hata", e.message));
                              }
                            }
                          }
                        ]
                      );
                    }}
                    style={[styles.chip, { backgroundColor: 'rgba(34, 181, 115, 0.1)', borderColor: 'rgba(34, 181, 115, 0.3)' }]}
                  >
                    <Text style={[styles.chipText, { color: '#22B573' }]}>+ Yeni Ekle</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}\n\n            ` + after;
        console.log("Injected chip bar!");
    }
}

// 4. Replace Modal chip bar with dropdown
const modalChipBarRegex = /\{multiCalendarEnabled && \([\s\S]*?<\/>\s*\)\}/;
const dropdownReplacement = `{multiCalendarEnabled && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.modalLabel}>Takvim / Personel</Text>
                        <TouchableOpacity 
                          style={styles.modalInput} 
                          onPress={() => setShowCalendarDropdown(!showCalendarDropdown)}
                        >
                          <Text style={{ color: newApptCalendarId ? '#fff' : 'rgba(185, 202, 203, 0.5)' }}>
                            {newApptCalendarId ? calendars.find(c => c.id === newApptCalendarId)?.name : "Seçiniz"}
                          </Text>
                        </TouchableOpacity>
                        
                        {showCalendarDropdown && (
                          <View style={{ backgroundColor: '#201f22', borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
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
                    )}`;

if (modalChipBarRegex.test(c)) {
    c = c.replace(modalChipBarRegex, dropdownReplacement);
    console.log("Replaced modal chip bar with dropdown!");
}

fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
