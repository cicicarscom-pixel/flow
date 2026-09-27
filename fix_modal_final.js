const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

// 1. Add ScrollView opening tag
c = c.replace(
  /              <\/View>\r?\n\s*<Text style=\{styles\.webModalLabel\}>Tarih<\/Text>/,
  `              </View>
              
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                            <Text style={styles.webModalLabel}>Tarih</Text>`
);

// 2. Add ScrollView closing tag before the end of the modal content view
const endStr = `              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;
      
const replacementEndStr = `              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;
      
c = c.replace(endStr, replacementEndStr);
// Fallback if line endings don't match exactly
c = c.replace(endStr.replace(/\r\n/g, '\n'), replacementEndStr.replace(/\r\n/g, '\n'));

// 3. Update maxHeight of modalContent
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
