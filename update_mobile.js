const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf-8');

// Remove condition in Modal
c = c.replace(
  "{multiCalendarEnabled && (\\n                      <View style={{ marginBottom: 12 }}>",
  "<View style={{ marginBottom: 12 }}>"
);

c = c.replace(
  `                        )}
                      </View>
                    )}`,
  `                        )}
                      </View>`
);

// Remove condition in handleSaveAppointment
c = c.replace(
  "calendarId: multiCalendarEnabled ? newApptCalendarId : undefined,",
  "calendarId: newApptCalendarId || undefined,"
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c);
console.log("Success Mobile");
