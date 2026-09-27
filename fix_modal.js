const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// Wrap modal content in ScrollView
c = c.replace(
  /<View style=\{\{ display: "flex", flexDirection: "column", gap: 16 \}\}>\s*<Text style=\{styles\.webModalLabel\}>Tarih<\/Text>/,
  `<ScrollView 
                  showsVerticalScrollIndicator={false} 
                  keyboardShouldPersistTaps="handled"
                  style={{ flexGrow: 0 }}
                >
              <View style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Text style={styles.webModalLabel}>Tarih</Text>`
);

c = c.replace(
  /                  \<\/TouchableOpacity>\s*<\/View>\s*<\/View>\s*<\/KeyboardAvoidingView>/,
  `                  </TouchableOpacity>
              </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>`
);

c = c.replace(
  /modalContent: \{\s*backgroundColor: '#201D24',\s*borderTopLeftRadius: 24, borderTopRightRadius: 24,\s*padding: 20, paddingBottom: 40,\s*borderTopWidth: 1, borderColor: 'rgba\(255,255,255,0\.05\)',\s*\}/,
  `modalContent: {
      backgroundColor: '#201D24',
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      maxHeight: '90%'
    }`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
