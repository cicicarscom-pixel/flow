# AI Esnaf — Agent Kuralları ve Proje Hafızası

## 🚨 Kritik Kural: Ortak Veritabanı Etkileşimi (Web & Mobil)

**Web ve Mobil versiyonlar AYNI (Supabase) veritabanını paylaşmaktadır.** 
- Web tarafında bir veritabanı (şema, tablo, edge function) veya query değişikliği yaptığınızda, bunun Mobil (React Native) uygulamasını da doğrudan etkileyeceğini ve bozabileceğini DAİMA hesaba katın.
- Herhangi bir API metodolojisi (`.single()` vb.) veya veri modeli değişikliği yapmadan önce, bunun her iki platformdaki koda nasıl yansıyacağını kontrol edin.

## 🚨 Kritik Kural: Expo SDK

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## 🚨 Kritik Kural: Belgelendirme Zorunluluğu (README)

**Yapılan ve eklenen her yeni özellik, hata düzeltmesi veya mimari değişiklik KESİNLİKLE ilgili projenin (mobil için flow/README.md, web için flowweb/README.md) `Son Güncellemeler` bölümüne tarih ve detay belirterek yazılmalıdır.**
- Yeni eklenen bir özelliği koda dahil ettikten hemen sonra, commit işleminden önce README dosyalarını güncelleyin.

---

## 🚨 Kritik Kural: Dependency Injection

**`tsyringe` KULLANILMAMAKTADIR ve kullanılMAYACAKTIR.**

- `@injectable()`, `@inject()`, `reflect-metadata` → **KESİNLİKLE YASAK**
- Hermes JS Engine bu dekoratörleri desteklemez → Build patlar
- Tüm bağımlılıklar `src/core/container.ts` içindeki **manuel singleton** sistemiyle yönetilir

### Yeni servis/repository eklemek için:

```typescript
// 1. src/core/container.ts içinde singleton oluştur
const myNewRepository = new MyNewRepository();

// 2. resolve() switch'ine ekle (string key veya class ref ile)
if (cls === 'MyNewRepository') return myNewRepository;
if (cls === MyNewUseCase) return myNewUseCase;
```

---

## 🏗️ Mimari Yapı

### Proje Teknolojileri

- **Frontend**: React Native 0.86, Expo SDK 57, React 19, React Navigation v7
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **Auth**: Supabase Auth + AsyncStorage
- **DI**: Manuel container (`src/core/container.ts`) — tsyringe YOK
- **Stil**: NativeWind v2 + Tailwind CSS v3, StyleSheet + Glassmorphism, renk paleti `#131315` (bg) / `#4edea3` (primary)

### Katman Kuralları (Clean Architecture)

```
Domain  ← Application ← Infrastructure ← Presentation
```

- **Domain**: Sadece saf TypeScript. React/Supabase import YOK.
- **Application**: UseCase'ler. Sadece interface'lere bağımlı, concrete class import YOK.
- **Infrastructure**: Supabase, WAHA, Zernio implementasyonları.
- **Presentation**: React Native ekranları ve hook'lar. Container üzerinden UseCase çağırır.

### Modül Yapısı

```
src/
├── core/
│   ├── container.ts          — Manuel DI container (singleton'lar burada)
│   └── navigation/
│       ├── AppNavigator.js   — Root navigator
│       └── TabNavigator.js   — Tab bar + nested stacks
│
├── shared/
│   ├── lib/supabase.js       — Supabase client (createClient)
│   ├── errors/               — AppError, NetworkError, ValidationError...
│   └── ui/                   — Paylaşılan UI bileşenleri
│
└── modules/
    ├── randevu/              — 📅 Randevu yönetimi
    ├── muhasebe/             — 💰 AI muhasebe
    └── sosyal_medya/         — 📱 Bot yönetimi + sosyal medya
```

---

## 📅 Randevu Modülü — Hafıza Notları

