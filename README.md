# Workigom Ecosystem Architecture

Workigom projesi monorepo mimarisinden bağımsız ve modüler 4 ayrı projeye (repository) bölünmüştür. Bu yapı, her bir ürünün bağımsız geliştirilmesini, deploy edilmesini ve yönetilmesini sağlar.

## Repolar ve Görevleri

1. **Workigom (Marketing Hub)**
   - **Repo:** cicicarscom-pixel/workigom
   - **Domain:** www.workigom.com
   - **Görev:** Ana landing page ve pazarlama sitesidir. /flow ve /ledger tanıtım sayfalarını içerir. Kullanıcı kayıt/giriş işlemlerini yürütmez, doğrudan uygulamanın login sayfasına yönlendirir.
   
2. **Workigom Flow (Ana Uygulama)**
   - **Repo:** cicicarscom-pixel/flow (Eski adıyla i_muhasebeci)
   - **Domain:** low.workigom.com
   - **Görev:** Flow'un gerçek yapay zeka ve otomasyon uygulamasıdır. Supabase ve arka plan API'lerine bağlıdır. Çalışması için Vercel üzerinde Environment Variables (Ortam Değişkenleri) yapılandırmasına ihtiyaç duyar.

3. **Workigom Ledger (Ana Uygulama)**
   - **Repo:** cicicarscom-pixel/ledger
   - **Domain:** ledger.workigom.com
   - **Görev:** Muhasebe ve Ledger platformunun gerçek uygulamasıdır.

4. **Workigom FlowWeb (Legacy / Standalone Landing)**
   - **Repo:** cicicarscom-pixel/flowweb
   - **Görev:** Flow için hazırlanmış eski bağımsız tanıtım projesidir (Şu an tanıtım sayfaları ana Workigom reposuna taşındığı için daha pasif durumdadır).

## Geliştirme ve Deployment Kuralları
- **Yönlendirmeler:** Tanıtım sayfalarındaki "Giriş Yap" butonları (örn: www.workigom.com/flow veya /ledger), direkt olarak uygulamanın kendi domain'indeki (örn: https://flow.workigom.com/login) giriş sayfalarına yönlendirmelidir.
- **Environment Variables:** low ve ledger gibi gerçek uygulama repoları Vercel'de deploy edilirken .env dosyasındaki tüm API ve veritabanı değişkenleri eksiksiz olarak Vercel paneline girilmelidir, aksi takdirde 500 Internal Server Error hatası alınır.
- **Root Directory:** Repolar ayrıldığı için Vercel üzerindeki Root Directory ayarları boş bırakılmalıdır (Eskiden pps/flow vs. idi, artık tüm repolar kendi kök dizininde çalışır).

---

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
15. **Omnichannel Router (Clean Architecture):** Gelen mesajları tek merkezden yönetmek için `HandleIncomingMessageUseCase` oluşturuldu. `waha-webhook` ve `zernio-webhook` bu ortak UseCase üzerinden `GeminiClient`, `WahaClient` ve `ZernioClient` adapterlerine bağlandı. Her mesaj `ai_communication_logs` tablosuna raporlandı. Bot Yönetimi ekranına WhatsApp ve Sosyal Medya için ayrı şalterler eklendi ve bu şalterler Supabase üzerinden `bot_settings` tablosundaki ilgili alanlarla (`whatsapp_bot_active`, `social_bot_active`) bağlandı. Son olarak, Gelen Kutusunda iletişimin canlı olarak izlenebilmesi için `CommunicationLogsTable` bileşeni eklendi.
16. **Zernio Yorum Yanıtlama & Webhook Bug Fix:** Zernio webhook'undan gelen `message.received` ve `comment.received` loglarındaki payload yapısı (iç içe obje hiyerarşisi) dokümantasyona uygun şekilde `payload.message` ve `payload.comment` kullanılacak şekilde düzeltilerek DM'lerin uygulamaya düşmeme sorunu giderildi. Ayrıca `HandleIncomingMessageUseCase` üzerinden Instagram yorumlarına `ZernioClient.replyToComment` uç noktası kullanılarak yapay zekanın yanıt dönmesi sağlandı. İletişim raporları ekranı UX iyileştirmesiyle boş durumda buton görünümüne kavuşturuldu.
17. **Instagram Yorum Resimleri — 3 Fazlı Yükleme Mimarisi (ÖNEMLİ):** `InboxScreen.js` Yorumlar sekmesi üç fazlı bir yükleme stratejisi ile çalışır. **Faz 1** (~100ms): Yerel Supabase DB'den yorumlar anında gösterilir; `zernio_pic_cache` AsyncStorage'dan 6 günlük TTL önbelleği uygulanır. **Faz 1.5** (~2-3sn): `zernio-client` edge function'ına tek `get-inbox-pictures` çağrısı yapılır; `listInboxComments` API'sinden tüm postların `picture` URL'leri alınır, `post_<postId>` anahtarıyla önbelleğe yazılır ve mevcut liste `zernio_post_id` üzerinden güncellenir. **Faz 2** (~8-9sn, arka planda): `sync-comments` çağrısı yapılır, yeni yorumlar DB'ye eklenir; resimler önbellekten uygulanır. Bu yapı sayesinde Instagram ve Facebook resimleri 2-3 saniyede ekrana gelir. `social_accounts` tablosunda `zernio_account_id` UNIQUE constraint zorunludur (migration: `20260629173000_social_accounts_unique_constraint.sql`).
18. **Yorum Silme Kalıcılığı ve Realtime Döngü Koruması (ÖNEMLİ):** Kullanıcı bir yorumu sildiğinde hem yerel DB'den kaldırılır hem de `deleted_comments` AsyncStorage'a `{id, deletedAt}` formatında yazılır — 30 günlük TTL ile otomatik temizlenir, eski string[] formatıyla geriye dönük uyumludur. Silmede `item.id` ile birlikte `item.zernio_comment_id` de kaydedilir; böylece Faz 2 (Zernio sync) aynı yorumu geri getirdiğinde her iki anahtar da filtreye takılır ve silinen yorum yeniden görünmez. Realtime döngü koruması: `comments` tablosundaki `INSERT` olayı tam `fetchComments()` tetikler; `UPDATE` olayı (AI cevabı, `media_urls` vb.) ise sadece ilgili satırı state'te günceller — `fetchComments()` ve edge function çağrısı yapılmaz, dolayısıyla sonsuz döngü riski yoktur.
19. **Zernio Webhook DM Crash Fix:** Gelen kutusuna direkt mesaj (DM) düştüğünde webhook'un `message.received` olayında `conversations` tablosuna yapılan upsert işleminin constraint hatası vermesi ve webhook'un çökmesine/durdurulmasına sebep olması engellendi. Upsert yerine önce "select", yoksa "insert" yapacak güvenli bir akış (Safe Insert) kuruldu.
20. **Yorumlarda Ağaç Görünümü (Tree-View) Tutarlılığı:** Instagram/Facebook veya YouTube'dan gelen alt yorumların (cevapların) düz liste halinde görünmesi engellendi. UI, bir yorumun cevap olduğunu anlamak için metnin başındaki `↳ @` kalıbına baktığı için; `zernio-webhook` (`comment.received`) ve `zernio-client` (`sync-comments`) güncellenerek Zernio'dan çekilen yanıtlara `parentCommentId` üzerinden üst yazarın adı bulunup `↳ @{KullaniciAdi}:\n` öneki otomatik olarak eklendi.
21. **Global App Bar Üzerinden Dinamik Senkronizasyon:** `InboxScreen`'deki sekmelerin manuel yenilenmesi (refresh) işlemini daha estetik ve erişilebilir kılmak için `GlobalAppBar`'ın sağ üst köşesine "Sync (Senkronize Et)" butonu konuldu. Tablar (Yorumlar, Mesajlar, Değerlendirmeler) ve Root ekran arasındaki iletişim prop-drilling yerine `DeviceEventEmitter` (`REFRESH_INBOX` yayını) kullanılarak modern ve performanslı bir mimariyle çözüldü.


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

