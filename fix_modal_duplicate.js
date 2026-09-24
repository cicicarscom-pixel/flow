const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');
const searchBlock = `{multiCalendarEnabled && (
                      <>
                        <Text style={styles.modalLabel}>Takvim Seçimi</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                          {calendars.map(cal => (
                            <TouchableOpacity 
                              key={cal.id} 
                              onPress={() => setNewApptCalendarId(cal.id)}
                              style={[styles.chip, newApptCalendarId === cal.id && styles.chipActive]}
                            >
                              <Text style={[styles.chipText, newApptCalendarId === cal.id && styles.chipTextActive]}>{cal.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </>
                    )}
                    
                    {multiCalendarEnabled && (
                      <>
                        <Text style={styles.modalLabel}>Takvim Seçimi</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                          {calendars.map(cal => (
                            <TouchableOpacity 
                              key={cal.id} 
                              onPress={() => setNewApptCalendarId(cal.id)}
                              style={[styles.chip, newApptCalendarId === cal.id && styles.chipActive]}
                            >
                              <Text style={[styles.chipText, newApptCalendarId === cal.id && styles.chipTextActive]}>{cal.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </>
                    )}`;

const fixBlock = `{multiCalendarEnabled && (
                      <>
                        <Text style={styles.modalLabel}>Takvim Seçimi</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                          {calendars.map(cal => (
                            <TouchableOpacity 
                              key={cal.id} 
                              onPress={() => setNewApptCalendarId(cal.id)}
                              style={[styles.chip, newApptCalendarId === cal.id && styles.chipActive]}
                            >
                              <Text style={[styles.chipText, newApptCalendarId === cal.id && styles.chipTextActive]}>{cal.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </>
                    )}`;

// Normalize whitespace for replacing
c = c.replace(/{multiCalendarEnabled && \([\s\S]*?<\/>\s*\)\}\s*\{multiCalendarEnabled && \([\s\S]*?<\/>\s*\)\}/, fixBlock);
fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
console.log('Fixed duplicate block');