### Ekranlar ve Navigasyon

```
BotYonetimiScreen
  └─► RandevuScreen        (stack: "RandevuMain")
        └─► HizmetAyarlariScreen  (stack: "HizmetAyarlari")
```

Navigasyon: `TabNavigator.js` içindeki `BotYonetimiStack` altında tüm 3 ekran tanımlı.

### RandevuScreen Özellikleri

- `stickyHeaderIndices={[0]}` — Calendar + Heatmap her zaman ekranda sabit
- Takvim şeridi: yatay kaydırılabilir, seçili gün yeşil/büyük
- Heatmap: 3 satır (Sabah/Öğle/Akşam), 30 dakikalık slotlar, tüm satırlar birlikte kayar
- Timeline: `useAppointments` hook'undan gelen gerçek DB verisi
- FAB: Nabız atan animasyonlu `+` butonu (tab bar + insets üzerinde)

### useAppointments Hook (src/modules/randevu/presentation/hooks/useAppointments.ts)

```typescript
const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate } = useAppointments();
```

- `container.resolve('AppointmentRepository')` ile repo alır
- `selectedDate` değişince `getAppointmentsByDate()` çeker
- `subscribeToAppointments()` ile Realtime dinler, unmount'ta temizler
- `isSlotBusy(timeSlot: string)` → o saatte Pending/Approved randevu var mı?
- `extractTime(dateStr)` — ISO/space-separated datetime'dan "HH:MM" çıkarır

### SupabaseAppointmentRepository Metodları

| Metod | Açıklama |
|-------|----------|
| `create()` | Yeni randevu oluştur |
| `approve(id)` | Randevu onayla |
| `cancel(id)` | Randevu iptal et |
| `findByToken(token)` | Token ile randevu bul |
| `findAvailableHours(date, serviceId)` | Müsait saatleri listele |
| `getAppointmentsByDate(date)` | Güne göre randevuları çek |
| `subscribeToAppointments(date, cb)` | Realtime dinle, unsubscribe fn döner |

### Supabase Realtime

- Table: `appointments`
- Publication: `supabase_realtime` — appointments tablosu ekli olmalı
- Filter: `date=eq.${date}` — sadece seçili günün değişikliklerini dinler
- Her event'te tüm liste yeniden çekilir (tutarlılık garantisi için)

---

## 🎨 Tasarım Sistemi

### Renk Paleti (Dark Theme)

```
Background:   #131315
Surface:      rgba(32,31,34,0.4)  (glassmorphism)
Primary:      #4edea3  (yeşil vurgu)
On-Primary:   #003824
Secondary:    #ffb95f  (turuncu)
Tertiary:     #c0c1ff  (mor)
On-Surface:   #e5e1e4
Muted:        #bbcabf
Border:       rgba(60,74,66,0.2)
```

### Glassmorphism Kart Stili

```javascript
{
  backgroundColor: 'rgba(32,31,34,0.4)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.05)',
  borderRadius: 14,
  // iOS shadow:
  shadowColor: '#4edea3', shadowOpacity: 0.2, shadowRadius: 8,
  // Android:
  elevation: 4,
}
```

### FAB Konumlandırma (Tab Bar Üstünde)

```javascript
const insets = useSafeAreaInsets();
const tabBarBottom = Math.max(insets.bottom + 10, 20);
const tabBarHeight = 64;
const fabBottom = tabBarBottom + tabBarHeight + 14;
// fab: { position: 'absolute', bottom: fabBottom, right: 18 }
```

---

## 🔐 Supabase Yapılandırması

### Client (src/shared/lib/supabase.js)

```javascript
import 'react-native-url-polyfill/auto';      // ZORUNLU — React Native'de URL.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } }
);
```

### .env Değişkenleri

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## ⚠️ Bilinen Sorunlar ve Çözümleri