- **Frontend**: React Native, Expo, NativeWind v2 + Tailwind CSS v3, React Navigation.
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
  - `user_api_settings`: Esnafların kendi Google Gemini API anahtarlarını saklayan tablo.
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
3. **`gemini-chat`**: Gemini 2.5 Flash entegrasyonu ile metin üretimi, Imagen 4 entegrasyonu ile görsel üretimi ve Gemini 3.1 Flash Image ile görsel analiz/düzenleme işlemlerini yürütür.
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

- **Frontend**: React Native, Expo, NativeWind v2 + Tailwind CSS v3, React Navigation.
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
  - `user_api_settings`: Esnafların kendi Google Gemini API anahtarlarını saklayan tablo.
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
3. **`gemini-chat`**: Gemini 2.5 Flash entegrasyonu ile metin üretimi, Imagen 4 entegrasyonu ile görsel üretimi ve Gemini 3.1 Flash Image ile görsel analiz/düzenleme işlemlerini yürütür.
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

### ⚠️ ÖNEMLİ: Zernio Payload (Veri Paketi) ve Geri Yanıtlama Mimarisi

Zernio üzerinden gelen mesajlara yapay zeka ile **geri yanıt (reply)** verebilmek için Zernio API'sinin beklediği bazı spesifik verilerin webhook paketinden doğru ayıklanması kritik öneme sahiptir. Geliştirme aşamasında tespit edilen ve çözülen iki ana Zernio webhook kuralı şöyledir:

1. **Direction (Yön) Etiketi Uyuşmazlığı:** Sistemin standartları dışarıdan gelen mesajları `incoming` olarak kabul etse de, Zernio'nun bazı webhook sürümlerinde bu etiket `inbound` olarak gelmektedir. Bu nedenle yapay zeka tetikleyicisindeki koşul şu şekilde esnetilmiştir:
   `if (direction === 'incoming' || direction === 'inbound')`

2. **Zernio Account ID Gizliliği (Early Return Hatası):** Zernio API üzerinden mesaja yanıt dönebilmek için `accountId` zorunludur. Ancak Zernio bu kimliği `payload.accountId` dizini yerine daha derine gizleyerek `"account": { "id": "..." }` formatında göndermektedir. Eğer bu ID webhook içerisinden çıkartılamazsa sistem veritabanındaki `social_accounts` tablosuna başvurur. Kullanıcının bu tabloda henüz hesabı yoksa, kod `early return` yaparak **hata vermeden sessizce çöker (Silent Crash)**.
   Bu sorunu kökünden çözmek için Account ID yakalama algoritması derinleştirilmiş ve veritabanı ihtiyacı tamamen ortadan kaldırılmıştır:
   `const zernioAccountId = payload.account?.id || payload.accountId || payload.data?.accountId || payload.data?.account?.id;`

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

