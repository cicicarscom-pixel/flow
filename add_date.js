const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(/<Text style=\{styles\.webModalLabel\}>M.*?teri Ad.*?<\/Text>/, 
`              <Text style={styles.webModalLabel}>Tarih</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {dynamicDays.map(day => (
                    <TouchableOpacity 
                      key={day.fullDate}
                      onPress={() => setSelectedDate(day.fullDate)}
                      style={[styles.chip, selectedDate === day.fullDate && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selectedDate === day.fullDate && styles.chipTextActive]}>{day.name} {day.date}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <Text style={styles.webModalLabel}>Müşteri Adı</Text>`);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
