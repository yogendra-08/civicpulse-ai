import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import mrTranslations from './locales/mr.json';

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  mr: { translation: mrTranslations },
};

const supportedLanguages = ['en', 'hi', 'mr'];
const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
const savedLanguage: string | undefined =
  storedLanguage && supportedLanguages.includes(storedLanguage) ? storedLanguage : 'en';

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

function applyDocumentLanguage(language: string) {
  document.documentElement.lang = language;
}

i18next.on('languageChanged', (language: string) => {
  if (supportedLanguages.includes(language)) {
    localStorage.setItem('language', language);
    applyDocumentLanguage(language);
  }
});

applyDocumentLanguage(savedLanguage ?? 'en');

export default i18next;
