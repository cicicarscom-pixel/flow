// Görsel/medya/font başvurularının gerçekten var olan dosyayı gösterdiğini denetler.
// Kullanım: node scripts/ci/check-assets.mjs <klasör|dosya>...   (app.json varsa onu da denetler)
// Çıkış kodu: 0 = hepsi var, 1 = eksik dosya var, 2 = hiç dosya taranmadı
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const roots = process.argv.slice(2);
const files = execSync(`git -c core.quotepath=off ls-files -- ${roots.map((r) => JSON.stringify(r)).join(' ')}`, { encoding: 'utf8' })
  .split('\n').filter((f) => /\.(js|jsx|ts|tsx|mjs)$/.test(f) && !f.includes('node_modules'));
if (files.length === 0) { console.log('HATA: taranacak dosya yok'); process.exit(2); }

const ASSET = /\.(png|jpe?g|gif|webp|svg|mp4|mov|mp3|wav|ttf|otf|lottie|json)$/i;
const RE = /(?:require\(\s*|import\s+[^'"]*?from\s+|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g;
const missing = [];
let checked = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(RE)) {
    const ref = m[1];
    if (!ASSET.test(ref)) continue;
    checked++;
    const target = path.join(path.dirname(f), ref);
    if (!fs.existsSync(target)) missing.push(`${f}: ${ref}`);
  }
}
if (fs.existsSync('app.json')) {
  const txt = fs.readFileSync('app.json', 'utf8');
  for (const m of txt.matchAll(/"(\.\/[^"]+\.(?:png|jpe?g|gif|webp|svg|icon))"/gi)) {
    checked++;
    if (!fs.existsSync(m[1])) missing.push(`app.json: ${m[1]}`);
  }
}
console.log(`Taranan kod dosyası: ${files.length}, denetlenen başvuru: ${checked}`);
if (missing.length) { console.log('EKSİK DOSYA:\n' + missing.join('\n')); process.exit(1); }
console.log('OK: bütün görsel/medya başvuruları mevcut');
