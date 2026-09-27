const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  /<ScrollView\s*\n\s*horizontal\s*\n\s*showsHorizontalScrollIndicator=\{false\}\s*\n\s*contentContainerStyle=\{styles\.calendarStrip\}\s*\n\s*style=\{styles\.calendarScroll\}\s*>/,
  `<ScrollView
            ref={calendarScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarStrip}
            style={styles.calendarScroll}
          >`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