| Sorun | Çözüm |
|-------|-------|
| `TypeInfo not known for "X"` | tsyringe kalıntısı var. `container.resolve(X)` ile resolve et, `@injectable` kaldır |
| `declare class` TypeScript hatası | Babel TypeScript plugin sırası sorunu. `tsyringe` kaldır, `reflect-metadata` import etme |
| `Element type is invalid: got undefined` | Named/default export karışıklığı. Component export'larını kontrol et |
| `SafeAreaView has been deprecated` | `react-native-safe-area-context`'ten import et, `react-native`'den değil |
| FAB tab bar'ın altında kalıyor | `useSafeAreaInsets` kullan, hardcoded bottom değeri verme |
| Realtime çalışmıyor | Supabase panelinde `supabase_realtime` publication'a tabloyu ekle |

---

## 🧭 Navigasyon Yapısı

```
App.js
└── AppNavigator (Stack)
    ├── AuthScreen
    └── TabNavigator (Bottom Tabs)
        ├── Tab: Dashboard
        ├── Tab: Muhasebe → AiMuhasebeScreen
        ├── Tab: BotYonetimi (BotYonetimiStack)
        │   ├── BotYonetimiScreen    ("BotYonetimiMain")
        │   ├── RandevuScreen        ("RandevuMain")
        │   └── HizmetAyarlariScreen ("HizmetAyarlari")
        └── Tab: SosyalMedya
```

---

## 📦 Önemli Paketler

```json
{
  "expo": "~56.0.x",
  "react-native": "0.76.x",
  "@react-navigation/native": "^7.x",
  "@react-navigation/bottom-tabs": "^7.x",
  "@react-navigation/native-stack": "^7.x",
  "@supabase/supabase-js": "^2.x",
  "expo-blur": "~14.x",
  "@expo/vector-icons": "^14.x",
  "react-native-safe-area-context": "^5.x",
  "react-native-url-polyfill": "^2.x"
}
```

---

## 📝 Son Geliştirme Günlüğü (25 Temmuz 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **Paket Temizliği:** `tsyringe`, `reflect-metadata` ve gereksiz Babel decorator plugin'leri `package.json`'dan kaldırıldı.
2. **Konfigürasyon Temizliği:** `tsconfig.json` dosyasındaki `experimentalDecorators` ve `emitDecoratorMetadata` flag'leri kaldırıldı.
3. **Dokümantasyon Senkronizasyonu:** AGENTS.md dosyası mevcut teknoloji yığınına (Expo 57 / RN 0.86 / React 19) göre güncellendi.
4. **Mimari Düzenlemeler:** Eksik `index.ts` dosyaları (randevu, persona_engine, business-profile) oluşturuldu. BotYonetimiScreen'deki derin (deep) import kural ihlalleri barrel export üzerinden tek satıra indirgendi.
5. **Container Bağlantıları:** Eksik olan `wahaService` ve `transactionRepository` container DI sistemine resolve olarak eklendi. `container` nesnesi `core/index.ts` üzerinden dışa aktarıldı.

---

## 📝 Geçmiş Geliştirme Günlüğü (5 Temmuz 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **Zernio Client ve Analytics Cache Güncellemesi:** Supabase Edge Functions altındaki `ZernioClient.ts` dosyası güncellenerek sosyal medya platformları (YouTube, LinkedIn, Instagram, Google Business, vb.) için analytics metotları önbellekleme (cache) desteği ile entegre edildi.
2. **Hata Yönetimi ve Silme İşlemi:** Zernio hesabını ayırma (`disconnect-account`) işlemi doğrudan ZernioClient içindeki metoda bağlandı.
3. **Veritabanı Migration'ı:** Analytics cache için yeni bir Supabase veritabanı migration'ı (`20260705000000_analytics_cache.sql`) oluşturuldu.
4. **Bağımlılıklar:** `package.json` ve `package-lock.json` dosyaları güncellendi.

---

