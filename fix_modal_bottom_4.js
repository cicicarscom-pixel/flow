const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /                  <Text style=\{styles\.webSaveButtonText\}>\{t\('randevu\.randevuScreen\.saveAppointment', 'Randevu Olutur'\)\}<\/Text>\r?\n\s*\)\}\r?\n\s*<\/TouchableOpacity>/g,
  `                  <Text style={styles.webSaveButtonText}>{t('randevu.randevuScreen.saveAppointment', 'Randevu Oluştur')}</Text>
                )}
              </TouchableOpacity>
              </ScrollView>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
