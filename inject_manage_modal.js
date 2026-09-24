const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const addApptModalIndex = c.indexOf('{/*  ADD APPOINTMENT MODAL  */}');
if (addApptModalIndex !== -1 && !c.includes('Takvim / Personel Yönetimi')) {
    const manageModalCode = `
        {/* Personel Yönetimi Modalı */}
        <Modal visible={isManageModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Takvim / Personel Yönetimi</Text>
                <TouchableOpacity onPress={() => setIsManageModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#A79E96" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {calendars.length === 0 ? (
                  <Text style={{ color: '#A79E96', textAlign: 'center', marginVertical: 20 }}>Henüz takvim bulunmuyor.</Text>
                ) : (
                  calendars.map(cal => (
                    <View key={cal.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                      <Text style={{ color: '#fff', fontSize: 16, flex: 1 }} numberOfLines={1}>{cal.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 20, marginLeft: 10 }}>
                        <TouchableOpacity onPress={() => {
                            Alert.prompt("Takvimi Düzenle", "Yeni takvim adı:", [
                              { text: "İptal", style: "cancel" },
                              { text: "Kaydet", onPress: (newName) => {
                                  if (newName && newName.trim()) {
                                    updateCalendar(cal.id, newName.trim()).catch(e => Alert.alert("Hata", e.message));
                                  }
                                }
                              }
                            ], "plain-text", cal.name);
                        }}>
                          <Ionicons name="pencil" size={22} color="#22B573" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            Alert.alert("Emin misiniz?", \`'\${cal.name}' silinecek.\`, [
                              { text: "İptal", style: "cancel" },
                              { text: "Sil", style: "destructive", onPress: () => {
                                  deleteCalendar(cal.id).catch(e => Alert.alert("Hata", e.message));
                                }
                              }
                            ]);
                        }}>
                          <Ionicons name="trash" size={22} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

`;
    c = c.substring(0, addApptModalIndex) + manageModalCode + c.substring(addApptModalIndex);
    fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
    console.log("Successfully injected the management modal!");
} else {
    console.log("Could not inject modal.");
}
