const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const regex = /              <\/TouchableOpacity>\r?\n            <\/View>\r?\n          <\/View>\r?\n        <\/KeyboardAvoidingView>\r?\n      <\/Modal>/g;

c = c.replace(regex, `              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
