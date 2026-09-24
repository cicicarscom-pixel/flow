const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const targetStr = `            </ScrollView>\n  \n            {/* Time Slots - 3-row heatmap */}\n            <View style={styles.slotsCard}>`;

const chipBar = `            </ScrollView>

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

// I'll just find the index of "{/* Time Slots - 3-row heatmap */}"
const insertIndex = c.indexOf("{/* Time Slots - 3-row heatmap */}");
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
    console.log("Successfully injected!");
} else {
    console.log("Could not find the insertion point.");
}

// 2. The user also wants to change the horizontal scroll view inside the MODAL to a dropdown!
// "yeni randevu ekleme kartında takvim seçimi yana kaydırılabilir şekilde tasarlanmış bunu aşağı açılan bir menü şeklinde yapalım daha kullanıcı dostu bir deneyim olur"

// Wait! Does react-native have a dropdown out of the box?
// React Native doesn't have a great built-in dropdown (Picker exists but is mostly deprecated or requires community package).
// I can implement a simple modal-based or View-based dropdown!
// BUT the simplest way is to use `Picker` from `@react-native-picker/picker` if it's installed.
