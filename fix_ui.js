const fs = require('fs');
let c = fs.readFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', 'utf8');

const wrongBlock = `                      <Switch
                        value={appointmentModuleEnabled}
                        onValueChange={(val) => { setAppointmentModuleEnabled(val); handleAutoSave({ appointment_module_enabled: val }); }}
                        trackColor={{ false: '#34303C', true: '#22B573' }}
                        thumbColor="#ffffff"
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    

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
                    </View>`;

const correctBlock = `                      <Switch
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
                    </View>`;

// I will just use regex to fix the misaligned </View> tag.
c = c.replace(/style={{ transform: \[\{ scaleX: 0\.8 \}, \{ scaleY: 0\.8 \}\] }}\n\s*\/>\n\s*<View className="flex-row justify-between items-center border-t border-white\/5 pt-4 mb-4">/g, 
`style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
  
                    <View className="flex-row justify-between items-center border-t border-white/5 pt-4 mb-4">`);

fs.writeFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', c, 'utf8');
console.log("Fixed.");
