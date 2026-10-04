// "1.2.3" biçimli sürümleri karşılaştırır. Geçersiz/eksik sürüm KİLİTLEMEZ (güvenli varsayılan: izin ver).
export function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v ?? '').trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** current, min'den KÜÇÜKSE true (güncelleme gerekli). Biri çözümlenemezse false. */
export function isBelowMin(current, min) {
  const a = parseVersion(current);
  const b = parseVersion(min);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}
