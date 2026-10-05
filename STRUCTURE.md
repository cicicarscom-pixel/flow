# STRUCTURE — flow (mobil) kök dizin haritası

> Kök dizindeki her klasör ve dosya burada açıklanır. **Yeni bir kök öğe eklemek için önce bu tabloya satır ekle**; CI (`scripts/ci/check-root-map.mjs`) haritada olmayan kök öğeyi reddeder.
> **Ajan sütunu:** **Dokunma** = talimat olmadan değiştirilmez · **Talimatla** = yalnız talimattaki iş · **Serbest** = kurallara (AGENTS.md) uyarak çalışılır.

| Öğe | Ne işe yarar | Uygulama buna bağlı mı | Ajan |
|---|---|---|---|
| `src/` | Uygulama kodu (modüller, ekranlar, `lib/`, `core/`, çeviriler) | **Evet** | Serbest |
| `assets/` | Uygulama görselleri ve simgeleri (`assets/images/`, `assets/images/dashboard/`) | **Evet** — silinirse derleme patlar | Talimatla |
| `App.js` | Uygulamanın giriş noktası | **Evet** | Talimatla |
| `app.json` | Expo yapılandırması (ad, simge, açılış ekranı) | **Evet** | Talimatla |
| `babel.config.js` | Babel derleme ayarı | **Evet** | Dokunma |
| `metro.config.js` | Metro paketleyici ayarı | **Evet** | Dokunma |
| `tailwind.config.js` | NativeWind/Tailwind ayarı | **Evet** | Talimatla |
| `tsconfig.json` | TypeScript ayarı | **Evet** | Dokunma |
| `package.json` | Bağımlılıklar ve betikler | **Evet** | Talimatla |
| `package-lock.json` | Bağımlılık kilidi (npm) | **Evet** | Dokunma |
| `.npmrc` | npm ayarı | **Evet** | Dokunma |
| `.env.example` | Ortam değişkenleri örneği (gerçek değer içermez) | Hayır | Talimatla |
| `supabase/` | Yalnız `flow-cleanup-post-media` fonksiyonu + bir migration. Asıl backend `ledger`'da | Hayır (sunucu tarafı) | Dokunma |
| `waha-deploy/` | WhatsApp (WAHA) sunucu yönetim betikleri; parolalar ortam değişkeninden | Hayır | Talimatla |
| `scripts/` | CI kontrolleri (`scripts/ci/`) | Hayır (CI) | Dokunma |
| `.github/` | GitHub Actions CI (`workflows/ci.yml`) | Hayır (CI) | Dokunma |
| `docs/` | Belgeler; `docs/archive/` yalnız tarihsel | Hayır | Serbest |
| `archive/` | Eski SQL dosyaları (`archive/sql/`); migration zinciri DEĞİL | Hayır | Dokunma |
| `AGENTS.md` | **Tek geçerli ajan kuralları** | Hayır | Talimatla |
| `CLAUDE.md` | `AGENTS.md`'ye yönlendirir | Hayır | Dokunma |
| `STRUCTURE.md` | Bu harita | Hayır (CI) | Talimatla |
| `README.md` | Proje belgesi + "Son Güncellemeler" | Hayır | Serbest |
| `README_SCREENS.md` | Ekran listesi belgesi | Hayır | Serbest |
| `eas.json` | EAS Build/Submit profilleri (preview=APK, production=AAB) | Hayır | Talimatla |
| `LICENSE` | Lisans | Hayır | Dokunma |
| `.agents/` | UI karar günlüğü (`.agents/AGENTS.md`) ve Gemini beceri belgeleri. Kural kaynağı DEĞİL; çelişirse `AGENTS.md` geçerli | Hayır | Talimatla |
| `.claude/` | Claude Code yerel ayarları | Hayır | Dokunma |
| `.vscode/` | VS Code ayarları | Hayır | Dokunma |
| `skills-lock.json` | Ajan becerileri kilidi | Hayır | Dokunma |
| `.dependency-cruiser.js` | Modül bağımlılık kuralları aracı | Hayır | Talimatla |
| `eslint.config.js` | ESLint ayarı | Hayır | Talimatla |
| `.editorconfig` | Editör ayarı (UTF-8, BOM'suz) | Hayır | Dokunma |
| `.gitignore` | Git dışı dosyalar (geçici dosya kalıpları dahil) | Hayır | Talimatla |