## 🆕 Son Güncellemeler (Temmuz 2026 - AI Görev Dağılımı ve Finansal Veri Birleştirme)

1. **Yapay Zeka Sorumluluk Ayrımı:** Sistemdeki yapay zeka ajanlarının sınırları netleştirildi. `ledger-isleyici-api` yalnızca finansal işlemlere ("Finansal Denetçi" rolü) odaklanırken, WhatsApp/Zernio entegrasyonu ("Ön Büro" rolü) diğer modüllerin sorumluluğunda bırakıldı. AiChatScreen üzerinden atılan tüm mesajlar doğrudan işleyici API'ye bağlandı.
2. **Dinamik AI Hafızası (Context):** `ledger-isleyici-api`, kullanıcının anlık gelir/gider, borç/alacak toplamlarını ve `transactions` ile `finance_documents` tablolarından son 30 işlemi anlık olarak Supabase'den çekip Gemini modeline bağlam olarak sunmaya başladı.
3. **Manuel Finans İşlemleri:** AI asistan ile yapılan konuşmalardan (örn: "Ahmet'e yarın 500 TL ödemem var") elde edilen manuel kasa girişleri, OCR moduna girmeden algılanıp doğrudan `transactions` tablosuna yazılır hale getirildi.
4. **UI Finansal Veri Birleştirme:** `DashboardScreen`, `AiMuhasebeScreen` ve `IsletmemScreen` ekranları refaktör edilerek, hem resmi faturalar (`finance_documents`) hem de manuel harcamalar (`transactions`) ortak bir potada toplanıp gösterilmeye başlandı. İşletmem ekranındaki ay bazlı gruplama ve akıllı analiz bu karma veriye göre çalışır hale getirildi.

---

## 🆕 Geçmiş Güncellemeler (Temmuz 2026 - Analytics Cache & Zernio API)

1. **Zernio Client ve Analytics Cache Güncellemesi:** Supabase Edge Functions altındaki `ZernioClient.ts` dosyası güncellenerek sosyal medya platformları (YouTube, LinkedIn, Instagram, Google Business, vb.) için analytics metotları önbellekleme (cache) desteği ile entegre edildi.
2. **Hata Yönetimi ve Silme İşlemi:** Zernio hesabını ayırma (`disconnect-account`) işlemi doğrudan ZernioClient içindeki metoda bağlandı.
3. **Veritabanı Migration'ı:** Analytics cache için yeni bir Supabase veritabanı migration'ı (`20260705000000_analytics_cache.sql`) oluşturuldu.
4. **Bağımlılıklar:** `package.json` ve `package-lock.json` dosyaları güncellendi.

---

## 🆕 Geçmiş Güncellemeler (Haziran 2026 - UX/UI & Bug Fixes)