## 📝 Geçmiş Geliştirme Günlüğü (27 Haziran 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **GitHub Senkronizasyonu:** Local `master` dalı `origin/master` ile güncel olmasına rağmen en son güncellemelerin (Randevu Realtime, RAG Drive senkronizasyonu, dual prompt ve RGB border) `origin/main` dalında olduğu fark edildi. Local repo `main` dalına geçirilerek güncel kod çekildi.
2. **Randevu Modülü i18n:** `RandevuScreen.js` ve `HizmetAyarlariScreen.js` ekranlarındaki tüm hardcoded Türkçe kelimeler temizlenerek `tr.json`, `en.json` ve `de.json` dosyalarına bağlandı. `useTranslation` hook'u ile dinamik yerelleştirme tamamlandı.
3. **Animated Ref Render Erişimi Çözüldü:** `RandevuScreen.js` ve `AiUretimScreen.js`'deki Animated Value'ların render esnasında ref üzerinden `.current` olarak okunması nedeniyle linter'ın fırlattığı `Cannot access refs during render` hatası, `useState` tabanlı `Animated.Value` tanımlamasına geçilerek tamamen çözüldü.
4. **TypeScript Path Aliases & Anti-Bypass Entegrasyonu:** `tsconfig.json` dosyasında `@domain/*`, `@application/*`, `@infrastructure/*` ve `@presentation/*` alias'larına `randevu` modülü dahil edildi. Projedeki tüm relative path import'lar path alias'larına geçirilerek ESLint'in `no-restricted-imports` (Anti-Bypass) kuralı yeşile çekildi.
5. **Kapsamlı Linter Kontrolü:** `npm run lint` çalıştırılarak tüm 42 hata giderildi ve linter **0 hata** ile tamamlandı.
6. **Sistem Talimatı Kartına Gök Mavisi Neon Çerçeve ve Dönen Aura Gölgesi Entegrasyonu:** 
    - `BotYonetimiScreen.js` içindeki Sistem Talimatı kartına, kartın tüm kenarlarını eşit kalınlıkta kaplayan (`borderWidth: 1.5`) solid `#00a2ff` (gök mavisi) renginde sürekli parlayan neon bir sınır çizgisi uygulandı.
    - **Dönen Aura Gölgesi (blue_glow):** Yumuşak geçişli gök mavisi, lacivert ve turkuaz tonlarından oluşan dairesel bir conic gradient resim (`blue_glow.png`) üretildi. Bu resim kartın arkasına yerleştirilerek native `blurRadius={12}` ile bulanıklaştırıldı ve 8 saniyelik lineer bir döngüde dönen bir `Animated.View` ile döndürülerek kart etrafında dönen/dolaşan hareketli bir mavi aura gölgesi elde edildi.
    - **Yuvarlatılmış Köşeler ve Boşluk Düzenlemesi:** Ana `ScrollView` bileşenine `contentContainerStyle={{ paddingHorizontal: 16 }}` uygulanarak kartların ekran kenarlarına yapışması önlendi ve mavi çizginin `borderRadius: 20` olan yuvarlatılmış köşeleri görünür kılındı.
    - **İç Çerçeve/Siyah-Gri Gölge Sızıntısının Önlenmesi (Solid Background):** Kartın arka planı yarı saydam yerine tamamen opak koyu gri (`#1c1b1d`) olarak güncellendi. Bu sayede Android shadow motorunun `elevation` nedeniyle kartın arkasında oluşturduğu koyu sistem gölgesinin cam katmanın içinden sızarak mavi çizginin altında ikinci bir koyu çerçeve oluşturması (shadow bleed-through) engellendi.
    - Kart içi hazır rol preset butonlarının aktif kenarlık/yazı renkleri de turkuazdan `#00a2ff` (gök mavisi) tonuna güncellenerek görsel uyum tamamlandı.
    - "AI Karakter Talimatı" (`botInstruction`) kutusu `height: 280` olarak (eski 140px değerinden 2 kat daha büyük) sabitlendi ve `showsVerticalScrollIndicator={true}` eklenerek yapıştırılan uzun metinlerde kutunun büyümesi önlenip yan kaydırma çubuğu ile gezilebilmesi sağlandı.















