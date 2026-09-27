const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /serviceId: newApptService,\s*calendarId: newApptCalendarId \|\| undefined,\s*status: AppointmentStatus\.Pending,/,
  `serviceId: newApptService || 'Bilinmiyor',
          calendarId: newApptCalendarId || undefined,
          customerRequestRaw: newApptNote || null,
          status: AppointmentStatus.Pending,`
);

c = c.replace(
  `        setNewApptPhone('');
        setNewApptTime('10:00');
      } catch (e) {`,
  `        setNewApptPhone('');
        setNewApptTime('10:00');
        setNewApptNote('');
      } catch (e) {`
);

c = c.replace(
  /<View style=\{\{\s*flexDirection: 'row',\s*gap: 16,\s*zIndex: 1\s*\}\}>\s*<View style=\{\{\s*flex: 1\s*\}\}>\s*<Text style=\{styles.webModalLabel\}>Hizmet Tipi<\/Text>\s*<TextInput\s*style=\{styles.webModalInput\}\s*placeholder="Genel Bakm"\s*placeholderTextColor="rgba\(255, 255, 255, 0.4\)"\s*value=\{newApptService\}\s*onChangeText=\{setNewApptService\}\s*\/>\s*<\/View>\s*<\/View>/g,
  ``
);

// We need to just find "Hizmet Tipi" text input and replace it. Let's do it using generic matching:
c = c.replace(
  /<View style=\{\{ flexDirection: 'row', gap: 16, zIndex: 1 \}\}>[\s\S]*?onChangeText=\{setNewApptService\}\s*\/>\s*<\/View>\s*<\/View>/,
  ""
);

c = c.replace(
  /<View style=\{\{ zIndex: 1 \}\}>\s*<Text style=\{styles\.webModalLabel\}>Saat<\/Text>/,
  `{services.length > 0 && (
                <View style={{ marginBottom: 16, zIndex: 1 }}>
                  <Text style={styles.webModalLabel}>Hizmet Tipi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {services.map(s => (
                      <TouchableOpacity 
                        key={s.id}
                        onPress={() => setNewApptService(s.id)}
                        style={[styles.chip, newApptService === s.id && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, newApptService === s.id && styles.chipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ marginBottom: 16, zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Açıklama / Not</Text>
                <TextInput
                  style={[styles.webModalInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Yapay zekaya verilen notlar gibi... (Örn: Dolgum düştü dolgu yaptırmak istiyorum)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  value={newApptNote}
                  onChangeText={setNewApptNote}
                />
              </View>

              <View style={{ zIndex: 1 }}>
                <Text style={styles.webModalLabel}>Saat</Text>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
