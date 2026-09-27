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
  /                  \<\/TouchableOpacity>\s*\n\s*\<\/View>\s*\n\s*\<\/View>\s*\n\s*\<\/KeyboardAvoidingView>\s*\n\s*\<\/Modal>/,
  `                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>`
);

// Also add a maxHeight to the modal content so it doesn't push off screen
c = c.replace(
  /shadowOpacity: 0\.4, shadowRadius: 48, elevation: 10\s*\}\]\}>/,
  `shadowOpacity: 0.4, shadowRadius: 48, elevation: 10,
                maxHeight: Platform.OS === 'ios' ? '85%' : '90%'
              }]}>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