---

## 📅 AI Muhasebe — Hafıza Notları (18 Temmuz 2026)

### 1. 4 Fazlı AI Fatura Entegrasyonu Mimari Kararları
Flow (Mükellef) ile Ledger (Müşavir) arasındaki entegrasyon için 4 fazlı akış kabul edildi:
1. **Veri Yakalama (Flow):** Fatura fotoğrafı/PDF'i yüklenir, Gemini AI JSON olarak veriyi ayrıştırır.
2. **Proaktif Chat (Flow):** AI mükellefe faturanın türüne göre soru sorar:
   - Alış Faturası: "Ödendi mi?" (Evet/Hayır) -> Hayır ise "Tarih?"
   - Satış Faturası: "Tahsil edildi mi?" (Evet/Hayır) -> Hayır ise "Tarih?"
3. **Draft Kuyruğu (Flow -> Backend):** Veriler doğrudan \	ransactions\ tablosuna yazılmaz. Yeni oluşturulan \submit-accounting-draft\ Edge Function'ı ile \ccounting_drafts\ tablosuna "pending_approval" statüsü ile iletilir. Mobil uygulamanın doğrudan DB yazma yetkisi (RLS) kısıtlandı.
4. **Müşavir Onayı (Ledger):** Müşavir kendi ekranında bu draft'ları Split-View (Görsel + Data) olarak inceler, onaylayarak \	ransactions\ tablosuna aktarır.

### 2. Türkiye (TR-TR) Fatura Ayrıştırma Şeması Kesin Kuralları
- **Düz (Flat) JSON:** İç içe obje kullanılmayacak. Tüm KDV ve matrah alanları (1, 8, 10, 18, 20) doğrudan \at1Base\, \at1Amount\ şeklinde döndürülecek. Bulunmayan veriler \ \ (sıfır) olacak, \
ull\ veya boş string dönülmeyecek.
- **İşlem Yönü (\invoiceType\):** Belgedeki alıcı/satıcı VKN'si ile Flow kullanıcısının (işletmenin) VKN'si karşılaştırılacak. İşletme alıcıysa \purchase_invoice\, satıcıysa \sales_invoice\ dönecek.
- **Açıklama (\description\):** Sadece karşı tarafın firma adı kullanılacak. Ürün, hizmet, işlem özeti uydurulmayacak veya eklenmeyecek.
- **Tevkifat:** Varsa aynen "1/10" gibi string olarak yazılacak.
- **Matematiksel Uyum:** Uyuşmazlık durumunda veriler değiştirilmeyecek, JSON içindeki \eviewFlags\ dizisine \AMOUNT_MISMATCH\ eklenecek.

### [26.07.2026] Yapılan Son Güncellemeler
- **Veritabanı Uyumsuzlukları Giderildi:** `transactions` tablosundaki geçersiz `name` sütunu kod bazında temizlendi. AI Asistanın döndürdüğü `title`, `type` ve `status` alanlarının `SupabaseTransactionRepository` ve `TransactionMapper` tarafından sorunsuz işlenip veritabanına eklenmesi sağlandı. Veritabanındaki eski migration çakışmaları temizlendi.
- **OdemeTakvimiScreen Yeni Tasarım:** `OdemeTakvimiScreen`, grid yapısından "Neo-Fintech Noir" tarzı, dikey listeli ve Gelir/Gider olarak ikiye bölünmüş kart tasarımına geçirildi. Giderler kırmızı (`#ff3b30`), gelirler yeşil (`#22c55e`) olarak renklendirildi.
- **Filtreleme Mantığı Düzeltildi:** Takvim ekranında işlemlerin hem gelir hem gidere düşmesine neden olan `t.amount > 0` şartı kaldırılarak; `t.type === 'income'` / `'sales'` (gelir) ve `t.type === 'expense'` / `'ALIS'` (gider) kurallarıyla kesin bir ayrım yapıldı.
- **Gerçek Zamanlı Güncelleme:** `AiMuhasebeScreen` (Dashboard), `transactions` tablosuna yapılan eklemeleri de dinleyecek (realtime subscription) şekilde genişletildi ve `useFocusEffect` ile ekran açıldıkça verilerin anında güncellenmesi garantilendi.

