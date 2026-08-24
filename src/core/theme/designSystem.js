/**
 * designSystem.js
 * -----------------------------------------------------------------------
 * Workigom Flow — MARKA KİMLİĞİ (v2, sıfırdan tasarım)
 *
 * Neden bu palet?
 * Workigom Flow, teknolojiyle arası az olabilecek bir esnafın/KOBİ sahibinin
 * yanında duran bir "dijital çırak" gibi davranıyor: WhatsApp'a cevap
 * veriyor, sosyal medyayı yönetiyor, geliri/gideri takip ediyor, randevu
 * alıyor. Bu ürün soğuk bir "fintech/kripto" hissi değil, SICAK, GÜVEN
 * VEREN ve SEVİMLİ ama yine de PREMİUM bir dijital asistan hissi vermeli.
 *
 * Bu yüzden eski soğuk neon cyan/mor (#00f0ff / #bc13fe) yerine:
 *   - Mercan (Coral)  → Asistanın/AI'ın kendi rengi (samimi, insancıl)
 *   - Zümrüt (Emerald)→ Para/Muhasebe modülü (güven, büyüme, "kazanç")
 *   - Orkide (Berry)  → Sosyal Medya modülü (enerjik ama yumuşak)
 * kullanılıyor; koyu tema korunuyor ama soğuk mavi-siyah yerine sıcak,
 * nötr bir antrasit zemine geçiliyor — hem premium hem "ev sıcaklığı".
 *
 * NOT: Bu dosya SADECE görsel token'lar içerir. Hiçbir ekran/bileşenin
 * fonksiyonu, prop'u veya davranışı bu dosyadan etkilenmez.
 * -----------------------------------------------------------------------
 */

export const Colors = {
  // --- Zemin (Surface) Katmanları — sıcak, nötr antrasit -----------------
  bgBase: '#17151A',          // Ana uygulama arkaplanı
  surface: '#201D24',         // Kart / panel arkaplanı
  surfaceElevated: '#2A2631', // Yükseltilmiş kart, modal, input arkaplanı
  surfaceHighlight: '#34303C',// Hover/basılı/aktif durum arkaplanı

  // --- Kenarlık / Ayraç ---------------------------------------------------
  border: 'rgba(255,247,240,0.08)',
  borderStrong: 'rgba(255,247,240,0.14)',

  // --- Marka Vurgu Renkleri (sıcak, amaca göre anlamlandırılmış) --------
  // Mercan — Asistanın/AI'ın kendi rengi. Genel CTA, "Kaydet/Gönder" gibi
  // birincil aksiyonlar da bu rengi kullanır (asistan sizin için yapıyor hissi).
  accentCoral: '#FF7A59',
  accentCoralSoft: 'rgba(255,122,89,0.14)',
  // Zümrüt — Muhasebe/Finans modülü ve genel "başarı/kazanç" anlamı.
  accentEmerald: '#22B573',
  accentEmeraldSoft: 'rgba(34,181,115,0.14)',
  // Orkide — Sosyal Medya modülü.
  accentBerry: '#C2478D',
  accentBerrySoft: 'rgba(194,71,141,0.14)',

  // --- Metin ---------------------------------------------------------------
  textPrimary: '#F6F1EC',   // sıcak kırık-beyaz (soğuk gri-beyaz değil)
  textSecondary: '#A79E96', // sıcak gri
  textMuted: '#756D66',
  textOnAccent: '#17151A',

  // --- Semantik Durum Renkleri (evrensel tanınırlık için standart kalır) --
  success: '#22B573',       // muhasebe ile aynı yeşil — "kazanç = başarı"
  successSoft: 'rgba(34,181,115,0.14)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.14)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.14)',

  white: '#FFFFFF',
  black: '#000000',
};

// Modül bazlı vurgu rengi eşlemesi (GlobalAppBar ve modül kartlarında kullanılır)
export const ModuleAccent = {
  finans: Colors.accentEmerald, // Para = yeşil (sezgisel)
  sosyal: Colors.accentBerry,   // Sosyal medya = orkide
  ai: Colors.accentCoral,       // Asistanın kendi rengi = mercan
  genel: 'transparent',
};

export const Radius = {
  sm: 8,    // chip, badge, küçük ikon buton
  md: 12,   // standart buton, input
  lg: 16,   // kart
  xl: 20,   // büyük panel / bottom sheet üst köşeleri
  pill: 999, // tam yuvarlak (FAB, pill buton)
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Typography = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  subtitle: 18,
  title: 20,
  headline: 24,
};

// Tutarlı, ölçülü gölge ön ayarları (iOS + Android)
export const Shadow = {
  card: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  raised: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  }),
};

// Sık kullanılan, hazır bileşen stil parçaları — mevcut buton/kart
// JSX yapıları DEĞİŞMEDEN, sadece style={[...]} içine eklenerek kullanılabilir.
export const CommonStyles = {
  primaryButton: {
    backgroundColor: Colors.accentCoral,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
};

export default {
  Colors,
  ModuleAccent,
  Radius,
  Spacing,
  Typography,
  Shadow,
  CommonStyles,
};
