const fs = require('fs');
let c = fs.readFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', 'utf8');
const search = `                    <View className="flex-row justify-between items-center border-t border-white/5 pt-4">
                      <View className="flex-1 mr-4">
                        <Text className="text-white text-sm font-bold mb-1">Saat Dilimi (Timezone)</Text>`;
const replacement = `                    <View className="flex-row justify-between items-center border-t border-white/5 pt-4 mb-4">
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
                        <Text className="text-white text-sm font-bold mb-1">Saat Dilimi (Timezone)</Text>`;
if (c.includes(search)) {
    c = c.replace(search, replacement);
    fs.writeFileSync('src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js', c, 'utf8');
    console.log('Success');
} else {
    console.log('Not found');
}