## 📝 Geçmiş Geliştirme Günlüğü (28 Temmuz 2026) - WAHA/Zernio Ayrımı & Zernio Medya Optimizasyonu
### Yapılan Değişiklikler ve Mimari Kararlar:
1. **Zernio Medya Yükleme Optimizasyonu (Backend):** Ai_muhasebeci/supabase içindeki zernio-client edge fonksiyonu, resimleri base64/url olarak göndermek yerine Zernio Media API'sine yükleyip 'mediaIds' dizisi ile gönderecek şekilde optimize edildi.
2. **Zernio Fallback Cron (Backend):** Her gece 03:00'da kaçırılan Zernio mesajlarını/yorumlarını eşitlemek için 'pg_cron' kullanan yeni bir Supabase SQL migration dosyası oluşturuldu.
3. **Abonelik Mimarisine Hazırlık (Sosyal Medya Asistanı):** Basic (Sadece WhatsApp/WAHA) ve Premium (Tam sosyal medya/Zernio) paket ayrımı kararı alındı. Bu kapsamda 'Sosyal Medya Asistanı' şalteri, BotYonetimiScreen ekranından sökülerek doğrudan SosyalMedyaScreen ekranına taşındı.
4. **WAHA Temel Talimat Alanı:** BotYonetimiScreen içerisine kilitli olmayan (Basic pakete açık) 'Asistan Talimatı Oluştur' metin kutusu eklendi. Buraya girilen değer doğrudan Custom Role (Özel Karakter) olarak WAHA system_instruction'ına beslenmek üzere bağlandı.


## 📝 Son Geliştirme Günlüğü (9 Ağustos 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **Zernio AI Yanıt Hatası (Bug) Düzeltildi:** `HandleIncomingMessageUseCase.ts` içerisindeki ZernioClient fonksiyon çağrıları (sendMessage, likeComment, replyToComment) düzeltilerek `.inbox` ve `.comments` alt modüllerine yönlendirildi. Bu sayede AI'ın Instagram'a yanıt verememesi (TypeError) sorunu çözüldü.
2. **İletişim Raporları Senkronizasyonu:** `InboxScreen.js`'de silinen mesajların ve yorumların anasayfadaki (Dashboard) `ai_communication_logs` tablosundan da eş zamanlı olarak silinmesi sağlandı.
3. **Manuel Rapor Temizleme Butonu:** Dashboard üzerindeki `CommunicationLogsTable.js` bileşeninin altına, eski ve takılı kalmış raporları temizlemek için bir "Raporları Temizle" butonu eklendi. İşlemin çalışması için `useCommunicationLogs.ts` hook'una `clearLogs` fonksiyonu yazıldı.
4. **Supabase RLS Policy Eklendi:** `ai_communication_logs` tablosu için eksik olan DELETE yetkisi (Row Level Security), yeni bir SQL migration dosyası (`20260809223300_ai_communication_logs_delete_policy.sql`) oluşturularak canlı veritabanına push edildi.

