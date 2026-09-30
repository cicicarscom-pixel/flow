// Çeviri dosyalarında her dilin aynı anahtarlara sahip olduğunu denetler.
// Kullanım: node scripts/ci/i18n-parity.mjs <klasör> <istisna.json> tr en de
// istisna.json: { "tr": ["bilinçli olarak eksik anahtar", ...], "en": [], "de": [] }
import fs from 'node:fs';
const [dir, ignoreFile, ...langs] = process.argv.slice(2);
if (!dir || !ignoreFile || langs.length < 2) { console.log('Kullanım: node i18n-parity.mjs <klasör> <istisna.json> tr en de'); process.exit(2); }
const ignore = JSON.parse(fs.readFileSync(ignoreFile, 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v)) ? flat(v, p + k + '.') : [p + k]);
const sets = Object.fromEntries(langs.map((l) => [l, new Set(flat(JSON.parse(fs.readFileSync(`${dir}/${l}.json`, 'utf8'))))]));
const all = new Set(langs.flatMap((l) => [...sets[l]]));
let missing = 0;
for (const l of langs) {
  const skip = new Set(ignore[l] || []);
  const miss = [...all].filter((k) => !sets[l].has(k) && !skip.has(k));
  missing += miss.length;
  console.log(`${l}: ${sets[l].size} anahtar, eksik ${miss.length}${miss.length ? ' → ' + miss.join(', ') : ''}`);
}
if (missing) { console.log('HATA: eksik çeviri anahtarı var'); process.exit(1); }
console.log('OK: çeviri anahtarları eşit');
