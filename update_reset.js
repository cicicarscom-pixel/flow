const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');
c = c.replace(
  /setNewApptTime\('10:00'\);\r?\n\s*\} catch \(e\) \{/,
  `setNewApptTime('10:00');\n      setNewApptNote('');\n    } catch (e) {`
);
fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c);
