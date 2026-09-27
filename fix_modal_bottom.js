const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /                <\/TouchableOpacity>\s*\n\s*<\/View>\s*\n\s*<\/View>\s*\n\s*<\/KeyboardAvoidingView>\s*\n\s*<\/Modal>/,
  `                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
