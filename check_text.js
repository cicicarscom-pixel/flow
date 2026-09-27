const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf-8');

let lines = c.split('\\n');
for (let i = 0; i < lines.length; i++) {
    // looking for stuff outside <...>, ignoring {}
    // It's easier to just find the line that has the problem.
    if (lines[i].includes(';\r') && lines[i].includes('const busy = isSlotBusy')) {
        console.log("Found line", i, lines[i]);
    }
}
