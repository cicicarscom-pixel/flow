const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

if (!c.includes('@react-native-community/datetimepicker')) {
  c = c.replace(
    /import \{ View, Text, ScrollView/,
    "import DateTimePicker from '@react-native-community/datetimepicker';\nimport { View, Text, ScrollView"
  );
}

// Add state for date picker
if (!c.includes('showDatePicker')) {
  c = c.replace(
    /const \[currentDate, setCurrentDate\] = useState\(new Date\(\)\);/,
    `const [currentDate, setCurrentDate] = useState(new Date());\n  const [showDatePicker, setShowDatePicker] = useState(false);`
  );
}

// Replace the Date chips with a simulated input
c = c.replace(
  /<Text style=\{styles\.webModalLabel\}>Tarih<\/Text>\s*<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{ marginBottom: 16 \}\}>\s*\{dynamicDays\.map\([^}]+\}\}\s*<\/TouchableOpacity>\s*\)\)\}\s*<\/ScrollView>/,
  `<Text style={styles.webModalLabel}>Tarih</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.webModalInput, { marginBottom: 16, justifyContent: 'center' }]}
              >
                <Text style={{ color: selectedDate ? '#fff' : '#A79E96', fontSize: 14 }}>
                  {selectedDate || 'YYYY-AA-GG'}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(selectedDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDateObj) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (event.type === 'set' && selectedDateObj) {
                      const y = selectedDateObj.getFullYear();
                      const m = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
                      const d = String(selectedDateObj.getDate()).padStart(2, '0');
                      setSelectedDate(\`\${y}-\${m}-\${d}\`);
                    } else if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                    }
                  }}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 }}>
                  <Text style={{ color: '#22B573', fontWeight: 'bold' }}>Bitti</Text>
                </TouchableOpacity>
              )}`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
