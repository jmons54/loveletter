import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './resources/en/game';
import fr from './resources/fr/game';

export const fallbackLng = 'en';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng,
    resources: {
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
    },
  })
  .then();

export default i18n;
