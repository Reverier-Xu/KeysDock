import { fetchDictionary, hasLocale, type Locale } from "@lib/i18n";
import { resolveTemplate, translator } from "@solid-primitives/i18n";
import { createPrefersDark } from "@solid-primitives/media";
import { makePersisted } from "@solid-primitives/storage";
import { createEffect, createResource, untrack } from "solid-js";
import { createStore } from "solid-js/store";

const prefersDark = createPrefersDark();

let systemPrefersLocale = (window.navigator.language || window.navigator.languages[0])
  .replace("-", "_")
  .toLowerCase() as Locale;

if (!hasLocale(systemPrefersLocale)) {
  systemPrefersLocale = "zh_cn" as Locale;
}

export const [themeStore, setThemeStore] = makePersisted(
  createStore({
    theme: "cyber",
    locale: systemPrefersLocale,
    colorScheme: "dark",
    colorSchemeFollowsSystem: true,
    showBackgroundImg: true,
  }),
  { name: "theme" }
);

export function setTheme(theme: string) {
  setThemeStore({ theme });
}

export function setColorScheme(colorScheme: "dark" | "light") {
  setThemeStore({ colorScheme });
}

export function setLocale(locale: Locale) {
  setThemeStore({ locale });
  setTimeout(() => location.reload());
}

export function toggleBackgroundImg() {
  setThemeStore("showBackgroundImg", !themeStore.showBackgroundImg);
}

export function fullTheme() {
  return `${themeStore.theme}-${themeStore.colorScheme}`;
}

export function initTheme() {
  createEffect(() => {
    document.documentElement.setAttribute("data-theme", fullTheme());
    document.documentElement.setAttribute("data-style", themeStore.colorScheme);
  });
  createEffect(() => {
    if (themeStore.colorSchemeFollowsSystem)
      if (prefersDark()) untrack(() => setColorScheme("dark"));
      else untrack(() => setColorScheme("light"));
  });

  function onBeforePrint() {
    document.documentElement.setAttribute("data-theme", `${themeStore.theme}-light`);
    document.documentElement.setAttribute("data-style", "light");
  }
  function onAfterPrint() {
    document.documentElement.setAttribute("data-theme", fullTheme());
    document.documentElement.setAttribute("data-style", themeStore.colorScheme);
  }
  window.onbeforeprint = onBeforePrint;
  window.onafterprint = onAfterPrint;
}

const [dict] = createResource(themeStore.locale || systemPrefersLocale, fetchDictionary);
// biome-ignore lint/suspicious/noExplicitAny: disable typescript lint
export const t = translator(dict as any, resolveTemplate) as (key: string, vars?: Record<string, string | number>) => string;
export const colorPalette = {
  fg: () => (themeStore.colorScheme === "dark" ? "#eee" : "#121212"),
  primary: "#0991ed",
  secondary: "#bd63c5",
  accent: "#699f08",
  info: "#0991ed",
  success: "#17a750",
  warning: "#db640e",
  error: "#e05864",
};

export const breakpoints = {
  "2xl": "1536px",
  xl: "1280px",
  lg: "1024px",
  md: "768px",
  sm: "640px",
  xs: "480px",
  "2xs": "320px",
} as const;
