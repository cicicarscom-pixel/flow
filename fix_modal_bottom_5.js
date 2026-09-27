const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const target = `              <TouchableOpacity 
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
              </TouchableOpacity>`;

c = c.replace(target, target + '\n              </ScrollView>');
c = c.replace(target.replace(/\r\n/g, '\n'), target.replace(/\r\n/g, '\n') + '\n              </ScrollView>');
c = c.replace(target.replace('Oluştur', 'Olu\u015Ftur'), target.replace('Oluştur', 'Olu\u015Ftur') + '\n              </ScrollView>');
c = c.replace(target.replace('Oluştur', 'Olu\u015Ftur').replace(/\r\n/g, '\n'), target.replace('Oluştur', 'Olu\u015Ftur').replace(/\r\n/g, '\n') + '\n              </ScrollView>');

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
