# 🚀 AI Esnaf - Dijital Asistan SaaS Mobil Uygulaması

AI Esnaf, yerel işletmelerin (esnaf, KOBİ) sosyal medya yönetimini, müşteri iletişimini ve ön muhasebe süreçlerini tek bir merkezden, yapay zeka gücüyle otonom hale getiren tam yerel (native) bir mobil uygulamadır.

Bu doküman, projeyi **Sıfırdan Canlıya Almak** için gereken tüm teknik adımları ve altyapı detaylarını içerir.

---

## 🧠 Geliştirme Hafızası ve Karar Günlüğü (Haziran 2026)

Projenin geliştirme sürecinde alınan kritik mimari kararlar ve çözülen sorunlar:

1. **Zernio Webhook ve Push Mimarisi:** Gelen kutusunda polling (sürekli istek atma) yerine `zernio-webhook` üzerinden anında bildirim (Push) mimarisine geçildi. Mesajlar doğrudan Supabase `messages` ve `conversations` tablolarına yazılır.
2. **Yerel Silme (Local Deletion) ve Çoklu Seçim:** API kısıtlamaları nedeniyle mesaj silme işlemleri yerel veritabanında sınırlandırıldı. Gelen Kutusu ekranına uzun basarak açılan **Çoklu Seçim (Multi-Select)** modu eklendi. (UUID `22P02` format hatası `.in` operatörü ile çözüldü).
3. **Otomatik Profil Tetikleyicisi:** `auth.users` tablosuna kayıt olan yeni kullanıcıları otomatik olarak `public.profiles` tablosuna kopyalayan `on_auth_user_created` SQL tetikleyicisi (Database Trigger) oluşturularak Foreign Key (Yabancı Anahtar) hataları önlendi. Eski profiller için geriye dönük eşleme (Backfill) yapıldı.
4. **Edge Functions Güvenliği:** `zernio-client` içindeki işlemler RLS kısıtlamalarına takılmaması için `service_role` key ile donatıldı.
5. **Expo Router'dan React Navigation'a Geçiş:** Proje, Expo SDK 56 uyumluluk sorunları nedeniyle `expo-router` eklentisinden tamamen arındırıldı. `App.js` merkezli `react-navigation` yapısına geçildi ve web çıktısı `single` (SPA) moduna uyarlandı.
6. **Ikonların Yüklenmesi (`@expo/vector-icons`):** `expo-router` silindiğinde kaybolan ikon paket bağımlılığı `@expo/vector-icons` doğrudan ve SDK 56 uyumlu sürümüyle projeye dahil edildi.
7. **Sekme Yönlendirme Uyarısının Çözülmesi:** Sekme geçişlerindeki `Passing an object as the argument to 'navigate' is deprecated` uyarısı, `@react-navigation/*` paketleri (başta `bottom-tabs@7.18.2` olmak üzere) güncellenerek çözüldü.
8. **Dinamik WhatsApp Prompt Yönetimi:** Bot Yönetimi ekranı (`BotYonetimiScreen.js`) sadeleştirilerek sadece WhatsApp Müşteri Asistanı promptunun düzenleneceği hale getirildi ve veritabanındaki `profiles.system_prompt` alanına bağlandı.
9. **WhatsApp Webhook Entegrasyonu (`whatsapp-webhook`):** WhatsApp webhook edge fonksiyonu, gelen mesajları yanıtlarken kullanıcının veritabanındaki dinamik `system_prompt` yönergesini kullanacak şekilde güncellendi.
10. **TypeScript Derleme Ayarları:** `tsconfig.json` dosyasına `"exclude"` eklenerek Deno tabanlı `supabase` Edge Functions dosyalarının Expo derleyicisini engellemesi önlendi.
11. **Dinamik Safe Area & Klavye Uyumlu Mesajlaşma Arayüzü:** Eski manuel `KeyboardBottomSpacer` silinerek tamamen standart `react-native-safe-area-context` yapısına geçildi. `ChatInputBar` klavyeyi ve Home Indicator safe area insets değerlerini dinamik dinleyerek klavye açıkken `0`, kapalıyken `insets.bottom` boşluğu bırakacak şekilde yapılandırıldı. Sohbet ekranlarında (`AiChat`, `AiAssistant`, `ChatScreen`, `DigitalAssistant`) `SafeAreaView` `edges={['top', 'left', 'right']}` olarak kısıtlanarak alt boşluk yönetimi tamamen `ChatInputBar`'a bırakıldı.
12. **Detay Ekranlarında Alt Navigasyon (TabBar) Gizlenmesi:** Tüm detay ekranları (`OdemeTakvimi`, `AiChat`, `AiAssistant`, `DigitalAssistant`, `AiUretim`, `Inbox`, `Analytics`, `Gönderiler`, `ChatScreen`, `PostCommentsScreen`) `TabNavigator.js` içindeki sekme yığıtlarından çıkarılarak root düzeydeki `AppNavigator.js` Stack'ine taşındı. Böylece detay ekranlarına geçildiğinde alt TabBar otomatik olarak gizlenmektedir.
13. **ESLint Hata Temizliği ve Kod Kalitesi:** Projedeki tüm ESLint hataları (Animated ref render erişimleri, conditional hooks, useEffect cascading state güncellemeleri, displayName eksikliği ve block-scoping declaration hoisting) giderilerek linter taraması 0 hata seviyesine çekildi.
14. **GitHub Senkronizasyonu & Randevu Modülü i18n & ESLint Hata Çözümü:** GitHub remote üzerindeki son güncellemeler çekilip local workspace güncellendi. Randevu modülü presentation katmanındaki ekranlar (`RandevuScreen.js`, `HizmetAyarlariScreen.js`) tamamen Türkçe, İngilizce ve Almanca olarak yerelleştirildi (i18n). ESLint'in `i18next/no-literal-string` kuralları ve Animated ref render erişim hataları (ref access during render) giderildi. TypeScript path alias'ları (`@domain`, `@application`, `@infrastructure`, `@presentation`) `tsconfig.json` üzerinde `randevu` modülünü de kapsayacak şekilde güncellendi ve tüm relative import'lar bu alias'lara taşınarak mimari sınır güvenlik kuralları (Anti-Bypass) sağlandı. Linter hataları 0'a indirildi.

---

## 🎨 Tasarım Dili ve Kullanıcı Deneyimi (UX/UI)

### 1. Merkezi Başlık Mimarisi (GlobalAppBar)
Uygulamadaki tüm eski, dağınık header yapıları silinerek merkezi **GlobalAppBar** standardına geçilmiştir.
- **Anatomi:**
  - Yükseklik: Sabit 64px (+ Notch/StatusBar safe area).
  - Arka Plan: Net `#070B1F`.
  - Alt Çizgi: `1px solid rgba(255, 255, 255, 0.05)`.
  - Accent (Vurgu) Çizgisi: `module` prop'una göre 2px şık çizgi (Finans: `#00f0ff`, Sosyal: `#bc13fe`, AI/Genel: `#208AEF`).
- **Seviye (Level) Mantığı:**
  - **Level 1 (Ana Sayfa):** Sol: Hamburger Menü, Orta: Başlık, Sağ: Bildirim/Profil.
  - **Level 2 (Tab/Modül Ekranları):** Sol: Geri Tuşu, Orta: İkon + Modül Başlığı, Sağ: Dinamik Aksiyonlar.
  - **Level 3 (Detay Ekranları):** Sol: Geri Tuşu, Orta: Sade Başlık, Sağ: İşlem İkonları (Üç nokta, vs).
- **Dinamik Yönetim:** `showProfile` (boolean) ve `actions={[{ icon: 'bell', onPress: () => {} }]}` prop'ları ile her ekran için sağ aksiyonlar dinamik kontrol edilir.

