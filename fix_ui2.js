const fs = require('fs');
let c = fs.readFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', 'utf8');

const regex = /<View style=\{styles\.glassCard\} className="p-4 mb-4">[\s\S]*?<View className="flex-row justify-between items-center border-t border-white\/5 pt-4">[\s\S]*?className="text-white text-xs px-2 py-2 text-center"\s*\/>\s*<\/View>\s*<\/View>\s*<\/View>/;

const replacement = `<View style={styles.glassCard} className="p-4 mb-4">
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-1 pr-2">
                        <Text className="text-white text-sm font-bold mb-1">Randevu / Rezervasyon Özelliği</Text>
                        <Text className="text-gray-400 text-[10px] leading-3">Kapatırsanız AI randevu almaya çalışmaz, sadece bilgi verir.</Text>
                      </View>
                      <Switch
                        value={appointmentModuleEnabled}
                        onValueChange={(val) => { setAppointmentModuleEnabled(val); handleAutoSave({ appointment_module_enabled: val }); }}
                        trackColor={{ false: '#34303C', true: '#22B573' }}
                        thumbColor="#ffffff"
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>

                    <View className="flex-row justify-between items-center border-t border-white/5 pt-4 mb-4">
                      <View className="flex-1 pr-2">
                        <Text className="text-white text-sm font-bold mb-1">Personel / Çoklu Takvim Modu</Text>
                        <Text className="text-gray-400 text-[10px] leading-3">Müşteriler randevu alırken personel veya hizmet veren seçebilir.</Text>
                      </View>
                      <Switch
                        value={multiCalendarEnabled}
                        onValueChange={(val) => { setMultiCalendarEnabled(val); handleMultiCalendarSave(val); }}
                        trackColor={{ false: '#34303C', true: '#22B573' }}
                        thumbColor="#ffffff"
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>

                    <View className="flex-row justify-between items-center border-t border-white/5 pt-4">
                      <View className="flex-1 mr-4">
                        <Text className="text-white text-sm font-bold mb-1">Saat Dilimi (Timezone)</Text>
                        <Text className="text-gray-400 text-[10px] leading-3">Örn: Europe/Istanbul</Text>
                      </View>
                      <View className="bg-white/5 border border-white/10 rounded-lg overflow-hidden" style={{ width: 140 }}>
                        <TextInput
                          value={timezone}
                          onChangeText={(val) => setTimezone(val)}
                          onEndEditing={(e) => handleAutoSave({ timezone: e.nativeEvent.text })}
                          className="text-white text-xs px-2 py-2 text-center"
                        />
                      </View>
                    </View>
                  </View>`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', c, 'utf8');
    console.log("Block replaced successfully.");
} else {
    console.log("Could not find the block to replace.");
}
