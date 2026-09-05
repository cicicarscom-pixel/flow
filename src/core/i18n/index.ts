import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de },
};

// Uygulamanın desteklediği diller. Yeni bir dil eklendiğinde: (1) buraya kod
// eklenir, (2) ./locales altına ilgili {kod}.json dosyası eklenir, (3)
// yukarıdaki `resources`e eklenir, (4) common.language.* içine görünen adı eklenir.
export const SUPPORTED_LANGUAGES = ['tr', 'en', 'de'];

// Kullanıcının Ayarlar/Profil ekranından manuel olarak seçtiği dili
// hatırlamak için kullanılan AsyncStorage anahtarı.
export const LANGUAGE_STORAGE_KEY = '@workigom_flow_language';

// Cihazın/işletim sisteminin dilini al. Desteklenmeyen bir dilse 'en'e düşer
// (uygulamanın varsayılan fallback dili — 'tr'ye değil, çünkü artık
// uluslararası kullanıcılar için de çalışıyoruz).
const getDeviceLanguage = () => {
  const code = Localization.getLocales()[0]?.languageCode || 'en';
  return SUPPORTED_LANGUAGES.includes(code) ? code : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Uygulama her açıldığında: kullanıcının daha önce Ayarlar'dan manuel olarak
// seçtiği bir dil AsyncStorage'da kayıtlıysa, yukarıdaki cihaz-diline-göre
// otomatik algılamanın üzerine yazılır. Böylece davranış şu şekilde olur:
//   1. İlk açılış (hiç manuel seçim yokken) → cihaz/işletim sistemi diline
//      göre otomatik algılama (yukarıdaki `getDeviceLanguage()`).
//   2. Kullanıcı Profil ekranından manuel olarak bir dil seçerse → o seçim
//      hem anında uygulanır hem de kalıcı olarak hatırlanır, sonraki
//      açılışlarda cihaz dili ne olursa olsun kullanıcının seçimi geçerlidir.
let languageReadyResolve;
export const languageReady = new Promise((resolve) => {
  languageReadyResolve = resolve;
});

(async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage) && savedLanguage !== i18n.language) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (e) {
    console.warn('Kaydedilmiş dil tercihi okunamadı:', e);
  } finally {
    languageReadyResolve();
  }
})();

// Kullanıcının Ayarlar/Profil ekranından manuel olarak dil seçmesi için
// kullanılır. `useTranslation()` kullanan tüm bileşenler `i18n.changeLanguage`
// çağrıldığında otomatik olarak yeniden render olur (react-i18next context'i
// üzerinden) — ekstra bir state/refresh mantığına gerek yoktur.
export const setAppLanguage = async (languageCode) => {
  if (!SUPPORTED_LANGUAGES.includes(languageCode)) return;
  await i18n.changeLanguage(languageCode);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (e) {
    console.warn('Dil tercihi kaydedilemedi:', e);
  }
};

// Kullanıcı "Cihaz Diline Göre Otomatik" seçeneğine geri dönmek isterse:
// manuel kaydı siler ve cihazın o anki diline göre yeniden ayarlar.
export const clearAppLanguageOverride = async () => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (e) {
    console.warn('Dil tercihi sıfırlanamadı:', e);
  }
  await i18n.changeLanguage(getDeviceLanguage());
};

// Kullanıcının şu an manuel bir dil tercihi kaydetmiş olup olmadığını
// kontrol etmek için (örn. Profil ekranında "Otomatik" rozetini göstermek).
export const getSavedLanguageOverride = () => AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

export default i18n;
