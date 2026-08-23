/**
 * designSystem.js
 * -----------------------------------------------------------------------
 * Uygulama genelinde kullanılan MERKEZİ tasarım token'ları.
 *
 * Amaç: Daha önce onlarca ekrana dağılmış, birbirinden habersiz hex renk
 * kodlarını ("#0a0a0b", "#0e0e0f", "#131314", "#1c1b1c" gibi 6 farklı
 * "neredeyse aynı" koyu ton) tek bir kaynaktan yönetilebilir, tutarlı ve
 * daha profesyonel görünen bir palete indirgemek.
 *
 * NOT: Bu dosya SADECE görsel token'lar içerir. Hiçbir ekran/bileşenin
 * fonksiyonu, prop'u veya davranışı bu dosyadan etkilenmez — sadece
 * renk/ölçü referansı sağlar.
 * -----------------------------------------------------------------------
 */

export const Colors = {
  // --- Zemin (Surface) Katmanları -------------------------------------
  // Eskiden #0a0a0b / #070b1f / #0e0e0f / #131314 / #131315 / #1c1b1c /
  // #1c1b1d gibi 7 ayrı tonun yerini alan tutarlı 4 katmanlı sistem.
  bgBase: '#0A0B0F',        // Ana uygulama arkaplanı (en alt katman)
  surface: '#12141B',       // Kart / panel arkaplanı
  surfaceElevated: '#1A1D26', // Yükseltilmiş kart, modal, input arkaplanı
  surfaceHighlight: '#20242F', // Hover/basılı/aktif durum arkaplanı

  // --- Kenarlık / Ayraç --------------------------------------------------
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // --- Marka Vurgu Renkleri (daha az "neon", daha "premium SaaS") -----
  // Eskiden #00f0ff (Finans) → daha dengeli bir camgöbeği
  accentCyan: '#22D3EE',
  accentCyanSoft: 'rgba(34,211,238,0.14)',
  // Eskiden #bc13fe (Sosyal) → daha zarif bir mor
  accentPurple: '#A855F7',
  accentPurpleSoft: 'rgba(168,85,247,0.14)',
  // Eskiden #208AEF / #00a2ff (AI) → tutarlı marka mavisi
  accentBlue: '#3B82F6',
  accentBlueSoft: 'rgba(59,130,246,0.14)',

  // --- Metin ------------------------------------------------------------
  // Eskiden #e5e2e3 / #e5e1e4 / #e1e2e7 / #b9cacb / #bbcabf / #bac9cc /
  // #bccbb9 / #849495 gibi 8 farklı gri-yeşilimsi ton kullanılıyordu.
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnAccent: '#0A0B0F',

  // --- Semantik Durum Renkleri -------------------------------------------
  success: '#22C55E',
  successSoft: 'rgba(34,197,94,0.14)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.14)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.14)',

  white: '#FFFFFF',
  black: '#000000',
};

// Modül bazlı vurgu rengi eşlemesi (GlobalAppBar ve modül kartlarında kullanılır)
export const ModuleAccent = {
  finans: Colors.accentCyan,
  sosyal: Colors.accentPurple,
  ai: Colors.accentBlue,
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
    backgroundColor: Colors.accentBlue,
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
