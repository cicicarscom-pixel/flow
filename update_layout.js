const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const startStr = "{/* Personel / Takvim Stepper Selector */}";
const endStr = "{/* Weekly Calendar Strip */}";

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const before = c.substring(0, startIndex);
    const after = c.substring(endIndex);
    
    const newBlock = `{/* Personel / Takvim Stepper Selector */}
            {multiCalendarEnabled && (
              <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10, gap: 15 }}>
                  {activeCalendarId ? (
                    <TouchableOpacity 
                      onPress={() => {
                         Alert.alert(
                           "Takvim Seçenekleri", 
                           "Ne yapmak istiyorsunuz?", 
                           [
                             { text: "İptal", style: "cancel" },
                             { text: "Düzenle", onPress: () => {
                                 const cal = calendars.find(c => c.id === activeCalendarId);
                                 Alert.prompt("Takvimi Düzenle", "Yeni takvim adı:", [
                                   { text: "İptal", style: "cancel" },
                                   { text: "Kaydet", onPress: (newName) => {
                                       if (newName && newName.trim()) {
                                         updateCalendar(activeCalendarId, newName.trim()).catch(e => Alert.alert("Hata", e.message));
                                       }
                                     }
                                   }
                                 ], "plain-text", cal?.name || "");
                               }
                             },
                             { text: "Sil", style: "destructive", onPress: () => {
                                 Alert.alert("Emin misiniz?", "Bu takvimi silmek istediğinize emin misiniz?", [
                                   { text: "İptal", style: "cancel" },
                                   { text: "Sil", style: "destructive", onPress: () => {
                                       deleteCalendar(activeCalendarId).catch(e => Alert.alert("Hata", e.message));
                                     }
                                   }
                                 ]);
                               }
                             }
                           ]
                         );
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Text style={{ color: '#A79E96', fontSize: 13 }}>Düzenle</Text>
                    </TouchableOpacity>
                  ) : null}
                  
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
                    style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(34, 181, 115, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 181, 115, 0.3)' }}
                  >
                    <Text style={{ color: '#22B573', fontSize: 13, fontWeight: '500' }}>+ Yeni Ekle</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.dateSelectorPill, { width: '100%', maxWidth: '100%' }]}>
                  <TouchableOpacity 
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 10 }}
                    onPress={() => {
                      const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
                      if (allOptions.length <= 1) return;
                      const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
                      const prevIndex = (currentIndex - 1 + allOptions.length) % allOptions.length;
                      setActiveCalendarId(allOptions[prevIndex].id);
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#A79E96" />
                  </TouchableOpacity>
                  
                  <Text style={[styles.dateSelectorText, { flex: 1, textAlign: 'center', fontSize: 16 }]} numberOfLines={1}>
                    {activeCalendarId ? (calendars.find(c => c.id === activeCalendarId)?.name || 'Bilinmiyor') : 'Tümü'}
                  </Text>
                  
                  <TouchableOpacity 
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 10 }}
                    onPress={() => {
                      const allOptions = [{id: null, name: 'Tümü'}, ...calendars];
                      if (allOptions.length <= 1) return;
                      const currentIndex = allOptions.findIndex(c => c.id === activeCalendarId);
                      const nextIndex = (currentIndex + 1) % allOptions.length;
                      setActiveCalendarId(allOptions[nextIndex].id);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#A79E96" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            `;
            
    c = before + newBlock + after;
    fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
    console.log("Successfully updated layout!");
} else {
    console.log("Could not find start or end index.");
}
