const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /<View style=\{\{ alignItems: 'center', marginBottom: 28 \}\}>/,
  `<ScrollView 
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
              <View style={{ alignItems: 'center', marginBottom: 28 }}>`
);

c = c.replace(
  /                  <Text style=\{styles\.webSaveButtonText\}>\{t\('randevu\.randevuScreen\.saveAppointment', 'Randevu Olutur'\)\}<\/Text>\r?\n\s*\)\}\r?\n\s*<\/TouchableOpacity>\r?\n\s*<\/View>\r?\n\s*<\/View>\r?\n\s*<\/KeyboardAvoidingView>\r?\n\s*<\/Modal>/,
  `                  <Text style={styles.webSaveButtonText}>{t('randevu.randevuScreen.saveAppointment', 'Randevu Oluştur')}</Text>
                )}
              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`
);

c = c.replace(
  /modalContent: \{\r?\n\s*backgroundColor: '#201D24',\r?\n\s*borderTopLeftRadius: 24, borderTopRightRadius: 24,\r?\n\s*padding: 20, paddingBottom: 40,\r?\n\s*borderTopWidth: 1, borderColor: 'rgba\(255,255,255,0\.05\)',\r?\n\s*\}/,
  `modalContent: {
      backgroundColor: '#201D24',
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      maxHeight: Platform.OS === 'ios' ? '85%' : '90%'
    }`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
