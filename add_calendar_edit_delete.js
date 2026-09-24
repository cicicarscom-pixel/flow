const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// 1. Destructure updateCalendar and deleteCalendar
c = c.replace(
    'const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar } = useCalendars();',
    'const { calendars, multiCalendarEnabled, activeCalendarId, setActiveCalendarId, createCalendar, updateCalendar, deleteCalendar } = useCalendars();'
);

// 2. Replace the center Text of the stepper with a TouchableOpacity containing the text and an ellipsis
const textRegex = /<Text style=\{\[styles\.dateSelectorText, \{ flex: 1, textAlign: 'center' \}\]\} numberOfLines=\{1\}>[\s\S]*?<\/Text>/;
const touchableReplacement = `<TouchableOpacity 
                      disabled={!activeCalendarId}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
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
                    >
                      <Text style={[styles.dateSelectorText, { textAlign: 'center' }]} numberOfLines={1}>
                        {activeCalendarId ? (calendars.find(c => c.id === activeCalendarId)?.name || 'Bilinmiyor') : 'Tümü'}
                      </Text>
                      {activeCalendarId ? (
                        <Ionicons name="ellipsis-vertical" size={14} color="#A79E96" style={{ marginLeft: 4 }} />
                      ) : null}
                    </TouchableOpacity>`;

if (textRegex.test(c)) {
    c = c.replace(textRegex, touchableReplacement);
    console.log("Successfully injected edit/delete logic!");
} else {
    console.log("Could not find stepper text block!");
}

fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
