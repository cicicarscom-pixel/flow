const fs = require('fs');
let c = fs.readFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', 'utf8');

const anchor = `                        <Text className="text-gray-400 text-[10px] leading-3">Kapatırsanız AI randevu almaya çalışmaz, \nsadece bilgi verir.</Text>\n                      </View>\n                      <Switch\n                        value={appointmentModuleEnabled}\n                        onValueChange={(val) => { setAppointmentModuleEnabled(val); handleAutoSave({ appointment_module_enabled: val }); }}\n                        trackColor={{ false: '#34303C', true: '#22B573' }}\n                        thumbColor="#ffffff"\n                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}\n                      />\n                    </View>`;

const blockToInsert = `\n\n                    <View className="flex-row justify-between items-center border-t border-white/5 pt-4 mb-4">\n                      <View className="flex-1 pr-2">\n                        <Text className="text-white text-sm font-bold mb-1">Personel / Çoklu Takvim Modu</Text>\n                        <Text className="text-gray-400 text-[10px] leading-3">Müşteriler randevu alırken personel veya hizmet veren seçebilir.</Text>\n                      </View>\n                      <Switch\n                        value={multiCalendarEnabled}\n                        onValueChange={(val) => { setMultiCalendarEnabled(val); handleMultiCalendarSave(val); }}\n                        trackColor={{ false: '#34303C', true: '#22B573' }}\n                        thumbColor="#ffffff"\n                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}\n                      />\n                    </View>`;

if (c.indexOf("Kapatırsanız AI randevu almaya çalışmaz,") !== -1) {
    const lines = c.split('\n');
    let insertIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('setAppointmentModuleEnabled(val); handleAutoSave({ appointment_module_enabled: val });')) {
            insertIdx = i + 5; // skip past the Switch and View close
            break;
        }
    }
    
    if (insertIdx !== -1) {
        lines.splice(insertIdx, 0, blockToInsert);
        fs.writeFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', lines.join('\n'), 'utf8');
        console.log("Success with lines logic!");
    } else {
        console.log("Could not find insert point.");
    }
} else {
    console.log("Could not find anchor text at all");
}
