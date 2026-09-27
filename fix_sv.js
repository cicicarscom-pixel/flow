const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  "<View style={{ alignItems: 'center', marginBottom: 28 }}>",
  `<ScrollView 
                  showsVerticalScrollIndicator={false} 
                  keyboardShouldPersistTaps="handled"
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                >
                <View style={{ alignItems: 'center', marginBottom: 28 }}>`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
