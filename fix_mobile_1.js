const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /<Text style=\{styles\.cardService\}>\s*\{appt\.services\?\.length > 0 \? appt\.services\.join\(' \+ '\) : \(appt\.customerRequestRaw \? `[^`]+` : t\('randevu\.randevuScreen\.noAppointments'\)\)\}\s*<\/Text>/,
  `{(appt.services && appt.services.length > 0) && (
                            <Text style={styles.cardService}>
                              {appt.services.join(' + ')}
                            </Text>
                          )}
                          {appt.customerRequestRaw && (
                            <Text style={[styles.cardService, { color: '#F59E0B' }]}>
                              📝 {appt.customerRequestRaw}
                            </Text>
                          )}`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