### 2. Genel Tasarım Prensipleri
- **Deep Dark Mode:** Göz yormayan, premium hissiyatlı koyu tema (`#0A0A0B`).
- **Glassmorphism:** Arayüze derinlik katan, arkası flu, buzlu cam efektli kartlar ve balonlar.
- **Neon Vurgular:** Önemli aksiyonlarda ve aktif durumlarda beliren Cyan (`#00f0ff`) ve Mor (`#bc13fe`) glow efektleri.
- **Floating Pill (Yüzen Kapsül):** Mesajlaşma girdi kutuları alt navigasyon menüsüyle hizalı, havada süzülen kapsül yapıdadır.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend**: React Native, Expo, NativeWind v4, React Navigation.
- **Yapay Zeka (AI)**: Google Gemini 1.5 Flash (Metin üretimi) & Gemini 3.1 Flash Image (Görsel).
- **Sosyal Medya Otomasyonu & Gelen Kutusu**: Zernio API (Webhook + REST).
- **Veritabanı & Auth**: Supabase PostgreSQL (Row Level Security aktif).
- **Backend**: Supabase Edge Functions (Deno tabanlı).

---

## 🏗️ 1. Adım: Supabase Veritabanı Kurulumu (Backend Sıfırdan İnşası)

Projenin kalbi Supabase PostgreSQL veritabanıdır. Yapay zekanın otonom çalışabilmesi ve uygulamanın anlık güncellenmesi (Realtime) için veritabanı şemasının doğru kurulması şarttır.

