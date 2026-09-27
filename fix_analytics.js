const fs = require('fs');

let content = fs.readFileSync('C:/Users/roman/flow/src/modules/sosyal_medya/presentation/screens/AnalyticsScreen.js', 'utf8');

if (!content.includes('import { todayInTimezone, addDaysYmd }')) {
  content = content.replace("import { View, Text, StyleSheet, ScrollView", "import { todayInTimezone, addDaysYmd } from '../../../../../lib/dates';\nimport { View, Text, StyleSheet, ScrollView");
}

content = content.replace(
  /const _toDate = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];\s*const _fromDate = new Date\(Date\.now\(\) - \(selectedTimeRange\?\.days \|\| 30\) \* 24 \* 60 \* 60 \* 1000\)\.toISOString\(\)\.split\('T'\)\[0\];/g,
  `const tz = 'Europe/Istanbul'; // We can grab user timezone if available, fallback Istanbul
      const _toDate = todayInTimezone(tz);
      const _fromDate = addDaysYmd(_toDate, -(selectedTimeRange?.days || 30));`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/sosyal_medya/presentation/screens/AnalyticsScreen.js', content, 'utf8');
