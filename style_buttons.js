const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const regex = /<View style=\{\{\s*flexDirection:\s*'row',\s*justifyContent:\s*'flex-end',\s*alignItems:\s*'center',\s*marginBottom:\s*10,\s*gap:\s*15\s*\}\}>([\s\S]*?)<\/View>\s*<View style=\{\[styles\.dateSelectorPill/;

const newButtons = `<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14, gap: 16, width: '100%' }}>
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
                      style={{ width: '45%', maxWidth: 160, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '500' }}>Düzenle</Text>
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
                    style={{ width: '45%', maxWidth: 160, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(34, 181, 115, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 181, 115, 0.3)' }}
                  >
                    <Text style={{ color: '#22B573', fontSize: 14, fontWeight: '500' }}>+ Yeni Ekle</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.dateSelectorPill`;

if (regex.test(c)) {
    c = c.replace(regex, newButtons);
    fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
    console.log("Successfully styled the buttons symmetrically!");
} else {
    console.log("Could not find the target buttons code block.");
}
