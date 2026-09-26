let c = Deno.readTextFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js');
let lines = c.split('\\n');

// 479 is index 479 since it's 0-indexed and lines[479] corresponds to line 480
// 588 is index 587 corresponding to 588. 

const newModal = `        <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { 
              backgroundColor: '#201D24', padding: 32, borderRadius: 32, 
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, 
              shadowOpacity: 0.4, shadowRadius: 48, elevation: 10
            }]}>
              
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={{ 
                  position: 'absolute', top: 20, right: 20, width: 36, height: 36, 
                  borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', 
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', 
                  alignItems: 'center', justifyContent: 'center', zIndex: 10 
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
              
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <View style={{ 
                  width: 64, height: 64, borderRadius: 32, 
                  backgroundColor: 'rgba(34,181,115,0.2)', 
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12 
                }}>
                  <Text style={{ fontSize: 32 }}>🪄</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', margin: 0 }}>
                  {t('randevu.randevuScreen.addAppointment', 'Yeni Randevu Ekle')}
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                  Takviminize yeni bir kayıt oluşturun
                </Text>
              </View>
              
              <Text style={styles.webModalLabel}>Müşteri Adı</Text>
              <TextInput
                style={styles.webModalInput}
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newApptName}
                onChangeText={setNewApptName}
              />

              <Text style={styles.webModalLabel}>Telefon Numarası</Text>
              <TextInput
                style={styles.webModalInput}
                placeholder="Örn: +90 555 123 4567"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={newApptPhone}
                onChangeText={setNewApptPhone}
                keyboardType="phone-pad"
              />

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  
                  {multiCalendarEnabled && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.webModalLabel}>Takvim</Text>
                        <TouchableOpacity 
                          style={[styles.webModalInput, { paddingVertical: 14 }]} 
                          onPress={() => setShowCalendarDropdown(!showCalendarDropdown)}
                        >
                          <Text style={{ color: newApptCalendarId ? '#fff' : 'rgba(255, 255, 255, 0.4)' }}>
                            {newApptCalendarId ? calendars.find(c => c.id === newApptCalendarId)?.name : "Seçiniz"}
                          </Text>
                        </TouchableOpacity>
                        
                        {showCalendarDropdown && (
                          <View style={{ backgroundColor: '#1A181C', borderRadius: 16, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                            {calendars.map(cal => (
                              <TouchableOpacity 
                                key={cal.id} 
                                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                                onPress={() => { setNewApptCalendarId(cal.id); setShowCalendarDropdown(false); }}
                              >
                                <Text style={{ color: newApptCalendarId === cal.id ? '#22B573' : '#fff' }}>{cal.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  <Text style={styles.webModalLabel}>Saat</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      {availableModalHours.map(hour => (
                        <TouchableOpacity 
                          key={hour}
                          onPress={() => setNewApptTime(hour)}
                          style={[styles.chip, newApptTime === hour && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, newApptTime === hour && styles.chipTextActive]}>{hour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.webModalLabel}>Hizmet Tipi</Text>
                  <TextInput
                    style={styles.webModalInput}
                    placeholder="Genel Bakım"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={newApptService}
                    onChangeText={setNewApptService}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.webSaveButton}
                activeOpacity={0.8}
                onPress={handleSaveAppointment}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#1C3327" />
                ) : (
                  <Text style={styles.webSaveButtonText}>{t('randevu.randevuScreen.saveAppointment', 'Randevu Oluştur')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

lines.splice(479, 109, newModal);
c = lines.join('\\n');

// And append the styles
const stylesToAppend = \`
  webModalLabel: {
    fontSize: 12, fontWeight: '600', color: '#A79E96', marginBottom: 8, paddingLeft: 4
  },
  webModalInput: {
    width: '100%', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, marginBottom: 16
  },
  webSaveButton: {
    width: '100%', padding: 16, borderRadius: 16, marginTop: 8,
    backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4
  },
  webSaveButtonText: {
    color: '#17151A', fontWeight: '700', fontSize: 15
  },\`;

c = c.replace(
  "modalInput: {",
  stylesToAppend + "\\n  modalInput: {"
);

Deno.writeTextFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c);
console.log("Success");
