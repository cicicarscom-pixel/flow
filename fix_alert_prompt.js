const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// 1. Add state
if (!c.includes('promptConfig')) {
    c = c.replace(
        'const [isManageModalVisible, setIsManageModalVisible] = useState(false);',
        'const [isManageModalVisible, setIsManageModalVisible] = useState(false);\n  const [promptConfig, setPromptConfig] = useState({ visible: false, title: "", placeholder: "", value: "", onSave: null });'
    );
}

// 2. Replace Alert.prompt for "Yeni Takvim"
c = c.replace(
    /Alert\.prompt\(\s*"Yeni Takvim",\s*"Yeni takvim\/personel adını girin:",\s*\[[\s\S]*?\]\s*\);/,
    `setPromptConfig({
                        visible: true,
                        title: "Yeni Takvim",
                        placeholder: "Yeni takvim/personel adını girin",
                        value: "",
                        onSave: (name) => {
                          if (name && name.trim()) {
                            createCalendar(name.trim()).catch(e => Alert.alert("Hata", e.message));
                          }
                        }
                      });`
);

// 3. Replace Alert.prompt for "Takvimi Düzenle"
c = c.replace(
    /Alert\.prompt\("Takvimi Düzenle",\s*"Yeni takvim adı:",\s*\[[\s\S]*?\]\s*,\s*"plain-text",\s*cal\.name\);/,
    `setPromptConfig({
                            visible: true,
                            title: "Takvimi Düzenle",
                            placeholder: "Yeni takvim adı",
                            value: cal.name,
                            onSave: (newName) => {
                              if (newName && newName.trim()) {
                                updateCalendar(cal.id, newName.trim()).catch(e => Alert.alert("Hata", e.message));
                              }
                            }
                          });`
);

// 4. Inject Modal
if (!c.includes('promptConfig.visible')) {
    const promptModalCode = `
        {/* Custom Prompt Modal */}
        <Modal visible={promptConfig.visible} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{promptConfig.title}</Text>
              <TextInput
                 style={[styles.modalInput, { marginTop: 20 }]}
                 placeholder={promptConfig.placeholder}
                 placeholderTextColor="#A79E96"
                 value={promptConfig.value}
                 onChangeText={(t) => setPromptConfig(p => ({...p, value: t}))}
                 autoFocus
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 15 }}>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null })}>
                  <Text style={{ color: '#A79E96', fontSize: 16 }}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        `;
        
    c = c.replace('{/* Personel Yönetimi Modalı */}', promptModalCode + '\n        {/* Personel Yönetimi Modalı */}');
}

fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
console.log("Successfully replaced Alert.prompt with Custom Prompt Modal!");
