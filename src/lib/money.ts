/** Kuruş varsa 2 hane, yoksa hiç (",00" gizlenir); asla yuvarlamaz. */
function fractionDigits(n: number): number {
  return Math.round(Math.abs(n) * 100) % 100 !== 0 ? 2 : 0;
}

/** Para birimi işaretiyle: ₺25.000 | ₺4.820,50 */
export function formatMoney(amount: number, locale = 'tr-TR', currency = 'TRY'): string {
  const n = Number(amount) || 0;
  const d = fractionDigits(n);
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}

/** Yalnız sayı (işaret tasarımda ayrı duruyorsa): 25.000 | 4.820,50 */
export function formatAmount(amount: number, locale = 'tr-TR'): string {
  const n = Number(amount) || 0;
  const d = fractionDigits(n);
  return new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}