1. [Supabase](https://supabase.com/) üzerinde yeni bir proje oluşturun.
2. Proje oluşturulduktan sonra sol menüden **SQL Editor** kısmına gidin.
3. Yeni bir Query oluşturun ve projenin kök dizinindeki `supabase/schema.sql` dosyasının tüm içeriğini yapıştırıp çalıştırın (RUN).

**Şema neler içerir?**
- **Tablolar**:
  - `profiles`: Kullanıcı profillerini barındırır. WhatsApp asistanı entegrasyonu için `phone_number` sütununu ve dinamik asistan talimatı için `system_prompt` sütununu içerir.
  - `social_accounts`: Kullanıcının Zernio API'den anlık çekilen bağlı sosyal hesapları.
  - `posts`: Sosyal medya gönderi taslakları ve durumları.
  - `conversations` & `messages`: Canlı gelen kutusu için sohbet ve mesaj kayıtları.
  - `comments` & `reviews`: Gelen kutusundaki yorum ve Google değerlendirme kayıtları.
  - `transactions`: Yapay zeka ile taranıp işlenen gelir/gider / fiş kayıtları.
  - `user_api_settings`: Esnafların kendi Google Gemini API anahtarlarını saklayan tablo (BYOK modeli).
  - `api_usage_logs`: Yapay zeka maliyet ve token kullanım raporlama günlüğü.
- **Güvenlik Kuralları (Row Level Security - RLS)**: Tüm tablolar RLS ile korunur. Kullanıcılar yalnızca kendi işletmelerine ait verilere erişebilir.
- **Otomatik Profil Tetikleyicisi (`on_auth_user_created`)**: `auth.users` tablosuna kayıt olan yeni kullanıcıları otomatik olarak `public.profiles` tablosuna kopyalayan SQL tetikleyicisi (Database Trigger) schema dosyasında yer alır ve Foreign Key hatalarını önler.
- **Güncelleme Tetikleyicileri (Triggers)**: `updated_at` alanlarının otomatik güncellenmesini ve sohbetlerin okunmamış mesaj sayacının yönetilmesini sağlar.

### Canlı Akış (Realtime) Aktivasyonu (Kritik!)
Gelen kutusuna düşen mesajların frontend'de sayfa yenilenmeden belirmesi için Realtime yayınının açılması gerekir. `schema.sql` çalıştırdığınızda şu komut otomatik çalışır:
```sql
alter publication supabase_realtime add table conversations, messages, comments, reviews, posts;
```
*(Eğer bir sebeple hata alırsanız, bu komutu manuel çalıştırıp tabloları yayına almayı unutmayın.)*

### Aylık WhatsApp Kullanım Kotası Sıfırlama (pg_cron)
Yapay zeka asistanının aylık 1.000 mesajlık adil kullanım kotasını (`whatsapp_monthly_quota`) her ayın 1'inde sıfırlamak için Supabase SQL editöründe `pg_cron` eklentisini aktifleştirip şu görevi tanımlayabilirsiniz:
```sql
-- 1. pg_cron eklentisini etkinleştirin
create extension if not exists pg_cron;

-- 2. Her ayın 1'inde saat 00:00'da tüm kullanıcıların sayacını 0'a eşitleyen görevi planlayın
select cron.schedule(
  'reset-whatsapp-message-count',
  '0 0 1 * *',
  $$ update public.profiles set whatsapp_message_count = 0 $$
);
```

---

## ☁️ 2. Adım: Supabase Edge Functions (Backend API) Dağıtımı

Frontend uygulaması güvenlik gereği Zernio veya Gemini gibi API'lere doğrudan bağlanmaz. Aracı olarak Supabase Edge (Deno) fonksiyonları kullanılır.

Bilgisayarınızda Supabase CLI'ın yüklü ve login olmuş ( `npx supabase login` ) olduğundan emin olun.
Daha sonra projenizi Supabase'e bağlayıp fonksiyonları deploy etmelisiniz:

```bash
# Projeyi mevcut Supabase projenizle ilişkilendirin (Reference ID'yi Supabase panelinden alın)
npx supabase link --project-ref <YOUR_PROJECT_REFERENCE_ID>

# Dışarıdan tetiklenecek webhook fonksiyonlarını JWT doğrulaması olmadan dağıtın (Meta, Google ve Zernio'nun erişebilmesi için --no-verify-jwt zorunludur):
npx supabase functions deploy zernio-webhook --no-verify-jwt
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
npx supabase functions deploy drive-webhook --no-verify-jwt

# Uygulama içinden tetiklenecek diğer fonksiyonları normal şekilde dağıtın:
npx supabase functions deploy zernio-client
npx supabase functions deploy gemini-chat
npx supabase functions deploy imagen-edit
npx supabase functions deploy meta-auth-callback
```

### Edge Functions Görev Dağılımı
1. **`zernio-webhook`**: Zernio platformundan gelen Instagram DM'leri, yorumları ve Google yorumlarını dinler, veritabanına kaydeder.
2. **`zernio-client`**: Mobil uygulamadan gelen gönderi paylaşımı ve sosyal hesap OAuth entegrasyonu isteklerini yönetir.
3. **`gemini-chat`**: Gemini 2.5 Flash entegrasyonu ile metin üretimi, Imagen 4 entegrasyonu ile görsel üretimi ve Gemini 3.1 Flash Image ile görsel analiz/düzenleme işlemlerini yürütür. Kullanıcı BYOK API anahtarını kullanır ve `api_usage_logs` tablosuna maliyet kaydeder.
4. **`imagen-edit`**: Gemini 3.1 Flash Image modelini kullanarak yüklenen görselleri art direktör seviyesinde yeniden yapılandırır ve tasarlar.
5. **`whatsapp-webhook`**: Meta WhatsApp Cloud API entegrasyonunu sağlar. Kullanıcıların WhatsApp'tan attığı mesajları yakalar, kullanıcının veritabanındaki dinamik `system_prompt` talimatına göre Gemini ile cevap üretir ve Meta API'si üzerinden geri yanıtlar.
6. **`drive-webhook`**: Google Drive Push Notifications (Anlık Bildirimler) webhook'unu dinler. Yeni eklenen veya güncellenen dosyaları tespit edip indirme, Gemini ile multimodal içerik/görsel analizi, embedding (vektör) üretimi ve pgvector tablosuna (`company_documents`) yazma adımlarını tetikler.
7. **`meta-auth-callback`**: Mobil uygulamadaki Meta OAuth akışından dönen yetkilendirme kodunu (`authCode`) alır, Meta API üzerinden kalıcı erişim jetonuna (`access_token`) dönüştürür. Ardından kullanıcının WhatsApp Business Account ID (WABA) ve Telefon Numarası ID'sini çekip veritabanındaki `profiles` tablosuna kaydeder.

### Çevresel Değişkenler (Secrets / Environment Variables)
Edge fonksiyonlarının çalışması için Supabase panelinizde `Edge Functions -> Secrets` menüsünden veya CLI üzerinden (`npx supabase secrets set KEY=VALUE`) şu anahtarları eklemeniz gerekir:
- `SUPABASE_URL` : Projenizin Supabase API URL'si.
- `SUPABASE_ANON_KEY` : İstemci seviyesinde doğrulama yapabilmek için Supabase anonim anahtarı.
- `SUPABASE_SERVICE_ROLE_KEY` : Edge fonksiyonlarının (özellikle webhook'lar ve OAuth callback) RLS güvenlik kurallarını aşarak veritabanına doğrudan yazabilmesi için gerekli servis rolü anahtarı.
- `ZERNIO_API_KEY` : Zernio geliştirici panelinizden edindiğiniz API anahtarı.
- `GEMINI_API_KEY` : Görsel düzenleme (`imagen-edit`) mikroservisinde ve sistemin genelinde varsayılan / fallback olarak kullanılacak Google AI Studio API anahtarı.
- `WHATSAPP_TOKEN` : Meta Developer panelinden aldığınız WhatsApp Cloud API erişim jetonu (Permanent Access Token).
- `WHATSAPP_PHONE_NUMBER_ID` : Meta Developer panelinde size atanan WhatsApp Telefon Numarası Kimliği.
- `WHATSAPP_VERIFY_TOKEN` : Meta Webhook kurulumunda doğrulama için belirleyeceğiniz özel şifre (varsayılan: `aiesnaf_verify`).
- `META_APP_ID` : Meta Geliştirici panelindeki uygulamanızın kimlik numarası (Facebook App ID).
- `META_APP_SECRET` : Meta Geliştirici panelindeki uygulamanızın gizli anahtarı (Facebook App Secret).

---

## 🌐 3. Adım: Webhook Entegrasyonu (Zernio)

Yapay zekanın müşterilerle 7/24 konuşabilmesi için Zernio'dan gelen Instagram DM'leri ve yorumlarının bizim veritabanımıza anında düşmesi gerekir.

1. Zernio Geliştirici Panelinize giriş yapın.
2. Webhooks (Abonelikler) sekmesine gidin.
3. **Endpoint URL** olarak az önce deploy ettiğiniz `zernio-webhook` fonksiyonunun URL'sini girin. (Örn: `https://<YOUR_PROJECT_ID>.supabase.co/functions/v1/zernio-webhook`)
4. Abone olunacak (Subscribe) olaylar:
   - `message.received`
   - `comment.created`
   - `review.created`

Bu sayede Zernio, Instagram'dan bir DM aldığında bunu sizin Edge fonksiyonunuza postalar, fonksiyon veritabanına (`messages`) kaydeder ve veritabanı da Supabase Realtime üzerinden anında mobil uygulamadaki cam baloncuklara bu mesajı düşürür.

---

## 📱 4. Adım: Frontend (Mobil Uygulama) Kurulumu

Projenin React Native (Expo) kısmını kendi bilgisayarınızda derleyip çalıştırmak için:

1. Gerekli kütüphaneleri yükleyin:
```bash
npm install
```

2. Ana dizinde `.env` isimli bir dosya oluşturun ve `.env.example` içeriğine uygun olarak gerekli tüm değişkenleri ekleyin:
```env
# Supabase Konfigürasyonu
EXPO_PUBLIC_SUPABASE_PROJECT_ID=your_supabase_project_id_here
EXPO_PUBLIC_SUPABASE_URL=https://your_supabase_project_id_here.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Yapay Zeka ve Dış API Jetonları (Mobil Fallback/Geliştirme için)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_ZERNIO_API_TOKEN=your_zernio_api_token_here
```

3. Geliştirme sunucusunu (Expo) başlatın:
```bash
# Önbelleği temizleyerek başlatır (Çakışmaları önlemek için önerilir)
npx expo start -c
```

Uygulamanız başlatıldığında iOS/Android simülatöründe veya Expo Go uygulamanızda çalışmaya hazırdır.

---

## 📐 Mimari ve Klasör Yapısı (Domain-Driven Design)

Proje, genişletilebilirlik ve bakım kolaylığı sağlamak amacıyla katı **Domain-Driven Design (DDD)** ve **Çok Dilli (i18n)** mimarisiyle yapılandırılmıştır.

- `src/core/` : Uygulamanın başlatılma omurgası.
  - `navigation/` : `AppNavigator.js` ve `TabNavigator.js`.
  - `i18n/` : `i18next` ve `expo-localization` kurulumu, dil dosyaları (`tr.json`, `en.json`).
  - `theme/` : Global renk (Deep Dark, Neon) tanımları.
- `src/shared/` : Modül bağımsız, global araçlar ve UI bileşenleri.
  - `ui/` : `GlobalAppBar`, `ChatInputBar`, `CustomButton`, `CustomInput` gibi paylaşılan bileşenler.
  - `utils/` : `formatters.js` (Dinamik para birimi ve tarih formatlama).
  - `lib/` : Merkezi `supabase.js` istemcisi.
- `src/modules/` : İzole iş mantığı alanları (Modüller kendi kök dizinlerinden - Barrel Pattern ile dışa aktarım yapar).
  - `muhasebe/` : `AiMuhasebeScreen` ve `OdemeTakvimiScreen` gibi muhasebe özellikleri.
  - `sosyal_medya/` : `SosyalMedyaScreen`, `InboxScreen`, `AnalyticsScreen`, `ChatScreen`, `BotYonetimiScreen` ekranları ve `wahaService` API yöneticisi.
- `supabase/functions/` : Supabase Edge Functions klasörü.
  - `deno.json` : Ortak Deno bağımlılık yöneticisi (`@zernio/node` SDK'sı burada tanımlıdır).
  - `zernio-webhook/` ve `zernio-client/` : Mikroservis kodları.
- `supabase/schema.sql` : Tüm PostgreSQL veritabanı yapısı.

> **Mimari Kural:** Modüller arası çapraz import (deep-import) kesinlikle yasaktır. İletişim sadece `core/` ve `shared/` katmanları üzerinden, modüllerin kendi `index.ts` dosyaları (Barrel Pattern) vasıtasıyla yapılır.

---

## 🔗 5. Adım: Sosyal Medya Bağlantı Mimarisi (Zernio OAuth)

Kullanıcıların sosyal medya (Facebook, Instagram vb.) hesaplarını AI Esnaf uygulamasına bağlarken izlediğimiz güvenli ve modern mimari şu şekildedir:

1. **Bağlantı Başlatma:** Uygulama içerisinden "Hesabınızı Ekleyin" ikonlarına tıklandığında, `zernio-client` Edge fonksiyonuna istek atılır ve Zernio'nun OAuth yetkilendirme linki (`authUrl`) alınarak telefonun tarayıcısında açılır.
2. **Doğrudan API Çekimi (DB Bypass):** Test ortamlarındaki geri yönlendirme (Redirect URI) kısıtlamaları ve Supabase RLS (Row Level Security) kurallarının yaratabileceği UUID/yabancı anahtar çakışmalarını tamamen sıfıra indirmek adına, **aradaki Supabase veritabanı kayıt katmanı tamamen devreden çıkarılmıştır.**
3. **Akıllı Senkronizasyon (Focus Radar):** Kullanıcı hesabını yetkilendirip uygulamaya geri döndüğünde, `SosyalMedyaScreen` ekranındaki `useFocusEffect` radarı otomatik olarak tetiklenir (Ayrıca ekranda manuel bir "Senkronize Et" butonu da bulunur).
4. **Canlı Fetch:** Uygulama, veritabanına bakmak yerine doğrudan Edge Function üzerinden Zernio API'ye (`zernio.accounts.listAccounts`) giderek anlık olarak kullanıcının bağlı hesaplarını çeker ve saniyesinde UI üzerinde (ikolarla birlikte) çizer. Bu mimari sayesinde veri kaybı yaşanmaz ve senkronizasyon garantilenir.

---

## 🆕 Son Güncellemeler (Haziran 2026 - UX/UI & Bug Fixes)

1. **Yüzen Kapsül Mesaj Kutusu (Floating Pill Input):** Uygulamanın tüm mesajlaşma alanlarındaki (AI Muhasebe, Chat, Asistan) mesaj kutuları baştan tasarlandı. Ekranın bir ucundan diğer ucuna uzanan eski düz dikdörtgen yapı yerine, alt navigasyon menüsüyle (TabNavigator) %100 uyumlu **yüzen kapsül** (Floating Pill) tasarımına geçildi.
### 2. Genel Tasarım Prensipleri
- **Deep Dark Mode:** Göz yormayan, premium hissiyatlı koyu tema (`#0A0A0B`).
- **Glassmorphism:** Arayüze derinlik katan, arkası flu, buzlu cam efektli kartlar ve balonlar.
- **Neon Vurgular:** Önemli aksiyonlarda ve aktif durumlarda beliren Cyan (`#00f0ff`) ve Mor (`#bc13fe`) glow efektleri.
- **Floating Pill (Yüzen Kapsül):** Mesajlaşma girdi kutuları alt navigasyon menüsüyle hizalı, havada süzülen kapsül yapıdadır.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend**: React Native, Expo, NativeWind v4, React Navigation.
- **Yapay Zeka (AI)**: Google Gemini 1.5 Flash (Metin üretimi) & Gemini 3.1 Flash Image (Görsel).
- **Sosyal Medya Otomasyonu & Gelen Kutusu**: Zernio API (Webhook + REST).
- **Veritabanı & Auth**: Supabase PostgreSQL (Row Level Security aktif).
- **Backend**: Supabase Edge Functions (Deno tabanlı).

---

## 🏗️ 1. Adım: Supabase Veritabanı Kurulumu (Backend Sıfırdan İnşası)

Projenin kalbi Supabase PostgreSQL veritabanıdır. Yapay zekanın otonom çalışabilmesi ve uygulamanın anlık güncellenmesi (Realtime) için veritabanı şemasının doğru kurulması şarttır.

1. [Supabase](https://supabase.com/) üzerinde yeni bir proje oluşturun.
2. Proje oluşturulduktan sonra sol menüden **SQL Editor** kısmına gidin.
3. Yeni bir Query oluşturun ve projenin kök dizinindeki `supabase/schema.sql` dosyasının tüm içeriğini yapıştırıp çalıştırın (RUN).

**Şema neler içerir?**
- **Tablolar**:
  - `profiles`: Kullanıcı profillerini barındırır. WhatsApp asistanı entegrasyonu için `phone_number` sütununu ve dinamik asistan talimatı için `system_prompt` sütununu içerir.
  - `social_accounts`: Kullanıcının Zernio API'den anlık çekilen bağlı sosyal hesapları.
  - `posts`: Sosyal medya gönderi taslakları ve durumları.
  - `conversations` & `messages`: Canlı gelen kutusu için sohbet ve mesaj kayıtları.
  - `comments` & `reviews`: Gelen kutusundaki yorum ve Google değerlendirme kayıtları.
  - `transactions`: Yapay zeka ile taranıp işlenen gelir/gider / fiş kayıtları.
  - `user_api_settings`: Esnafların kendi Google Gemini API anahtarlarını saklayan tablo (BYOK modeli).
  - `api_usage_logs`: Yapay zeka maliyet ve token kullanım raporlama günlüğü.
- **Güvenlik Kuralları (Row Level Security - RLS)**: Tüm tablolar RLS ile korunur. Kullanıcılar yalnızca kendi işletmelerine ait verilere erişebilir.
- **Otomatik Profil Tetikleyicisi (`on_auth_user_created`)**: `auth.users` tablosuna kayıt olan yeni kullanıcıları otomatik olarak `public.profiles` tablosuna kopyalayan SQL tetikleyicisi (Database Trigger) schema dosyasında yer alır ve Foreign Key hatalarını önler.
- **Güncelleme Tetikleyicileri (Triggers)**: `updated_at` alanlarının otomatik güncellenmesini ve sohbetlerin okunmamış mesaj sayacının yönetilmesini sağlar.

### Canlı Akış (Realtime) Aktivasyonu (Kritik!)
Gelen kutusuna düşen mesajların frontend'de sayfa yenilenmeden belirmesi için Realtime yayınının açılması gerekir. `schema.sql` çalıştırdığınızda şu komut otomatik çalışır:
```sql
alter publication supabase_realtime add table conversations, messages, comments, reviews, posts;
```
*(Eğer bir sebeple hata alırsanız, bu komutu manuel çalıştırıp tabloları yayına almayı unutmayın.)*

### Aylık WhatsApp Kullanım Kotası Sıfırlama (pg_cron)
Yapay zeka asistanının aylık 1.000 mesajlık adil kullanım kotasını (`whatsapp_monthly_quota`) her ayın 1'inde sıfırlamak için Supabase SQL editöründe `pg_cron` eklentisini aktifleştirip şu görevi tanımlayabilirsiniz:
```sql
-- 1. pg_cron eklentisini etkinleştirin
create extension if not exists pg_cron;

-- 2. Her ayın 1'inde saat 00:00'da tüm kullanıcıların sayacını 0'a eşitleyen görevi planlayın
select cron.schedule(
  'reset-whatsapp-message-count',
  '0 0 1 * *',
  $$ update public.profiles set whatsapp_message_count = 0 $$
);
```

---

## ☁️ 2. Adım: Supabase Edge Functions (Backend API) Dağıtımı

Frontend uygulaması güvenlik gereği Zernio veya Gemini gibi API'lere doğrudan bağlanmaz. Aracı olarak Supabase Edge (Deno) fonksiyonları kullanılır.

Bilgisayarınızda Supabase CLI'ın yüklü ve login olmuş ( `npx supabase login` ) olduğundan emin olun.
Daha sonra projenizi Supabase'e bağlayıp fonksiyonları deploy etmelisiniz:

```bash
# Projeyi mevcut Supabase projenizle ilişkilendirin (Reference ID'yi Supabase panelinden alın)
npx supabase link --project-ref <YOUR_PROJECT_REFERENCE_ID>

# Dışarıdan tetiklenecek webhook fonksiyonlarını JWT doğrulaması olmadan dağıtın (Meta, Google ve Zernio'nun erişebilmesi için --no-verify-jwt zorunludur):
npx supabase functions deploy zernio-webhook --no-verify-jwt
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
npx supabase functions deploy drive-webhook --no-verify-jwt

# Uygulama içinden tetiklenecek diğer fonksiyonları normal şekilde dağıtın:
npx supabase functions deploy zernio-client
npx supabase functions deploy gemini-chat
npx supabase functions deploy imagen-edit
npx supabase functions deploy meta-auth-callback
```

### Edge Functions Görev Dağılımı
1. **`zernio-webhook`**: Zernio platformundan gelen Instagram DM'leri, yorumları ve Google yorumlarını dinler, veritabanına kaydeder.
2. **`zernio-client`**: Mobil uygulamadan gelen gönderi paylaşımı ve sosyal hesap OAuth entegrasyonu isteklerini yönetir.
3. **`gemini-chat`**: Gemini 2.5 Flash entegrasyonu ile metin üretimi, Imagen 4 entegrasyonu ile görsel üretimi ve Gemini 3.1 Flash Image ile görsel analiz/düzenleme işlemlerini yürütür. Kullanıcı BYOK API anahtarını kullanır ve `api_usage_logs` tablosuna maliyet kaydeder.
4. **`imagen-edit`**: Gemini 3.1 Flash Image modelini kullanarak yüklenen görselleri art direktör seviyesinde yeniden yapılandırır ve tasarlar.
5. **`whatsapp-webhook`**: Meta WhatsApp Cloud API entegrasyonunu sağlar. Kullanıcıların WhatsApp'tan attığı mesajları yakalar, kullanıcının veritabanındaki dinamik `system_prompt` talimatına göre Gemini ile cevap üretir ve Meta API'si üzerinden geri yanıtlar.
6. **`drive-webhook`**: Google Drive Push Notifications (Anlık Bildirimler) webhook'unu dinler. Yeni eklenen veya güncellenen dosyaları tespit edip indirme, Gemini ile multimodal içerik/görsel analizi, embedding (vektör) üretimi ve pgvector tablosuna (`company_documents`) yazma adımlarını tetikler.
7. **`meta-auth-callback`**: Mobil uygulamadaki Meta OAuth akışından dönen yetkilendirme kodunu (`authCode`) alır, Meta API üzerinden kalıcı erişim jetonuna (`access_token`) dönüştürür. Ardından kullanıcının WhatsApp Business Account ID (WABA) ve Telefon Numarası ID'sini çekip veritabanındaki `profiles` tablosuna kaydeder.

### Çevresel Değişkenler (Secrets / Environment Variables)
Edge fonksiyonlarının çalışması için Supabase panelinizde `Edge Functions -> Secrets` menüsünden veya CLI üzerinden (`npx supabase secrets set KEY=VALUE`) şu anahtarları eklemeniz gerekir:
- `SUPABASE_URL` : Projenizin Supabase API URL'si.
- `SUPABASE_ANON_KEY` : İstemci seviyesinde doğrulama yapabilmek için Supabase anonim anahtarı.
- `SUPABASE_SERVICE_ROLE_KEY` : Edge fonksiyonlarının (özellikle webhook'lar ve OAuth callback) RLS güvenlik kurallarını aşarak veritabanına doğrudan yazabilmesi için gerekli servis rolü anahtarı.
- `ZERNIO_API_KEY` : Zernio geliştirici panelinizden edindiğiniz API anahtarı.
- `GEMINI_API_KEY` : Görsel düzenleme (`imagen-edit`) mikroservisinde ve sistemin genelinde varsayılan / fallback olarak kullanılacak Google AI Studio API anahtarı.
- `WHATSAPP_TOKEN` : Meta Developer panelinden aldığınız WhatsApp Cloud API erişim jetonu (Permanent Access Token).
- `WHATSAPP_PHONE_NUMBER_ID` : Meta Developer panelinde size atanan WhatsApp Telefon Numarası Kimliği.
- `WHATSAPP_VERIFY_TOKEN` : Meta Webhook kurulumunda doğrulama için belirleyeceğiniz özel şifre (varsayılan: `aiesnaf_verify`).
- `META_APP_ID` : Meta Geliştirici panelindeki uygulamanızın kimlik numarası (Facebook App ID).
- `META_APP_SECRET` : Meta Geliştirici panelindeki uygulamanızın gizli anahtarı (Facebook App Secret).

---

## 🌐 3. Adım: Webhook Entegrasyonu (Zernio)

Yapay zekanın müşterilerle 7/24 konuşabilmesi için Zernio'dan gelen Instagram DM'leri ve yorumlarının bizim veritabanımıza anında düşmesi gerekir.

1. Zernio Geliştirici Panelinize giriş yapın.
2. Webhooks (Abonelikler) sekmesine gidin.
3. **Endpoint URL** olarak az önce deploy ettiğiniz `zernio-webhook` fonksiyonunun URL'sini girin. (Örn: `https://<YOUR_PROJECT_ID>.supabase.co/functions/v1/zernio-webhook`)
4. Abone olunacak (Subscribe) olaylar:
   - `message.received`
   - `comment.created`
   - `review.created`

Bu sayede Zernio, Instagram'dan bir DM aldığında bunu sizin Edge fonksiyonunuza postalar, fonksiyon veritabanına (`messages`) kaydeder ve veritabanı da Supabase Realtime üzerinden anında mobil uygulamadaki cam baloncuklara bu mesajı düşürür.

---

## 📱 4. Adım: Frontend (Mobil Uygulama) Kurulumu

Projenin React Native (Expo) kısmını kendi bilgisayarınızda derleyip çalıştırmak için:

1. Gerekli kütüphaneleri yükleyin:
```bash
npm install
```

2. Ana dizinde `.env` isimli bir dosya oluşturun ve `.env.example` içeriğine uygun olarak gerekli tüm değişkenleri ekleyin:
```env
# Supabase Konfigürasyonu
EXPO_PUBLIC_SUPABASE_PROJECT_ID=your_supabase_project_id_here
EXPO_PUBLIC_SUPABASE_URL=https://your_supabase_project_id_here.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Yapay Zeka ve Dış API Jetonları (Mobil Fallback/Geliştirme için)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_ZERNIO_API_TOKEN=your_zernio_api_token_here
```

3. Geliştirme sunucusunu (Expo) başlatın:
```bash
# Önbelleği temizleyerek başlatır (Çakışmaları önlemek için önerilir)
npx expo start -c
```

Uygulamanız başlatıldığında iOS/Android simülatöründe veya Expo Go uygulamanızda çalışmaya hazırdır.

---

## 📐 Mimari ve Klasör Yapısı (Domain-Driven Design)

Proje, genişletilebilirlik ve bakım kolaylığı sağlamak amacıyla katı **Domain-Driven Design (DDD)** ve **Çok Dilli (i18n)** mimarisiyle yapılandırılmıştır.

- `src/core/` : Uygulamanın başlatılma omurgası.
  - `navigation/` : `AppNavigator.js` ve `TabNavigator.js`.
  - `i18n/` : `i18next` ve `expo-localization` kurulumu, dil dosyaları (`tr.json`, `en.json`).
  - `theme/` : Global renk (Deep Dark, Neon) tanımları.
- `src/shared/` : Modül bağımsız, global araçlar ve UI bileşenleri.
  - `ui/` : `GlobalAppBar`, `ChatInputBar`, `CustomButton`, `CustomInput` gibi paylaşılan bileşenler.
  - `utils/` : `formatters.js` (Dinamik para birimi ve tarih formatlama).
  - `lib/` : Merkezi `supabase.js` istemcisi.
- `src/modules/` : İzole iş mantığı alanları (Modüller kendi kök dizinlerinden - Barrel Pattern ile dışa aktarım yapar).
  - `muhasebe/` : `AiMuhasebeScreen` ve `OdemeTakvimiScreen` gibi muhasebe özellikleri.
  - `sosyal_medya/` : `SosyalMedyaScreen`, `InboxScreen`, `AnalyticsScreen`, `ChatScreen`, `BotYonetimiScreen` ekranları ve `wahaService` API yöneticisi.
- `supabase/functions/` : Supabase Edge Functions klasörü.
  - `deno.json` : Ortak Deno bağımlılık yöneticisi (`@zernio/node` SDK'sı burada tanımlıdır).
  - `zernio-webhook/` ve `zernio-client/` : Mikroservis kodları.
- `supabase/schema.sql` : Tüm PostgreSQL veritabanı yapısı.

> **Mimari Kural:** Modüller arası çapraz import (deep-import) kesinlikle yasaktır. İletişim sadece `core/` ve `shared/` katmanları üzerinden, modüllerin kendi `index.ts` dosyaları (Barrel Pattern) vasıtasıyla yapılır.

---

## 🔗 5. Adım: Sosyal Medya Bağlantı Mimarisi (Zernio OAuth)

Kullanıcıların sosyal medya (Facebook, Instagram vb.) hesaplarını AI Esnaf uygulamasına bağlarken izlediğimiz güvenli ve modern mimari şu şekildedir:

1. **Bağlantı Başlatma:** Uygulama içerisinden "Hesabınızı Ekleyin" ikonlarına tıklandığında, `zernio-client` Edge fonksiyonuna istek atılır ve Zernio'nun OAuth yetkilendirme linki (`authUrl`) alınarak telefonun tarayıcısında açılır.
2. **Doğrudan API Çekimi (DB Bypass):** Test ortamlarındaki geri yönlendirme (Redirect URI) kısıtlamaları ve Supabase RLS (Row Level Security) kurallarının yaratabileceği UUID/yabancı anahtar çakışmalarını tamamen sıfıra indirmek adına, **aradaki Supabase veritabanı kayıt katmanı tamamen devreden çıkarılmıştır.**
3. **Akıllı Senkronizasyon (Focus Radar):** Kullanıcı hesabını yetkilendirip uygulamaya geri döndüğünde, `SosyalMedyaScreen` ekranındaki `useFocusEffect` radarı otomatik olarak tetiklenir (Ayrıca ekranda manuel bir "Senkronize Et" butonu da bulunur).
4. **Canlı Fetch:** Uygulama, veritabanına bakmak yerine doğrudan Edge Function üzerinden Zernio API'ye (`zernio.accounts.listAccounts`) giderek anlık olarak kullanıcının bağlı hesaplarını çeker ve saniyesinde UI üzerinde (ikolarla birlikte) çizer. Bu mimari sayesinde veri kaybı yaşanmaz ve senkronizasyon garantilenir.

---

## 🆕 Son Güncellemeler (Haziran 2026 - UX/UI & Bug Fixes)

1. **Yüzen Kapsül Mesaj Kutusu (Floating Pill Input):** Uygulamanın tüm mesajlaşma alanlarındaki (AI Muhasebe, Chat, Asistan) mesaj kutuları baştan tasarlandı. Ekranın bir ucundan diğer ucuna uzanan eski düz dikdörtgen yapı yerine, alt navigasyon menüsüyle (TabNavigator) %100 uyumlu **yüzen kapsül** (Floating Pill) tasarımına geçildi.
2. **Dinamik Safe Area ve Klavye Spacing (Milimetrik Çözüm):** `ChatInputBar` bileşeni `react-native-safe-area-context`'ten alınan `useSafeAreaInsets` ve klavye dinleyicileriyle entegre edildi. Klavye açıkken bottom padding `0`'a çekilir, kapalıyken `insets.bottom` (Home Indicator yüksekliği) kadar padding verilir. Ekran dışındaki `SafeAreaView` bileşenleri `edges={['top', 'left', 'right']}` ile sınırlandırılmıştır. Böylece klavye açıldığında mesaj kutusu milimetrik olarak klavyenin tam üzerine oturur.
3. **Saydamlık ve Derinlik (Transparent Gap):** Alt navigasyon barı ile mesaj kutusu arasındaki boşluk `transparent` yapılarak, uygulamanın ana cam efekti (glassmorphism) ve arkaplan deseninin aradan süzülmesi sağlandı. Sosyal medya ana butonunun dışa taşma (overflow) hesaplamaları milimetrik olarak optimize edildi.
4. **Supabase Schema Uyuşmazlığı Giderildi (PGRST204):** Gelir/Gider eklerken yapay zekanın çıkarttığı ancak veritabanında karşılığı olmayan `description` sütunu SQL insert komutlarından temizlenerek 'Could not find the description column' hatası giderildi.
5. **Detay Ekranlarında TabBar Gizleme:** Detay yığıtları `TabNavigator.js`'den root `AppNavigator.js`'e taşındı. Böylece detay sayfalarında alt navigasyon barı tamamen gizlenerek mesajlaşma alanları maksimum ekran boyutuna kavuştu.
6. **Sıfır ESLint Hata Standartları:** Animasyon ref'lerinin render anında erişimi, hook'ların koşullu kullanımı ve useEffect'lerdeki cascading render'lar gibi tüm linter hataları tamamen çözüldü.
7. **Tab Bar Altında Kalan İçeriklerin Düzeltilmesi:** `BotYonetimi`, `AiMuhasebe` ve `SosyalMedya` ekranlarında en alt kısımdaki içeriklerin yüzen (absolute) Tab Bar'ın arkasında kalmasını önlemek için listelerin alt boşlukları (paddingBottom: 130) artırıldı.
8. **Mesajlaşma Ekranı Siyah Boşluk Giderimi:** Android cihazlarda klavye offset ayarlarından (`keyboardVerticalOffset`) ve `ChatInputBar`'daki fazladan boşluklardan (`mb-2`) kaynaklanan siyah zemin hataları giderildi.
9. **AI Paylaşım Ekranı Klavye Deneyimi:** `AiUretimScreen` ekranındaki "Seçili Platformlarda Paylaş" butonu, Android'de klavye açıldığında yukarı kayarak metin giriş kutusunu kapatıyordu. Bu sorun, butonun `KeyboardAvoidingView` dışına alınması ve `Keyboard.addListener` kullanılarak klavye açıkken butonun gizlenmesi sağlanarak çözüldü.
11. **Domain-Driven Design (DDD) ve i18n Refaktörü:** Proje, katı modüler mimariye (core, shared, modules) geçirildi. Deep import'lar Barrel Pattern (`index.ts`) ile izole edildi. Çok dilli altyapı (`i18next`) kurularak statik metinler ve TL simgeleri dinamik `Intl` formatlayıcılara devredildi. Toplu refaktör sonrası 0 ESLint hatası standardı korundu.
12. **Gerçek DDD (Domain-Driven Design) İç Katman Mimarisi:** `modules/muhasebe` ve `modules/sosyal_medya` modülleri sadece birer "feature folder" olmaktan çıkarılıp `domain`, `application`, `infrastructure` ve `presentation` olmak üzere 4 ana katmana ayrıldı. Bileşenler ve servisler ait oldukları izole katmanlara taşındı (Örn: `screens/` -> `presentation/screens/`).
13. **Anti-Bypass ve Domain Purity Entegrasyonu:** `.eslintrc.js` yapılandırması üzerinden modüller arası katman geçişlerinde relative path (`../../` vb.) kullanımı tamamen yasaklandı; geliştiriciler `tsconfig.json` alias'larına (`@domain`, `@application` vb.) mecbur bırakıldı. Ayrıca Domain katmanı tamamen izole edilerek içine `react`, `react-native`, `axios` veya `supabase` gibi UI/Altyapı bağımlılıklarının girmesi derleme aşamasında (error) fiziksel olarak yasaklandı.
14. **Clean Architecture - Dependency Inversion (Bağımlılığın Tersine Çevrilmesi):** Application katmanının doğrudan Infrastructure katmanına bağımlı olması yasaklandı. `domain/interfaces` altında dış servis şablonları (`IWahaService.ts`) tanımlanarak, UseCase'lerin dış dünyayla (Supabase, Zernio, Waha API) olan bağlantısı Constructor üzerinden (Dependency Injection) sağlandı. Böylece iş mantığı (Application), altyapıdan tamamen izole edildi.
15. **Mimari Radar ve CI Entegrasyonu:** Mimarinin zamanla bozulmasını önlemek için projeye `dependency-cruiser` ve `madge` eklendi. Çapraz modül erişimleri, katman sınır ihlalleri (Presentation -> Application -> Domain kurallarına uymayanlar) ve dairesel bağımlılıklar (Circular Dependency) `.dependency-cruiser.js` konfigürasyonuna yazılarak test komutları (`test:boundaries` ve `test:circular`) oluşturuldu. Proje **0 mimari ihlal** ile çalışmaya devam etmektedir.
16. **Inversion of Control (IoC) ve Tam DI Enjeksiyonu:** `tsyringe` ve `reflect-metadata` kurularak Application katmanındaki UseCase'lerin bağımlılıkları Runtime'da (çalışma zamanında) enjekte edilebilir hale getirildi. Infrastructure servisleri (`WahaService`) birer Sınıf (Class) yapısına çekilerek `@injectable()` ile işaretlendi ve `core/container.ts` içerisinde arayüzleriyle (Interface) eşleştirildi. UI bileşenleri artık altyapı kodunu değil, doğrudan Container'dan çözümlenen UseCase'i çağırmaktadır.
17. **Kurumsal Globalizasyon ve Hardcoded Metin Yasağı (i18n):** Sosyal Medya modülündeki tüm UI ekranlarında (ChatScreen, BotYonetimi, AiUretim, Analytics, SosyalMedyaScreen, InboxScreen) yer alan doğrudan yazılmış Türkçe metinler sökülüp `tr.json` ve `en.json` çeviri dosyalarına bağlandı. UI bileşenleri `useTranslation` hook'u ile dinamik hale getirildi. Arayüz (`presentation`) katmanında statik metin yazılmasını engellemek için `eslint-plugin-i18next` paketinin `i18next/no-literal-string` kuralı "error" seviyesinde devreye alındı. Modül %100 çok dilli ve globalleşmeye hazır duruma getirildi.
18. **AI Muhasebe Modülü Globalizasyonu (i18n) - Faz 5:** Sosyal medya modülünün ardından muhasebe modülünün (`AiMuhasebeScreen`, `OdemeTakvimiScreen`) presentation katmanındaki tüm UI metinleri (başlıklar, özetler, uyarılar, sahte/mock para birimleri ve değerler) sökülerek `tr.json` ve `en.json` dosyalarına aktarıldı. Statik değerler bileşen içindeki sabitlere dönüştürüldü. Linter'ın `i18next/no-literal-string` kuralı tüm uygulama genelinde 0 hata verecek seviyeye (Sıfır Hata) getirildi.
19. **Pro-Level Enterprise Core Mimari (FİNAL) - Faz 6:** Sistem yatay büyümeye hazır bir Enterprise (Kurumsal) Core seviyesine çıkarıldı.
    - **Merkezi Hata Yönetimi (`shared/errors`):** `throw new Error()` kullanımı terk edilerek `AppError` ana sınıfından türeyen `ValidationError`, `BusinessRuleError`, `NetworkError`, `AuthenticationError`, `AuthorizationError` gibi spesifik hata sınıfları tanımlandı.
    - **Immutable Domain Entity:** Muhasebe modülü için `Transaction` varlığı (Entity), içindeki alanların dışarıdan değiştirilmesini önlemek amacıyla tamamen `readonly` olarak oluşturuldu.
    - **Repository & Evrensel Standartlar:** Veri katmanını soyutlamak için `ITransactionRepository` (Örn: `findAll`, `findById`, `create`) tanımlandı.
    - **Çift Yönlü Mapper:** Altyapı katmanında, veritabanı JSON yanıtı (Supabase Row) ile Domain Entity arasında çift yönlü dönüşüm sağlayan `TransactionMapper` (`toDomain`, `toPersistence`) entegre edildi.
    - **UseCase ve IoC Entegrasyonu:** `SupabaseTransactionRepository` oluşturularak container'a (DI) eklendi. UI ekranlarındaki (`OdemeTakvimiScreen`) tüm doğrudan Supabase çağrıları silinip, yerine Dependency Injection ile kurulan `GetTransactionsUseCase` bağlandı. Mimari refaktör süreci `%100` tamamlandı ve yeni modüller için örnek teşkil edecek Enterprise temel atılmış oldu.
20. **Randevu Modülü i18n & ESLint Hata Çözümü & Katman Sınırı Entegrasyonu:**
    - **Çok Dillilik (i18n):** `RandevuScreen.js` ve `HizmetAyarlariScreen.js` ekranlarındaki hardcoded Türkçe metinler sökülüp `tr.json`, `en.json` ve `de.json` dosyalarına bağlandı.
    - **Animated Ref Hatası Çözümü:** `RandevuScreen` ve `AiUretimScreen`'deki render esnasında ref (`useRef().current`) erişiminden kaynaklanan ESLint hataları, `useState` tabanlı `Animated.Value` tanımına geçilerek temizlendi.
    - **TypeScript Path Alias Entegrasyonu:** `tsconfig.json`'daki `@domain/*`, `@application/*`, `@infrastructure/*` ve `@presentation/*` alias'larına `randevu` modülü dizinleri eklendi.
    - **Relative Import Temizliği:** `muhasebe`, `randevu` ve `sosyal_medya` modüllerindeki tüm relative import'lar path alias'larına geçirilerek mimari sınır ihlali (Anti-Bypass) hataları giderildi, ESLint kuralları sıfır (0) hata ile yeşile döndü.
21. **Sistem Talimatı Kartına Dönen RGB Işık Halesi ve Gölge Desteği (UX/UI):**
    - **Neden:** `overflow: 'hidden'` olan bir kutu üzerinde static gölge tanımlandığında, React Native render motoru (özellikle iOS) gölgeyi keser. Ayrıca dönen RGB ışık sadece ince bir kenarlık olarak kalıyordu, dışa doğru bir haleli gölge (glow/halo shadow) hissi vermiyordu.
    - **Çözüm:** `BotYonetimiScreen.js` içindeki Sistem Talimatı kartını `overflow` içermeyen dış bir `<View>` sarmalına aldık. Kartın arkasına (`position: absolute` ve z-index olarak en arkada kalacak şekilde) 10px daha büyük, opacity değeri `0.35` olan ve `shadowRadius: 16` yumuşak gölge özellikleriyle donatılmış ikinci bir `Animated.View` yerleştirdik. Bu sayede kutunun etrafında dışa taşan ve yumuşak bir gölge gibi dönen göz alıcı premium RGB ışık halesi (halo glow) oluşturuldu.

---

**Tebrikler!** Yapay zeka destekli, Canlı Akışa (Realtime) sahip dijital asistan projenizi sıfırdan başarıyla kurdunuz. 🚀

---

## 📅 Randevu Modülü — Mimari ve Teknik Dokümantasyon

> **Son Güncelleme:** Haziran 2026 — Supabase Realtime entegrasyonu ve Clean Architecture bağlantısı tamamlandı.

### Genel Bakış

Randevu modülü (`src/modules/randevu`), işletme sahiplerinin günlük randevu yönetimini yapabildiği tam çalışan bir dashboard sistemidir. Supabase Realtime üzerinden anlık veri akışı, Clean Architecture prensiplerine uygun katmanlı yapı ve sıfır dekoratörlü manuel DI container kullanır.

---

### 📁 Dosya Yapısı

```
src/modules/randevu/
├── application/
│   └── useCases/
│       ├── ApproveAppointmentUseCase.ts   — Randevu onaylama (Supabase + WhatsApp)
│       ├── CancelAppointmentUseCase.ts    — Randevu iptal (Supabase + WhatsApp)
│       ├── GetAvailableHoursUseCase.ts    — Müsait saat hesaplama
│       └── StartAppointmentFlowUseCase.ts — WhatsApp randevu akışı başlatma
│
├── domain/
│   ├── entities/
│   │   └── Appointment.ts                 — Immutable domain entity (private fields + getters)
│   ├── enums/
│   │   └── AppointmentStatus.ts           — Pending | Approved | Cancelled | Expired
│   ├── gateways/
│   │   └── IWhatsAppGateway.ts            — WhatsApp servis arayüzü
│   └── repositories/
│       └── IAppointmentRepository.ts      — Repository arayüzü (7 metod)
│
├── infrastructure/
│   ├── mappers/
│   │   └── AppointmentMapper.ts           — DB row ↔ Domain Entity dönüşümü
│   ├── repositories/
│   │   └── SupabaseAppointmentRepository.ts — Tüm Supabase + Realtime implementasyonları
│   └── services/
│       └── WahaRandevuService.ts          — WAHA WhatsApp API entegrasyonu
│
└── presentation/
    ├── hooks/
    │   └── useAppointments.ts             — Veri + Realtime + isSlotBusy() hook
    └── screens/
        ├── RandevuScreen.js               — Dashboard (Calendar + Heatmap + Timeline)
        └── HizmetAyarlariScreen.js        — Hizmet yönetimi (görüntüle/düzenle)
```

---

### 🗄️ Supabase Tablo Şeması — `appointments`

```sql
create table public.appointments (
  id              uuid primary key default gen_random_uuid(),
  customer_phone  text not null,
  customer_name   text,
  service_id      text not null,
  employee_id     text,
  date            text not null,        -- "YYYY-MM-DD" veya ISO datetime
  status          text not null,        -- 'Pending' | 'Approved' | 'Cancelled' | 'Expired'
  booking_token   text not null unique,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Realtime'ı aktif et
alter publication supabase_realtime add table appointments;

-- RLS — kullanıcı kendi randevularını yönetir
alter table appointments enable row level security;
```

---

### 🏛️ Katman Mimarisi ve Veri Akışı

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                       │
│                                                                     │
│  RandevuScreen.js          useAppointments.ts (hook)               │
│  ├── Calendar Strip        ├── selectedDate (state)                │
│  ├── Heatmap Grid          ├── appointments (state)                │
│  │   └── isSlotBusy()      ├── loading / error (state)             │
│  └── Timeline List         ├── getAppointmentsByDate() → fetch     │
│                            └── subscribeToAppointments() → realtime│
└────────────────────────────────────┬────────────────────────────────┘
                                     │ container.resolve('AppointmentRepository')
┌────────────────────────────────────▼────────────────────────────────┐
│  APPLICATION                                                        │
│  UseCase'ler sadece IAppointmentRepository arayüzüne bağımlıdır.   │
│  Concrete implementasyonu ASLA doğrudan import etmezler.            │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ implements
┌────────────────────────────────────▼────────────────────────────────┐
│  INFRASTRUCTURE                                                     │
│                                                                     │
│  SupabaseAppointmentRepository                                      │
│  ├── getAppointmentsByDate(date)                                    │
│  │   └── supabase.from('appointments').eq('date', date)             │
│  ├── subscribeToAppointments(date, callback)                        │
│  │   └── supabase.channel().on('postgres_changes').subscribe()      │
│  ├── create / approve / cancel / findByToken                        │
│  └── findAvailableHours (gerçek DB sorgusu)                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 💉 Dependency Injection — Manuel Container

Projede `tsyringe` veya herhangi bir IoC framework KULLANILMAMAKTADIR. Tüm bağımlılıklar `src/core/container.ts` içindeki düz JavaScript nesnesiyle yönetilir.

#### `src/core/container.ts`

```typescript
// Singletonlar elle oluşturulur — hiçbir dekoratör (@injectable vb.) YOK
const appointmentRepository = new SupabaseAppointmentRepository();

const container = {
  resolve: (cls: any) => {
    // String key ile çözümleme (hook'lardan kullanım için)
    if (cls === 'AppointmentRepository') return appointmentRepository;

    // Class referansı ile çözümleme (UseCase'lerden kullanım için)
    if (cls === ApproveAppointmentUseCase) return approveAppointmentUseCase;
    // ...
  }
};
```

#### Kullanım — Hook İçinden

```typescript
// useAppointments.ts
const repo = container.resolve('AppointmentRepository') as SupabaseAppointmentRepository;
```

#### ⚠️ KRITIK KURAL: Asla tsyringe kullanma!

- `@injectable()`, `@inject()`, `reflect-metadata` → **YASAK**
- Hermes JS Engine bu dekoratörleri desteklemez → Build hataları oluşur
- Yeni servis/repository eklerken sadece `container.ts` dosyasına singleton ekle ve `resolve()` switch'ine kaydet

---

### 🔴 Supabase Realtime Aboneliği

`subscribeToAppointments` metodu bir Supabase channel oluşturur ve `appointments` tablosundaki tüm değişiklikleri (`INSERT`, `UPDATE`, `DELETE`) dinler.

```typescript
subscribeToAppointments(date, callback): () => void {
  const channel = supabase
    .channel(`appointments-date-${date}`)
    .on('postgres_changes', {
      event: '*',           // INSERT | UPDATE | DELETE hepsini dinle
      schema: 'public',
      table: 'appointments',
      filter: `date=eq.${date}`,  // Sadece seçili güne ait değişiklikler
    }, async () => {
      // Her değişiklikte tüm listeyi yeniden çek (tutarlılık için)
      const fresh = await this.getAppointmentsByDate(date);
      callback(fresh);
    })
    .subscribe();

  // Cleanup fonksiyonu döner — useEffect unmount'ta çağrılır
  return () => supabase.removeChannel(channel);
}
```

**Önemli:** Realtime'ın çalışması için Supabase panelinde `appointments` tablosunun `supabase_realtime` publication'ına eklenmiş olması gerekir.

---

### 🎨 UI Bileşenleri — RandevuScreen

#### 1. Sticky Header (Yapışkan Başlık)

`ScrollView`'un `stickyHeaderIndices={[0]}` özelliği kullanılarak Calendar Strip + Heatmap Grid her zaman ekranın üstünde sabit kalır. Randevu listesi kaydırıldıkça bu sticky blokun altına girer.

#### 2. Calendar Strip (Haftalık Takvim Şeridi)

```
[ Pzt 11 ] [ SAL 12 ] [ Çar 13 ] [ Per 14 ] [ Cum 15 ]  ──►
                ↑ Aktif gün: Yeşil, büyütülmüş (scale: 1.1)
```

- Yatay scroll (`horizontal ScrollView`)
- `activeDay` state ile seçili gün takip edilir
- Gün seçimi → `setSelectedDate()` → hook yeni tarihi çeker

#### 3. Günlük Müsaitlik Heatmaps (3-Satırlı Isı Haritası)

```
Sabah  │ 08:00 │ 08:30 │ 09:00 🟢 │ ... ──►
Öğle   │ 13:00 🟢 │ 13:30 │ 14:00 │ ... ──►
Akşam  │ 19:00 │ 19:30 │ 20:00 │ ... ──►
```

- 08:00'den 00:00'a kadar **30 dakikalık** aralıklar (33 slot, otomatik üretilir)
- Sol etiketler (`Sabah / Öğle / Akşam`) sabit
- Slotlar yatay kaydırılabilir (tümü birlikte)
- `isSlotBusy(slot.time)` → DB'deki gerçek randevulara göre yeşil/gri

```javascript
// isSlotBusy implementasyonu (useAppointments.ts)
const isSlotBusy = (timeSlot: string): boolean =>
  appointments.some(appt =>
    extractTime(appt.date) === timeSlot &&
    (appt.status === 'Approved' || appt.status === 'Pending')
  );
```

#### 4. Appointment Timeline

- `loading` → `ActivityIndicator` göster
- `appointments.length === 0` → Boş durum ekranı
- Her randevu kartı: müşteri adı/telefon, hizmet ID, saat bilgisi
- Renk paleti 4 renkli döngüsel (`CARD_COLORS` dizisi)

---

### 🔧 Hizmet Ayarları Ekranı (HizmetAyarlariScreen)

Randevu ekranının header'ındaki takvim ikonuna basılarak açılır.

| Özellik | Detay |
|---------|-------|
| **Görünürlük Toggle** | Switch ile hizmetleri aktif/pasif yap |
| **Görüntüleme Modu** | Liste görünümü — isim ve fiyat |
| **Düzenleme Modu** | TextInput'lar açılır — isim, fiyat, birim |
| **Maks Hizmet** | 10 adet limit |
| **Silme** | Edit modunda çöp kutusu ikonu |

#### Navigasyon Akışı

```
BotYonetimiScreen
    └──► RandevuScreen (stack: "RandevuMain")
             └──► HizmetAyarlariScreen (stack: "HizmetAyarlari")
                  ← calendar icon onPress={() => navigation.navigate('HizmetAyarlari')}
```

---

### 🛣️ Navigation Yapısı (TabNavigator)

```javascript
// BotYonetimiStack içinde:
<Stack.Screen name="BotYonetimiMain" component={BotYonetimiScreen} />
<Stack.Screen name="RandevuMain"     component={RandevuScreen} />
<Stack.Screen name="HizmetAyarlari"  component={HizmetAyarlariScreen} />
```

---

### 🔌 IAppointmentRepository Arayüzü (Tam Liste)

```typescript
export interface IAppointmentRepository {
  // Temel CRUD
  create(appointment): Promise<Appointment>;
  approve(id: string): Promise<Appointment>;
  cancel(id: string): Promise<Appointment>;
  findByToken(token: string): Promise<Appointment | null>;
  findAvailableHours(date: string, serviceId: string): Promise<string[]>;

  // Dashboard için (Haziran 2026 eklendi)
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  subscribeToAppointments(
    date: string,
    callback: (appointments: Appointment[]) => void
  ): () => void;   // ← unsubscribe fonksiyonu döner
}
```

---

### ✅ Geliştirme Kontrol Listesi

Yeni geliştirici katılırken veya yeni bir özellik eklerken şu adımları takip et:

- [ ] `appointments` tablosu Supabase'de mevcut ve RLS aktif
- [ ] `supabase_realtime` publication'ına `appointments` eklenmiş
- [ ] `.env` dosyasında `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` tanımlı
- [ ] Yeni repository eklenirse `container.ts`'e hem singleton hem string key eklenmeli
- [ ] Hiçbir dosyaya `@injectable`, `@inject`, `reflect-metadata` ekleme
- [ ] Expo SDK v56 docs: https://docs.expo.dev/versions/v56.0.0/

---

