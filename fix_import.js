const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');
const lines = c.split('\n');
let newLines = [];
let found = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("import { useCalendars } from '../hooks/useCalendars';")) {
        if (!found) {
            newLines.push(lines[i]);
            found = true;
        } else {
            // skip second occurrence
            console.log("Skipped line " + (i + 1));
        }
    } else {
        newLines.push(lines[i]);
    }
}
fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', newLines.join('\n'), 'utf8');
