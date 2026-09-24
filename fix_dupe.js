const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(/chip: \{\s*backgroundColor: 'rgba\(255,255,255,0\.05\)',[\s\S]*?chipTextActive: \{\s*color: '#17151A'\s*\},/g, "chip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },\n    chipActive: { backgroundColor: '#22B573', borderColor: '#22B573' },\n    chipText: { color: '#A79E96', fontSize: 13, fontWeight: '600' },\n    chipTextActive: { color: '#17151A' },");
// If that matches twice, it will replace both with one... wait, `replace(/.../g, "replacement")` replaces both. So there will still be duplicate.
// It's better to just remove one of them!
c = c.replace(/chip: \{\s*backgroundColor: 'rgba\(255,255,255,0\.05\)',[\s\S]*?chipTextActive: \{\s*color: '#17151A'\s*\},\s*chip: \{\s*backgroundColor: 'rgba\(255,255,255,0\.05\)',[\s\S]*?chipTextActive: \{\s*color: '#17151A'\s*\},\s*/, "chip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },\n    chipActive: { backgroundColor: '#22B573', borderColor: '#22B573' },\n    chipText: { color: '#A79E96', fontSize: 13, fontWeight: '600' },\n    chipTextActive: { color: '#17151A' },\n    ");

fs.writeFileSync('src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
console.log("Fixed duplicate keys.");
