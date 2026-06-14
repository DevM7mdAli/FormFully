import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ar from "./locales/ar";

const saved = (localStorage.getItem("lang") ?? "en") as "en" | "ar";

i18n.use(initReactI18next).init({
  lng: saved,
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function switchLang(lang: "en" | "ar") {
  i18n.changeLanguage(lang);
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

// apply dir/lang on boot
document.documentElement.lang = saved;
document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";

export default i18n;
