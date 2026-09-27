const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /onChange=\{\(event, selectedDateObj\) => \{[\s\S]*?\}\}/,
  `onValueChange={(selectedDateObj) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selectedDateObj) {
                      const y = selectedDateObj.getFullYear();
                      const m = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
                      const d = String(selectedDateObj.getDate()).padStart(2, '0');
                      setSelectedDate(\`\${y}-\${m}-\${d}\`);
                    }
                  }}
                  onDismiss={() => setShowDatePicker(false)}`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
