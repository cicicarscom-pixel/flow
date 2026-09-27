const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const target = `              </TouchableOpacity>\r
            </View>\r
          </View>\r
        </KeyboardAvoidingView>\r
      </Modal>`;

const target2 = `              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

c = c.replace(target, `              </TouchableOpacity>\r
              </ScrollView>\r
            </View>\r
          </View>\r
        </KeyboardAvoidingView>\r
      </Modal>`);

c = c.replace(target2, `              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