0. **AiUretimScreen Yeniden Tasarımı (Zernio Orijinal Arayüz Entegrasyonu):** Kullanıcının isteği doğrultusunda AI Paylaşım ekranına (AiUretimScreen) Zernio'nun orijinal arayüzündeki özellikler eklendi. Ekranın mevcut karanlık (dark) teması korunarak platform seçim kutucukları (çoklu seçim), "Planlı" ve "Şimdi" yayınlama seçenekleri, Tarih/Saat ve Timezone giriş alanları entegre edildi. `publishPost` fonksiyonu artık otonom karar vermek yerine kullanıcının seçtiği platformlara ve planlama ayarlarına sadık kalarak çalışacak şekilde refaktör edildi.
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
21. **Sistem Talimatı Kartına Gök Mavisi Neon Çerçeve ve Dönen Aura Gölgesi (UX/UI):**
    - **Neden:** Kartın tüm çerçevesinin standart kalınlıkta, sürekli parlayan gök mavisi renkli bir sınır çizgisine sahip olması ve arkasında yumuşak, kartın etrafında sürekli olarak dönen/dolaşan parlak gök mavisi bir shadow aura (hareketli gölge aurası) oluşturulması istendi.
    - **Çözüm:** `BotYonetimiScreen.js` dosyasında şu düzenlemeler yapıldı:
        - **Dönen Aura Gölgesi (blue_glow):** Yapay zeka ile `blue_glow.png` adında yumuşak geçişli gök mavisi, lacivert ve turkuaz tonlarında conic bir renk tekerleği oluşturuldu. Bu görsel kartın hemen arkasına yerleştirildi, native `blurRadius={12}` (iOS'ta 25) ile bulanıklaştırıldı ve 8 saniyelik kesintisiz bir döngüyle kendi etrafında dönmesi sağlandı. Bu sayede kartın sınırlarından taşan mavi ışıklar kart etrafında dönen bir gölge aurası oluşturdu.
        - **Kusursuz Yuvarlatılmış Köşeler (paddingHorizontal):** Ana `ScrollView` bileşeninin iç kenar boşluğu `contentContainerStyle={{ paddingHorizontal: 16 }}` olarak güncellendi. Bu sayede tüm kartlar ekran kenarlarından 16px içeri çekildi ve mavi neon sınır çizgisinin `borderRadius: 20` olan köşeleri görünür hale geldi.
        - **İç Gölgelenme Hatasının Engellenmesi (Solid Background):** `glowBorderCyanThick` stilinin arka planı yarı-saydam yerine opak solid koyu gri (`#1c1b1d`) yapıldı. Bu sayede Android işletim sisteminde `elevation` nedeniyle oluşan sistem gölgesinin içeriden sızarak mavi çizginin altında ikinci bir koyu çerçeve oluşturması tamamen engellendi.
        - **Gök Mavisi Çerçeve:** Kenarları kaplayan `borderWidth: 1.5` kalınlığında solid `#00a2ff` (parlak gök mavisi) sınır çizgisi sağlandı.
        - **Sabit ve Kaydırılabilir Giriş:** "AI Karakter Talimatı" kutusunun yüksekliği `280` (sabit 280px, eski boyuta göre 2 kat büyük) yüksekliğe çekildi ve `showsVerticalScrollIndicator={true}` eklenerek yapıştırılan uzun metinlerde kutunun büyümesi önlenip kaydırma çubuğu aktif edildi.
22. **SaaS Premium UX ve Stabil RGB Dönen Işık Entegrasyonu (UX/UI):**
    - **Premium Yeniden Yapılandırma:** `BotYonetimiScreen.js` arayüzü Notion, Linear ve Stripe Dashboard gibi modern SaaS platformlarından ilham alınarak yeniden organize edildi. Görsel karmaşa giderilerek bilgi hiyerarşisi netleştirildi (Aktif/Pasif durumları, AI Kişiliği, Canlı Test, İleri Seviye Ayarlar ve Bağlı Servisler şeklinde ayrıldı).
    - **Stabil LinearGradient:** Kullanıcıların çok sevdiği ince "RGB Dönen Işık" (LinearGradient) efekti `blue_glow.png` gibi statik görseller yerine tamamen native animasyonlarla geri getirildi.
    - **Genişlik/Yükseklik (Jitter) Sorunu Çözümü:** Akordeon menüler gibi dinamik yükseklik değiştiren veya dikdörtgen (geniş/kısa) şekilli kartlarda dönen ışığın köşelerden kopması (sabit durmaması/kayması) hatası çözüldü. `LinearGradient` arka planı `top: '-100%'` gibi yüzeysel değerler yerine, `width: 1500, height: 1500` şeklinde devasa bir kare olarak merkeze sabitlendi. Böylece rotasyon esnasında container boyutu ne olursa olsun ışık %100 pürüzsüz ve sabit (titremesiz) dönmektedir.
23. **AI Asistan ve Anasayfa (Dashboard) Arayüz Sadeleştirmesi:**
    - **Dashboard Entegrasyonu:** Anasayfadaki (DashboardScreen) "Ai Asistan" şalteri doğrudan Supabase `bot_settings` tablosuyla (is_active) senkronize edildi. Artık anasayfadan yapılan aç/kapat işlemleri veritabanına yansıyor ve UI durumları anında güncelleniyor.
    - **Arayüz Sadeleştirmesi:** `BotYonetimiScreen.js` ekranında bulunan mükerrer Ai Asistan şalteri, "V2 Engine Aktif" rozeti ve sayfanın en altındaki kullanılmayan istatistik kutuları tamamen kaldırılarak arayüz daha temiz ve sadece asistanın "Kişilik/Üslup" ayarlarına odaklı hale getirildi. 
    - **UX Geliştirmeleri (Kaydet Butonu):** Kullanıcı, kişiliğini (İşletme Rolü, Karakter, Üslup) değiştirdiği anda beliren "Değişiklikleri Kaydet" butonu; sayfa düzeni akışında (AI Kişiliği -> İleri Seviye Ayarlar -> Değişiklikleri Kaydet -> Canlı Test) tam araya "inline" olarak yerleştirildi. Alt sekmenin (Tab Bar) arkasında kalma sorunu `useSafeAreaInsets` ile dinamik boşluk bırakılarak kökten çözüldü.

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

## 📱 Sosyal Medya Modülü: InboxScreen Yorum Mimarisi (Güncel)

> ⚠️ **ÖNEMLİ:** Bu bölümü okumadan `InboxScreen.js` veya `zernio-client` edge function'ına dokunmayın.

Sosyal medya modülü yorumlar sekmesi (`InboxScreen.js` → `YorumlarTab`), performans + veri tutarlılığı + silme kalıcılığı için aşağıdaki mimariye sahiptir.

---

### 3 Fazlı Yükleme Akışı

```
Uygulama açılır
    │
    ├─ FAZ 1 (~100ms): Yerel Supabase DB → Anında ekrana yansır
    │    ├─ AsyncStorage'daki zernio_pic_cache ile resimler uygulanır (6 günlük TTL)
    │    └─ deleted_comments filtresi çalışır (30 günlük TTL)
    │
    ├─ FAZ 1.5 (~2-3sn): get-inbox-pictures edge function çağrısı
    │    ├─ listInboxComments API'sinden post.picture URL'leri alınır
    │    ├─ post_<postId> anahtarıyla AsyncStorage'a yazılır
    │    └─ Mevcut liste zernio_post_id üzerinden güncellenir (flicker yok)
    │
    └─ FAZ 2 (~8-9sn, arka plan): sync-comments edge function çağrısı
         ├─ Yeni yorumlar DB'ye kaydedilir
         ├─ deleted_comments filtresi tekrar uygulanır (geri gelme yok!)
         └─ Resimler önbellekten atanır
```

### Realtime Olay Yönetimi (Döngü Koruması)

```
comments tablosu INSERT  →  fetchComments() tam çalışır (yeni yorum)
comments tablosu UPDATE  →  sadece o satır state'te güncellenir
                             fetchComments() ÇAĞRILMAZ → döngü riski SIFIR
```

Bu ayrım kritiktir: `sync-comments` DB'yi güncellediğinde `UPDATE` eventi tetikler. Eğer `UPDATE` da `fetchComments()` çağırılsaydı sonsuz döngü oluşurdu.

### Yorum Silme Kalıcılığı

Kullanıcı yorum sildiğinde üç katmanlı kalıcılık sağlanır:

1. **DB silme:** `supabase.from('comments').delete()` — UUID veya zernio_comment_id ile
2. **AsyncStorage kaydı:** `{id, deletedAt}` formatında her iki ID de yazılır:
   - `item.id` (local UUID veya zernio_comment_id)
   - `item.zernio_comment_id` (Zernio'dan gelecek aynı yorum için)
3. **Faz 2 filtresi:** sync-comments tamamlandığında `filteredLive` üretilirken deleted_comments listesi kontrol edilir

**30 günlük TTL:** `deletedAt` timestamp ile kaydedilir. 30 günden eski kayıtlar otomatik temizlenir.

### AsyncStorage Anahtarları

| Anahtar | Format | TTL | Açıklama |
|---------|--------|-----|---------|
| `zernio_pic_cache` | `{entries: {post_<id>: url}, cachedAt: timestamp}` | 6 gün | Post resim URL önbelleği |
| `deleted_comments` | `[{id: string, deletedAt: timestamp}]` | 30 gün | Silinen yorum ID'leri |

### Kritik ID Eşleştirme Kuralları

| Bağlam | Kullanılacak ID |
|--------|----------------|
| Supabase DB sorgusu | UUID (`comments.id`) |
| Zernio yorumunu eşleştir | `zernio_comment_id` |
| Gönderi resmini eşleştir | `zernio_post_id` → `post_<id>` önbellek anahtarı |
| ChatScreen route param | `localConversationId` (UUID) + `conversationId` (Zernio String ID) |

### Veritabanı Gereksinimleri

- `social_accounts.zernio_account_id` sütununda **UNIQUE constraint** zorunludur.
  - Migration: `supabase/migrations/20260629173000_social_accounts_unique_constraint.sql`
  - Bu olmadan `upsert(onConflict: 'zernio_account_id')` her çağrıda `42P10` hatası verir.
- `supabase_realtime` publication'a `comments` tablosunun eklenmiş olması gerekir:
  ```sql
  alter publication supabase_realtime add table comments;
  ```

---

## 📈 Temmuz 2026: Analiz (Analytics) & Sosyal Medya Optimizasyonları

Son yapılan geliştirmeler ile Zernio ve Sosyal Medya altyapısı genişletilmiş ve analiz modülü zenginleştirilmiştir:

1. **Sosyal Medya Kapsamı Genişletildi:** `SosyalMedyaScreen`'deki "Hesabınızı Ekleyin" sekmesine Zernio tarafından desteklenen tüm yeni nesil ağlar eklendi: TikTok, Google Business Profile (GBP), Pinterest, Reddit, Telegram, Bluesky, Threads, Snapchat, WhatsApp, Discord ve Reklam Platformları (Meta, Google, LinkedIn, TikTok, Pinterest, X Ads). Yeni eklenen tüm platform ikonları marka renkleriyle modernize edildi ve altlarına isim etiketleri eklendi.
2. **AI Paylaşım (AiUretimScreen) Desteği:** Yeni eklenen platformlar (TikTok, GBP, Pinterest, Reddit, Telegram vb.) için yapay zeka ile otomatik paylaşım yaparken seçilebilecek kutucuklar (checkbox) arayüze entegre edildi.
3. **Gelişmiş Analiz Ekranı (AnalyticsScreen):** 
   - Zernio Edge fonksiyonları üzerinden gelen veriler kullanılarak **Günlük İzlenme (Views) ve Beğeni (Likes)** verileri aynı grafik üzerinde (Multi-line chart) gösterilecek şekilde güncellendi.
   - **Takipçi Büyüme Geçmişi (Follower History):** Yeşil alan vurgulu yeni bir `LineChart` ile belirli tarih aralığındaki net takipçi kazanım ve kayıplarının anlık gösterimi sağlandı.
   - **Demografik Veri Altyapısı:** Instagram ve desteklenen ağlar için Pasta Grafik (Pie Chart) veri yapıları çoklu platformları destekleyecek şekilde optimize edildi.

---

## 🌐 Web Versiyonu İçin Yol Haritası (Web Version Roadmap)

AI Esnaf projesi halihazırda React Native (Expo) kullanılarak mobil odaklı (Native) geliştirilmiştir. Ancak Expo'nun web desteği (SPA) göz önüne alınarak projenin bir Web paneline dönüştürülmesi için aşağıdaki adımlar izlenmelidir:

### Faz 1: Web Uyumluluğu & Navigasyon
- **React Navigation Web Entegrasyonu:** Mevcut `AppNavigator` ve `TabNavigator` yapıları, `react-navigation`'ın web link (deep-linking) desteğiyle güncellenmelidir. (URL yapısı oluşturma).
- **Responsive Arayüz (Responsive Design):** NativeWind `v2` zaten web desteğine sahiptir. Ekranlardaki `w-full`, `flex-1` gibi yapıların büyük ekranlarda (`md:`, `lg:` prefix'leri kullanılarak) Sidebar + Content veya Grid yapısına bürünmesi sağlanmalıdır.
- **Glassmorphism Optimizasyonları:** Blur efektleri (`expo-blur`) mobil cihazlarda native çalışırken, web'de `backdrop-blur` CSS özelliklerine dönüştürülmelidir.

### Faz 2: Zernio ve Supabase Web Entegrasyonu
- **CORS Kuralları:** Edge fonksiyonları (`zernio-client`, `gemini-chat` vb.) şu anda CORS başlıklarına sahiptir ancak web'in çalışacağı domain (örn. `app.aiesnaf.com`) için `Access-Control-Allow-Origin` izinlerinin netleştirilmesi gerekir.
- **Zernio OAuth Redirect:** Mobil cihazlardaki OAuth dönüşleri Expo şeması (`aiesnaf://`) kullanmaktadır. Web versiyonu için Zernio geliştirici panelinden yeni bir Web Redirect URI tanımlanmalı ve Supabase Edge fonksiyonları buna göre yapılandırılmalıdır.

### Faz 3: Gelişmiş Web Özellikleri
- **Klavye Dinleyicileri İptali:** `ChatInputBar`'daki `react-native` klavye dinleyicileri (Keyboard) web üzerinde gereksizdir. Platform kontrolü (`Platform.OS === 'web'`) yapılarak bu mantıkların web ortamında bypass edilmesi gereklidir.
- **Drag & Drop (Sürükle-Bırak) Desteği:** Web panelinde fatura veya fiş yüklerken mobil kamera yerine HTML5 Drag & Drop API'sine uyumlu web component'leri eklenecektir.
- **Performans:** Web paketi (bundle) boyutunu azaltmak için rotaların (route) Lazy Loading (`React.lazy`) kullanılarak ayrıştırılması planlanmalıdır.

---

## 🌈 Gökkuşağı Yapısı (Rainbow RGB Border Architecture)

Uygulama içerisindeki özel AI kartlarının (örn. "AI Kişiliği" kartı) etrafındaki parlayan, ince neon gökkuşağı sınır çizgisi (border) CSS/Native Animated mantığıyla şu şekilde inşa edilmiştir:

**1. Çerçeve (Kapsayıcı - Container):**
- Kartın en dış sarmalayıcısına `overflow: 'hidden'` ve `padding: 2` (veya web için `3px - 4px` padding) verilir. Bu padding değeri, gökkuşağı çizginin kalınlığını belirler.
- Etrafına dışarı taşan mavi bir gölge (`shadowColor: '#00a2ff'`) eklenir.

**2. Dönen Dev RGB Işık Kaynağı (LinearGradient / ConicGradient):**
- Kapsayıcının tam ortasına (`top: 50%`, `left: 50%`), kart boyutundan çok daha büyük (örn. 300% veya 1500x1500px) bir Gradient yerleştirilir.
- Renk dizilimi saf gökkuşağı RGB'sidir: `['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ff0000']`.
- Bu devasa renk dalgası `4 saniyelik` sürekli (linear) bir döngüde kendi merkezi etrafında döndürülür (spin).

**3. Opak İç Zemin (Maskeleme):**
- Dönen renk dalgasının hemen üzerine (Z-index olarak üstüne), içi tamamen opak (`#1c1b1d`) olan asıl içerik kutusu yerleştirilir.
- İç kutu, dış kapsayıcıdan `padding` kadar küçük olduğu için (örn. `inset-[3px]` veya `borderRadius: 18`), dönen devasa ışık dalgası sadece bu 2-3 piksellik boşluktan sızar.
- Sonuç olarak: Işık kutunun etrafında yılan gibi kayarak dönen muhteşem bir RGB neon çizgi efekti yaratır.

### [16.08.2026] Son Güncellemeler (Gelen Kutusu Çoklu Seçim & Optimizasyon)
1. **Gelen Kutusu "Tümünü Seç" Özelliği:** Kullanıcılardan gelen talepler doğrultusunda, Gelen Kutusu (`InboxScreen.js`) çoklu seçim moduna "Tümünü Seç" butonu entegre edildi. Bu sayede Mesajlar, Yorumlar ve Değerlendirmeler sekmelerindeki tüm veriler tek dokunuşla seçilip kalıcı olarak silinebiliyor.
2. **Kalıcı Silme Politikası (RLS):** Yorum silme işlemlerinin sunucu bazlı kalıcı olması için veritabanındaki `comments` tablosuna Row Level Security (RLS) `DELETE` politikası (`auth.uid() = profile_id`) eklendi ve frontend `.delete().in()` metodolojisiyle uyumlu hale getirildi.

### [26.07.2026] Yapılan Son Güncellemeler
- **Veritabanı Uyumsuzlukları Giderildi:** `transactions` tablosundaki geçersiz `name` sütunu kod bazında temizlendi. AI Asistanın döndürdüğü `title`, `type` ve `status` alanlarının `SupabaseTransactionRepository` ve `TransactionMapper` tarafından sorunsuz işlenip veritabanına eklenmesi sağlandı. Veritabanındaki eski migration çakışmaları temizlendi.
- **OdemeTakvimiScreen Yeni Tasarım:** `OdemeTakvimiScreen`, grid yapısından "Neo-Fintech Noir" tarzı, dikey listeli ve Gelir/Gider olarak ikiye bölünmüş kart tasarımına geçirildi. Giderler kırmızı (`#ff3b30`), gelirler yeşil (`#22c55e`) olarak renklendirildi.
- **Filtreleme Mantığı Düzeltildi:** Takvim ekranında işlemlerin hem gelir hem gidere düşmesine neden olan `t.amount > 0` şartı kaldırılarak; `t.type === 'income'` / `'sales'` (gelir) ve `t.type === 'expense'` / `'ALIS'` (gider) kurallarıyla kesin bir ayrım yapıldı.
- **Gerçek Zamanlı Güncelleme:** `AiMuhasebeScreen` (Dashboard), `transactions` tablosuna yapılan eklemeleri de dinleyecek (realtime subscription) şekilde genişletildi ve `useFocusEffect` ile ekran açıldıkça verilerin anında güncellenmesi garantilendi.

## 28 Temmuz 2026 - Zernio/WAHA Hibrit Mimari Hazırlığı
- Sosyal Medya Asistanı yönetimi (toggle) BotYonetimiScreen'den SosyalMedyaScreen'e taşındı.
- Basic paket kullanıcıları için WAHA altyapısını besleyecek 'Asistan Talimatı Oluştur' adlı basit metin girişi eklendi.



## 📝 Son Geliştirme Günlüğü (9 Ağustos 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **Zernio AI Yanıt Hatası (Bug) Düzeltildi:** `HandleIncomingMessageUseCase.ts` içerisindeki ZernioClient fonksiyon çağrıları (sendMessage, likeComment, replyToComment) düzeltilerek `.inbox` ve `.comments` alt modüllerine yönlendirildi. Bu sayede AI'ın Instagram'a yanıt verememesi (TypeError) sorunu çözüldü.
2. **İletişim Raporları Senkronizasyonu:** `InboxScreen.js`'de silinen mesajların ve yorumların anasayfadaki (Dashboard) `ai_communication_logs` tablosundan da eş zamanlı olarak silinmesi sağlandı.
3. **Manuel Rapor Temizleme Butonu:** Dashboard üzerindeki `CommunicationLogsTable.js` bileşeninin altına, eski ve takılı kalmış raporları temizlemek için bir "Raporları Temizle" butonu eklendi. İşlemin çalışması için `useCommunicationLogs.ts` hook'una `clearLogs` fonksiyonu yazıldı.
4. **Supabase RLS Policy Eklendi:** `ai_communication_logs` tablosu için eksik olan DELETE yetkisi (Row Level Security), yeni bir SQL migration dosyası (`20260809223300_ai_communication_logs_delete_policy.sql`) oluşturularak canlı veritabanına push edildi.

## [14.08.2026] UI/UX Web Senkronizasyonu
Web platformu ile tam eşlenik görsel deneyim için Sosyal Medya ekranı baştan aşağı yenilendi. Standart marka ikonları (Ionicons) yerine Web'in estetik Emojileri (👥, 📸 vb.) getirildi. Kartlara %20 güçlendirilmiş yatay kaydırılabilir (Horizontal ScrollView) şık neon (glow) ve glassmorphism efekti entegre edildi. Dashboard 'Son Aktiviteler' ve 'İletişim Raporları' eşitlendi.

### [15.08.2026] Ã‡apraz Platform VeritabanÄ± Senkronizasyonu & Hata Giderimleri
1. **Ai Randevu (Web):** Ai Randevu YÃ¶netimi ekranÄ±ndaki takvim gÃ¼nleri yana kaydÄ±rÄ±labilir (drag-to-scroll) hale getirildi.
2. **Ortak VeritabanÄ± UyumsuzluÄŸu (406 HatasÄ±):** Dashboard ve AI Muhasebe (Web) ekranlarÄ±nda, organizasyon Ã¼yelerini Ã§eken .single() metotlarÄ± boÅŸ sonuÃ§ dÃ¶nebileceÄŸi iÃ§in 406 Not Acceptable hatasÄ± veriyordu. Bunlar gÃ¼venli olan .maybeSingle() ile deÄŸiÅŸtirildi ve sÄ±fÄ±r hata (No errors) durumuna ulaÅŸÄ±ldÄ±.
3. **Sosyal Medya Entegrasyonu (Web):** Web versiyonundaki "Hesap BaÄŸla" uyarÄ± mesajÄ± kaldÄ±rÄ±larak, mobil versiyondaki Supabase Edge Function (zernio-client) tabanlÄ± gÃ¼venli Instagram/Zernio yetkilendirme linki alma ve yÃ¶nlendirme sistemi web versiyonuna entegre edildi.
4. **Gelen Kutusu (Web):** Gelen Kutusu (/gelen-kutusu) ekranÄ±ndaki comments tablosu sorgusunda yer alan geÃ§ersiz posts iliÅŸkisi (posts(media_urls, title)) kaldÄ±rÄ±larak sadece .select('*') bÄ±rakÄ±ldÄ± ve "400 Bad Request" hatasÄ± giderildi. TÃ¼m iletiÅŸim raporlarÄ± sÄ±fÄ±r hata ile yÃ¼klenebilir hale geldi.
5. **Agent KurallarÄ±:** Web ve Mobil projelerin kalÄ±cÄ± hafÄ±zasÄ±na (AGENTS.md) Ã§apraz veritabanÄ± etkileÅŸimi hakkÄ±nda yeni "ğŸš¨ Kritik Kural: Ortak VeritabanÄ± EtkileÅŸimi" kuralÄ± iÅŸlendi.

### [16.08.2026] UI Fixes & Veri Senkronizasyonu Hata Giderimi
1. **Gelen Kutusu (InboxScreen) Silinen Yorumlar Senkronizasyonu:** Silinen yorumlarin veritabani realtime sync dongusu nedeniyle geri gelmesi sorunu tamamen kalici olarak cozuldu. Silinen zernio_comment_id'ler i_communication_logs tablosunda zernio_deleted_comment logu olarak isaretlenip her fazda filtrelenmesi saglandi.
2. **Klavye Tasmasi ve Alt Bosluk Fixleri:** ChatScreen ve PostCommentsScreen ekranlarindaki TextInput klavye ve iOS/Android alt gezinme cubugu cakismasi SafeAreaView'a ottom margin eklenerek fixlendi. InboxScreen'deki yorum ve mesaj listelerine ise paddingBottom: 160 degeri atanarak ekran doldugunda liste sonlarinin altta ezilmesi / gizli kalmasi onlendi.

### [16.08.2026] Sosyal Medya Optimizasyonları (Post Silme ve Zamanlama)
1. **Workigom Flow Özel Silme Modalı:** Web tarafındaki "Sadece panelden sil" veya "Platformlardan da sil" şeklindeki Zernio stili şık modal tasarımı, mobil uygulamanın `PostsScreen.js` ekranına entegre edildi. Silinen gönderiler için veritabanında "soft-delete" (`status = 'deleted'`) mantığı kullanıldı ve veri kaybı önlendi.
2. **Dinamik Zamanlama ve Timezone (Zernio SDK):** Zamanlanmış (Scheduled) gönderiler seçildiğinde tarih alanı artık sabit değil; kullanıcının anlık tarihi + 10 dakika olacak şekilde dinamikleşti. Zernio'nun Timezone (Saat Dilimi) desteği Web (`share/page.tsx`) ve Mobil (`AiUretimScreen.js`) uygulamalara Dropdown menüsü ile eklendi. Seçilen IANA Timezone değeri, `zernio-client` edge function üzerinden Zernio API'ye (Node SDK) başarılı bir şekilde iletilerek hassas gönderi planlaması sağlandı.

### [17.08.2026] Gelen Kutusu Profil Resmi ve Private Reply (Gizli DM) Entegrasyonu
1. **Eksik Profil Resimleri:** Gelen kutusu mesajlarinda Zernio'dan gelen participantPicture verisi edge function (zernio-client) uzerinden dogru sekilde haritalandirildi. Fotograf olmayan kullanicilar icin ui-avatars.com altyapisi ile fallback jenerik bas harf logolari eklendi.
2. **Aninda Silme (Optimistic UI):** Mesaj ve yorumlar silindiginde sayfayi yenilemeye gerek kalmadan arayuzden (UI) aninda kaybolmasini saglayan optimistic state guncellemeleri entegre edildi.
3. **Yorum Yanitlarinda Ciftlesme (Duplicate) Hatasi:** UI uzerinden yoruma yanit verildiginde Zernio API'den donen gercek yorum ID'si optimistic UI insert isleminde kullanilarak Zernio Webhook'un ikinci bir kopya olusturmasi ve yanitlarin akordiyon yapi yerine bagimsiz kart olarak uste dusmesi (gruplanamamasi) sorunu %100 cozuldu.
4. **Yorum uzerinden DM gonderme (Private Reply):** Yorum yapan ve daha once hic mesajlasilmamis kullanicilara Zernio SDK'nin private-reply yetenegi kullanilarak yorum uzerinden dogrudan DM gonderebilme altyapisi kuruldu. Bunun icin ozel bir modal arayuzu kodlandi.

### [18.08.2026] Zernio Private Reply (Gizli DM) 24 Saat Kuralı Optimizasyonu
1. **Web ve Mobil Private Reply Senkronizasyonu:** Yorumlara DM gönderilirken geçmiş bir sohbet bulunduğunda sistemin standart 'send-message' yöntemine (Instagram'ın 24 saat aktif konuşma kuralına) takılıp hata vermesi sorunu çözüldü. Artık her iki platformda da bir yorumdan DM butonuna basıldığında geçmişe bakılmaksızın doğrudan (24 saat kuralını delen) 'send-private-reply' metodu tetiklenmektedir. Mobil (React Native) uygulamaya da web versiyonu ile aynı olan satıriçi (inline) Özel Yanıt gönderme yeteneği entegre edildi.

### [22.08.2026] Dashboard Yapay Zeka Veri Bağlantıları ve Profil Senkronizasyonu
1. **Flow Web ve Mobil (React Native) Dashboard Güncellemeleri:** AI Asistan günlük özet kutusundaki ve Sosyal Medya etkileşim trendindeki görsel amaçlı sahte veriler (mock data) kaldırıldı.
2. **Gerçek Veritabanı ve Zernio API Entegrasyonu:** Flow projelerinde mesaj/yorum istatistikleri ve yaklaşan randevular doğrudan ilgili Supabase tablolarına; sosyal medya etkileşim büyümesi ise Zernio üzerinden gerçek verilere bağlandı.
3. **Ledger Web Profil Yedekleme (Fallback) Sistemi:** Ledger uygulamasında, "Profil Bilgilerim" ekranının form alanlarında veritabanı boş olsa dahi (authorized_person, avatar_url) Google (OAuth) session'ından gelen verileri (user_metadata) varsayılan olarak göstermesi ve düzgün senkronize olması sağlandı.
