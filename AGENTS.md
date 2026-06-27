# AI Esnaf — Agent Kuralları ve Proje Hafızası

## 🚨 Kritik Kural: Expo SDK

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

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

- **Frontend**: React Native, Expo SDK 56, React Navigation
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **Auth**: Supabase Auth + AsyncStorage
- **DI**: Manuel container (`src/core/container.ts`) — tsyringe YOK
- **Stil**: StyleSheet + Glassmorphism, renk paleti `#131315` (bg) / `#4edea3` (primary)

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

## 📝 Son Geliştirme Günlüğü (27 Haziran 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **GitHub Senkronizasyonu:** Local `master` dalı `origin/master` ile güncel olmasına rağmen en son güncellemelerin (Randevu Realtime, RAG Drive senkronizasyonu, dual prompt ve RGB border) `origin/main` dalında olduğu fark edildi. Local repo `main` dalına geçirilerek güncel kod çekildi.
2. **Randevu Modülü i18n:** `RandevuScreen.js` ve `HizmetAyarlariScreen.js` ekranlarındaki tüm hardcoded Türkçe kelimeler temizlenerek `tr.json`, `en.json` ve `de.json` dosyalarına bağlandı. `useTranslation` hook'u ile dinamik yerelleştirme tamamlandı.
3. **Animated Ref Render Erişimi Çözüldü:** `RandevuScreen.js` ve `AiUretimScreen.js`'deki Animated Value'ların render esnasında ref üzerinden `.current` olarak okunması nedeniyle linter'ın fırlattığı `Cannot access refs during render` hatası, `useState` tabanlı `Animated.Value` tanımlamasına geçilerek tamamen çözüldü.
4. **TypeScript Path Aliases & Anti-Bypass Entegrasyonu:** `tsconfig.json` dosyasında `@domain/*`, `@application/*`, `@infrastructure/*` ve `@presentation/*` alias'larına `randevu` modülü dahil edildi. Projedeki tüm relative path import'lar path alias'larına geçirilerek ESLint'in `no-restricted-imports` (Anti-Bypass) kuralı yeşile çekildi.
5. **Kapsamlı Linter Kontrolü:** `npm run lint` çalıştırılarak tüm 42 hata giderildi ve linter **0 hata** ile tamamlandı.
6. **Sistem Talimatı Kartına Mavi Neon Çerçeve ve Belirgin Aura Gölge Entegrasyonu:** 
    - `BotYonetimiScreen.js` içindeki Sistem Talimatı kartına, hareketli olmayan, kartın tüm kenarlarını eşit kalınlıkta kaplayan (`borderWidth: 1.5`) solid `#00f0ff` (mavi/cyan) renginde sürekli parlayan neon bir sınır çizgisi uygulandı.
    - Kartın arkasına `shadowColor: '#00f0ff'`, `shadowOpacity: 0.8`, `shadowRadius: 18`, `elevation: 10` değerlerine sahip, kart sınırlarını mükemmel takip eden kalın ve son derece belirgin bir neon mavi aura gölgesi (glow shadow) yerleştirildi.
    - "AI Karakter Talimatı" (`botInstruction`) kutusu `height: 280` olarak (eski 140px değerinden 2 kat daha büyük) sabitlendi ve `showsVerticalScrollIndicator={true}` eklenerek yapıştırılan uzun metinlerde kutunun büyümesi önlenip yan kaydırma çubuğu ile gezilebilmesi sağlandı.











