const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// Remove the old injected block
const oldBlockStart = c.indexOf('{/* Calendar Selector Chip Bar */}');
if (oldBlockStart !== -1) {
    const oldBlockEndStr = '<View style={styles.slotsCard}>';
    const oldBlockEnd = c.indexOf(oldBlockEndStr, oldBlockStart);
    if (oldBlockEnd !== -1) {
        c = c.substring(0, oldBlockStart) + c.substring(oldBlockEnd);
    }
}

// Inject new stepper in stickyBlock
const stickyBlockPoint = '<View style={styles.stickyBlock}>';
const stickyBlockIndex = c.indexOf(stickyBlockPoint);
if (stickyBlockIndex !== -1) {
    const before = c.substring(0, stickyBlockIndex + stickyBlockPoint.length);
    const after = c.substring(stickyBlockIndex + stickyBlockPoint.length);
    
    const newStepper = `
            {/* Personel / Takvim Stepper Selector */}
            {multiCalendarEnabled && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginHorizontal: 20 }}>
                <View style={[styles.dateSelectorPill, { flex: 1, marginRight: 10 }]}>
                  <TouchableOpacity 
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 4 }}
                    onPress={() => {
                      const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
                      if (allOptions.length <= 1) return;
                      const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
                      const prevIndex = (currentIndex - 1 + allOptions.length) % allOptions.length;
                      setActiveCalendarId(allOptions[prevIndex].id);
                    }}
                  >
                    <Ionicons name="chevron-back" size={18} color="#A79E96" />
                  </TouchableOpacity>
                  
                  <Text style={[styles.dateSelectorText, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>
                    {activeCalendarId ? (calendars.find(c => c.id === activeCalendarId)?.name || 'Bilinmiyor') : 'Tümü'}
                  </Text>
                  
                  <TouchableOpacity 
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 4 }}
                    onPress={() => {
                      const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
                      if (allOptions.length <= 1) return;
                      const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
                      const nextIndex = (currentIndex + 1) % allOptions.length;
                      setActiveCalendarId(allOptions[nextIndex].id);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#A79E96" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={[styles.dateSelectorPill, { paddingHorizontal: 16, borderColor: 'rgba(34, 181, 115, 0.3)', backgroundColor: 'rgba(34, 181, 115, 0.05)' }]}
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
                >
                  <Text style={[styles.dateSelectorText, { color: '#22B573', fontWeight: '500' }]}>+ Yeni Ekle</Text>
                </TouchableOpacity>
              </View>
            )}
    `;
    c = before + newStepper + after;
    console.log("Injected Stepper in sticky block!");
} else {
    console.log("Could not find stickyBlock point.");
}

fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
