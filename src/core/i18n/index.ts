import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de },
};

// get locales from expo-localization
const getLocales = () => {
  return Localization.getLocales()[0]?.languageCode || 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLocales(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
