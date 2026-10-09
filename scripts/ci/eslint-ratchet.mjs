// ESLint "çıta" kontrolü: hata/uyarı sayısı kayıtlı tabanı (baseline) AŞAMAZ.
// Kullanım: node scripts/ci/eslint-ratchet.mjs <baseline.json> <eslint argümanları...>
// Sayı tabanın altına inerse CI geçer ve tabanın düşürülmesi istenir (iyileşme kaybolmasın).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [baselinePath, ...eslintArgs] = process.argv.slice(2);
if (!baselinePath || eslintArgs.length === 0) {
  console.error('Kullanım: node scripts/ci/eslint-ratchet.mjs <baseline.json> <eslint argümanları...>');
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const run = spawnSync('npx', ['eslint', ...eslintArgs, '-f', 'json'], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
  shell: process.platform === 'win32',
});

let results;
try {
  results = JSON.parse(run.stdout);
} catch {
  console.error('ESLint çıktısı okunamadı (yapılandırma/çalışma hatası):');
  console.error((run.stderr || run.stdout || '').slice(0, 2000));
  process.exit(2);
}

let errors = 0;
let warnings = 0;
for (const f of results) {
  errors += f.errorCount;
  warnings += f.warningCount;
}

console.log(`ESLint: ${errors} hata, ${warnings} uyarı (taban: ${baseline.errors} hata, ${baseline.warnings} uyarı)`);

if (errors > baseline.errors || warnings > baseline.warnings) {
  console.error('HATA: ESLint sayıları tabanı AŞTI. Yeni sorun eklendi; düzeltin (tabanı yükseltmek yasak).');
  const byRule = {};
  for (const f of results) for (const m of f.messages) byRule[m.ruleId] = (byRule[m.ruleId] || 0) + 1;
  console.error('Kural başına sayılar:', JSON.stringify(byRule));
  process.exit(1);
}
if (errors < baseline.errors || warnings < baseline.warnings) {
  console.log('İYİLEŞME: sayılar tabanın altında. scripts/ci/eslint-baseline.json değerlerini yeni sayılara düşürün.');
}
console.log('OK: ESLint çıtası korundu');
