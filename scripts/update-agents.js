const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../AGENTS.md');
let content = fs.readFileSync(filePath, 'utf8');

// 1. SDK link
content = content.replace(
  'Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.',
  'Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.'
);

// 2. Tech stack
content = content.replace(
  '- **Frontend**: React Native, Expo SDK 56, React Navigation',
  '- **Frontend**: React Native 0.86, Expo SDK 57, React 19, React Navigation v7'
);
content = content.replace(
  '- **Stil**: StyleSheet + Glassmorphism, renk paleti `#131315` (bg) / `#4edea3` (primary)',
  '- **Stil**: NativeWind v2 + Tailwind CSS v3, StyleSheet + Glassmorphism, renk paleti `#131315` (bg) / `#4edea3` (primary)'
);

// 3. Modules list
content = content.replace(
  '    ├── muhasebe/             — 💰 AI muhasebe\n    └── sosyal_medya/         — 📱 Bot yönetimi + sosyal medya',
  '    ├── muhasebe/             — 💰 AI muhasebe\n    ├── sosyal_medya/         — 📱 Bot yönetimi + sosyal medya\n    ├── persona_engine/       — 🤖 AI karakter ve prompt motoru\n    └── business-profile/     — 🏢 İşletme profili ve ayarları'
);

// 4. Navigation structure
const navOld = `App.js
└── AppNavigator (Stack)
    ├── AuthScreen
    └── TabNavigator (Bottom Tabs)
        ├── Tab: Dashboard
        ├── Tab: Muhasebe → AiMuhasebeScreen
        ├── Tab: BotYonetimi (BotYonetimiStack)
        │   ├── BotYonetimiScreen    ("BotYonetimiMain")
        │   ├── RandevuScreen        ("RandevuMain")
        │   └── HizmetAyarlariScreen ("HizmetAyarlari")
        └── Tab: SosyalMedya`;

const navNew = `App.js
└── Conditional Render: (AuthScreen veya AppNavigator)
    └── AppNavigator (Stack)
        └── TabNavigator (Bottom Tabs)
            ├── Tab: Anasayfa (Kod Bileşeni: Dashboard)
            ├── Tab: Ai Muhasebe (Kod Bileşeni: Muhasebe)
            ├── Tab: Ai Asistan (Kod Bileşeni: BotYonetimi)
            │   ├── BotYonetimiScreen    ("BotYonetimiMain")
            │   ├── RandevuScreen        ("RandevuMain")
            │   └── HizmetAyarlariScreen ("HizmetAyarlari")
            ├── Tab: Sosyal Medya (Kod Bileşeni: SosyalMedya)
            └── Tab: Analiz (Kod Bileşeni: Analiz)`;
content = content.replace(navOld, navNew);

// 5. Packages list
const packagesOld = `{
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
}`;

const packagesNew = `{
  "expo": "~57.0.8",
  "react": "19.2.3",
  "react-native": "0.86.0",
  "@react-navigation/native": "^7.3.3",
  "@react-navigation/bottom-tabs": "^7.18.2",
  "@react-navigation/native-stack": "^7.17.5",
  "@supabase/supabase-js": "^2.106.2",
  "expo-blur": "~57.0.2",
  "@expo/vector-icons": "^15.0.2",
  "react-native-safe-area-context": "~5.7.0",
  "react-native-reanimated": "4.5.0",
  "react-native-url-polyfill": "^3.0.0",
  "nativewind": "^2.0.11",
  "tailwindcss": "^3.3.2"
}`;
content = content.replace(packagesOld, packagesNew);

// 6. Dev Log
const devLogOld = `## 📝 Son Geliştirme Günlüğü (5 Temmuz 2026)`;
const devLogNew = `## 📝 Son Geliştirme Günlüğü (25 Temmuz 2026)

### Yapılan Değişiklikler ve Çözülen Hatalar:
1. **Paket Temizliği:** \`tsyringe\`, \`reflect-metadata\` ve gereksiz Babel decorator plugin'leri \`package.json\`'dan kaldırıldı.
2. **Konfigürasyon Temizliği:** \`tsconfig.json\` dosyasındaki \`experimentalDecorators\` ve \`emitDecoratorMetadata\` flag'leri kaldırıldı.
3. **Dokümantasyon Senkronizasyonu:** AGENTS.md dosyası mevcut teknoloji yığınına (Expo 57 / RN 0.86 / React 19) göre güncellendi.
4. **Mimari Düzenlemeler:** Eksik \`index.ts\` dosyaları (randevu, persona_engine, business-profile) oluşturuldu. BotYonetimiScreen'deki derin (deep) import kural ihlalleri barrel export üzerinden tek satıra indirgendi.
5. **Container Bağlantıları:** Eksik olan \`wahaService\` ve \`transactionRepository\` container DI sistemine resolve olarak eklendi. \`container\` nesnesi \`core/index.ts\` üzerinden dışa aktarıldı.

---

## 📝 Geçmiş Geliştirme Günlüğü (5 Temmuz 2026)`;
content = content.replace(devLogOld, devLogNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log("AGENTS.md updated successfully!");
