const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const mainScreenPoint = "            {/* Time Slots - 3-row heatmap */}";
const insertIndex = c.indexOf(mainScreenPoint);
if (insertIndex !== -1) {
    const before = c.substring(0, insertIndex);
    const after = c.substring(insertIndex);
    c = before + `
            {/* Calendar Selector Chip Bar */}
            {multiCalendarEnabled && (
              <View style={{ marginBottom: 16 }}>
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

` + after;
    console.log("Injected chip bar!");
    fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
} else {
    console.log("Could not find insertion point.");
}
