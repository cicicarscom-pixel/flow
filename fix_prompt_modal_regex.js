const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /<Text style=\{\{ color: '#fff', fontSize: 16, fontWeight: 'bold' \}\}>Kaydet<\/Text>\s*<\/TouchableOpacity>\s*<\/ScrollView>\s*<\/View>\s*<\/View>\s*<\/KeyboardAvoidingView>\s*<\/Modal>/,
  `<Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
