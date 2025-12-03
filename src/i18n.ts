import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import { loadResourcesFromStorage } from "./utils/i18nUtils";

const initialResources = {
  en: { translation: en },
  es: { translation: es },
};

i18n.use(initReactI18next).init({
  resources: initialResources,
  fallbackLng: "en",
  lng: "en",
  interpolation: { escapeValue: false },
});

// Load persisted resources from localStorage (if present) and merge
try {
  const saved = loadResourcesFromStorage();
  if (saved) {
    for (const lng of Object.keys(saved)) {
      const bundle = saved[lng] || {};
      // add all keys into the 'translation' namespace
      for (const k of Object.keys(bundle)) {
        i18n.addResource(lng, "translation", k, bundle[k]);
      }
    }
  }
} catch (e) {
  // ignore
}

export default i18n;
