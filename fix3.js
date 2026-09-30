const fs = require('fs');
const path = 'src/modules/randevu/presentation/screens/RandevuScreen.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /rowLabels:\s*\{[^}]+\}/,
  \owLabels: { justifyContent: 'flex-start', paddingVertical: 2, gap: 5 }\
);
content = content.replace(
  /rowLabel:\s*\{[^}]+\}/,
  \owLabel: { fontSize: 8, fontWeight: '700', color: '#A79E96', letterSpacing: 0.5, textAlign: 'right', width: 36, height: 28, lineHeight: 28 }\
);

fs.writeFileSync(path, content, 'utf8');
