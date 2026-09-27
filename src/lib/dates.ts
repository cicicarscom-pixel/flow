/** İşletmenin saat diliminde bugünün tarihi: "2026-09-27" */
export function todayInTimezone(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** "YYYY-MM-DD" metninden, saat dilimi kaymasına dayanıklı yerel Date (gün ortası) */
export function dateFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** "YYYY-MM-DD" + n gün → "YYYY-MM-DD" (saat dilimi ve tarayıcıdan bağımsız) */
export function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
