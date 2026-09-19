// Son kontrol: Eylül 2026 — periyodik olarak resmi dokümantasyondan doğrulanmalı
export const PLATFORM_MEDIA_RULES = {
  reddit: { maxDurationSec: 900, maxSizeMB: 1024 }, // 15 dk, 1GB
  twitter: { maxDurationSec: 140, maxSizeMB: 512 }, // ücretsiz hesap baz alındı
  instagram: { maxDurationSec: 90, maxSizeMB: null }, // konservatif; hesaba göre değişebilir
  tiktok: { maxDurationSec: 600, maxSizeMB: 287.6 }, // uygulama içi çekim baz alındı
  linkedin: { maxDurationSec: 600, maxSizeMB: 5000 }, // mobil baz alındı (600sn=10dk)
  facebook: { maxDurationSec: 14400, maxSizeMB: 10000 }, // 4 saat, pratik limitle kısıtlanmadı
  youtube: { maxDurationSec: 43200, maxSizeMB: 256000 }, // 12 saat, pratik limitle kısıtlanmadı
  bluesky: { maxDurationSec: 60, maxSizeMB: 50 } // Varsayılan video desteği limitleri
};
