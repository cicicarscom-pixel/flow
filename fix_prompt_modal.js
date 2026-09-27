const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const brokenStr = `                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

const fixedStr = `                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>`;

c = c.replace(brokenStr, fixedStr);
c = c.replace(brokenStr.replace(/\r/g, ''), fixedStr.replace(/\r/g, ''));

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
