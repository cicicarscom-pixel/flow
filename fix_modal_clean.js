const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /<View style=\{\{\s*alignItems: 'center',\s*marginBottom: 28\s*\}\}>/,
  `<ScrollView 
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
              <View style={{ alignItems: 'center', marginBottom: 28 }}>`
);

// We must place </ScrollView> AFTER the </TouchableOpacity> for handleSaveAppointment.
const closingStr = `                )}\r
              </TouchableOpacity>\r
            </View>\r
          </View>\r
        </KeyboardAvoidingView>\r
      </Modal>`;
      
const replacement = `                )}\r
              </TouchableOpacity>\r
              </ScrollView>\r
            </View>\r
          </View>\r
        </KeyboardAvoidingView>\r
      </Modal>`;

c = c.replace(closingStr, replacement);
c = c.replace(closingStr.replace(/\r/g, ''), replacement.replace(/\r/g, ''));

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