### [11.08.2026] Bildirimler Ekranı & AI Bildirim Altyapısı (Flow)
1. **Bildirimler UI/UX:** Glassmorphism tasarım stili ile \BildirimlerScreen.js\ oluşturuldu ve \AppNavigator\'a eklendi.
2. **Dinamik Çan İkonu:** \DashboardScreen\ üst menüsündeki bildirim çanı, veritabanından okunmamış bildirim sayısını alıp kırmızı bir rozet gösterecek şekilde güncellendi.
3. **Gerçek Zamanlı Silme & Okuma:** Kullanıcılar bildirimleri okuyabilir veya çöpe atıp Supabase'den silebilirler.
4. **AI Bildirim Entegrasyonu:** Ledger tarafındaki yapay zeka asistanının isme veya profile özel anında in-app bildirim atabilmesini sağlayan veritabanı altyapısı ve araçlar tamamlandı.


### [14.08.2026] Web ve Mobil Platform UI/UX Senkronizasyonu
1. **Mobil Arayüz Web ile Eşitlendi:** Web versiyonunda bulunan şık, cam görünümlü yatay kaydırılabilir (horizontal) Sosyal Medya hesap kartları, aynen Flow mobil (React Native) uygulamasına uyarlandı.
2. **Emoji İkonlar ve Glow Efekti:** Standart marka ikonları iptal edildi; yerine Web versiyonunda kullanılan emojiler (👥, 📸 vb.) getirildi ve kart etrafındaki neon parlama (glow) efekti %20 oranında güçlendirilerek çok daha estetik bir görünüm elde edildi.
3. **Dashboard Paritesi:** Web tarafındaki eski paneller temizlenip, güncel 'Son Aktiviteler' ve 'İletişim Raporları' Web Dashboard'a dahil edilerek Mobil ekranla tam senkron sağlandı.

### [15.08.2026] Ã‡apraz Platform VeritabanÄ± Senkronizasyonu & Hata Giderimleri
1. **Ai Randevu (Web):** Ai Randevu YÃ¶netimi ekranÄ±ndaki takvim gÃ¼nleri yana kaydÄ±rÄ±labilir (drag-to-scroll) hale getirildi.
2. **Ortak VeritabanÄ± UyumsuzluÄŸu (406 HatasÄ±):** Dashboard ve AI Muhasebe (Web) ekranlarÄ±nda, organizasyon Ã¼yelerini Ã§eken .single() metotlarÄ± boÅŸ sonuÃ§ dÃ¶nebileceÄŸi iÃ§in 406 Not Acceptable hatasÄ± veriyordu. Bunlar gÃ¼venli olan .maybeSingle() ile deÄŸiÅŸtirildi ve sÄ±fÄ±r hata (No errors) durumuna ulaÅŸÄ±ldÄ±.
3. **Sosyal Medya Entegrasyonu (Web):** Web versiyonundaki "Hesap BaÄŸla" uyarÄ± mesajÄ± kaldÄ±rÄ±larak, mobil versiyondaki Supabase Edge Function (zernio-client) tabanlÄ± gÃ¼venli Instagram/Zernio yetkilendirme linki alma ve yÃ¶nlendirme sistemi web versiyonuna entegre edildi.
4. **Gelen Kutusu (Web):** Gelen Kutusu (/gelen-kutusu) ekranÄ±ndaki comments tablosu sorgusunda yer alan geÃ§ersiz posts iliÅŸkisi (posts(media_urls, title)) kaldÄ±rÄ±larak sadece .select('*') bÄ±rakÄ±ldÄ± ve "400 Bad Request" hatasÄ± giderildi. TÃ¼m iletiÅŸim raporlarÄ± sÄ±fÄ±r hata ile yÃ¼klenebilir hale geldi.
5. **Agent KurallarÄ±:** Web ve Mobil projelerin kalÄ±cÄ± hafÄ±zasÄ±na (AGENTS.md) Ã§apraz veritabanÄ± etkileÅŸimi hakkÄ±nda yeni "ğŸš¨ Kritik Kural: Ortak VeritabanÄ± EtkileÅŸimi" kuralÄ± iÅŸlendi.
