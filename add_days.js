const fs = require('fs');

const addDaysYmdFn = `
/** "YYYY-MM-DD" + n gün → "YYYY-MM-DD" (saat dilimi ve tarayıcıdan bağımsız) */
export function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
`;

['C:/Users/roman/flowweb/src/lib/dates.ts', 'C:/Users/roman/flow/src/lib/dates.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content += addDaysYmdFn;
  fs.writeFileSync(file, content, 'utf8');
});
