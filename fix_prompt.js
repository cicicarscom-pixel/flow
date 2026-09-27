const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  `                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`,
  `                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>`
);

c = c.replace(
  `                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>\r
              </ScrollView>\r
            </View>\r
          </View>\r
        </KeyboardAvoidingView>\r
      </Modal>`,
  `                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#22B573', borderRadius: 8 }} onPress={() => {
                  if (promptConfig.onSave) promptConfig.onSave(promptConfig.value);
                  setPromptConfig({ visible: false, title: '', placeholder: '', value: '', onSave: null });
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Kaydet</Text>
                </TouchableOpacity>\r
              </View>\r
            </View>\r
          </KeyboardAvoidingView>\r
        </Modal>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
