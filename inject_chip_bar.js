const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

if (!c.includes('Alert,')) {
    c = c.replace(/import \{\s*View,\s*Text,\s*ScrollView,\s*TouchableOpacity,/, "import { View, Text, ScrollView, TouchableOpacity, Alert,");
}

const regex = /<\/ScrollView>\s*\{\/\* Time Slots - 3-row heatmap \*\/\}\s*<View style=\{styles\.slotsCard\}>/;

const chipBar = `</ScrollView>

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
            )}

            {/* Time Slots - 3-row heatmap */}
            <View style={styles.slotsCard}>`;

c = c.replace(regex, chipBar);

// Also let's fix the duplicate calendarId in handleSaveAppointment
c = c.replace(/calendarId: multiCalendarEnabled \? newApptCalendarId : undefined,\s*calendarId: multiCalendarEnabled \? newApptCalendarId : undefined,/, "calendarId: multiCalendarEnabled ? newApptCalendarId : undefined,");

fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
console.log('Injected chip bar to main screen and imported Alert');
