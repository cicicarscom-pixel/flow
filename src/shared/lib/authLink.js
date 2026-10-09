// E-posta doğrulama / kimlik bağlantılarını (deep link) çözer. Saf fonksiyon: ağ ya da oturum işlemi YAPMAZ.
// Supabase doğrulama bağlantısı uygulamaya şöyle döner (örnekler):
//   workigomflow://#access_token=...&refresh_token=...&type=signup        → doğrulandı
//   workigomflow://#error=access_denied&error_code=otp_expired&error_description=...  → bağlantı süresi dolmuş/kullanılmış
// Google OAuth dönüşünde `type=signup` bulunmaz; o akış AuthScreen içinde kendi işlenir ve bu fonksiyon onu "doğrulandı" saymaz.

function readParams(url) {
  const out = {};
  const text = String(url || '');
  const hashIdx = text.indexOf('#');
  const queryIdx = text.indexOf('?');
  const parts = [];
  if (queryIdx >= 0) parts.push(text.slice(queryIdx + 1, hashIdx >= 0 && hashIdx > queryIdx ? hashIdx : undefined));
  if (hashIdx >= 0) parts.push(text.slice(hashIdx + 1));
  for (const part of parts) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
      const val = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' ')) : '';
      if (!(key in out)) out[key] = val;
    }
  }
  return out;
}

/** @returns {{ kind: 'verified' } | { kind: 'error', code: string } | null} */
export function parseAuthLink(url) {
  if (!url) return null;
  let p;
  try { p = readParams(url); } catch (e) { return null; }
  if (p.error || p.error_code) return { kind: 'error', code: p.error_code || p.error || 'unknown' };
  if (p.type === 'signup') return { kind: 'verified' };
  return null;
}
