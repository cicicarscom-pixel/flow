const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  `              <ScrollView \r
                  showsVerticalScrollIndicator={false} \r
                  keyboardShouldPersistTaps="handled"\r
                  style={{ flexGrow: 0 }}\r
                  contentContainerStyle={{ paddingBottom: 24 }}\r
                >`,
  `              <ScrollView \r
                  showsVerticalScrollIndicator={false} \r
                  keyboardShouldPersistTaps="handled"\r
                  style={{ flexShrink: 1, width: '100%' }}\r
                  contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}\r
                >`
);

c = c.replace(
  `              <ScrollView \n                  showsVerticalScrollIndicator={false} \n                  keyboardShouldPersistTaps="handled"\n                  style={{ flexGrow: 0 }}\n                  contentContainerStyle={{ paddingBottom: 24 }}\n                >`,
  `              <ScrollView \n                  showsVerticalScrollIndicator={false} \n                  keyboardShouldPersistTaps="handled"\n                  style={{ flexShrink: 1, width: '100%' }}\n                  contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}\n                >`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
