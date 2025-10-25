import { type BaseDict, flatten } from "@solid-primitives/i18n";

const localeList = ["zh_cn", "en_us", "zh_tw", "ja_jp"] as const;
export type Locale = (typeof localeList)[number];

export async function fetchDictionary(locale: Locale): Promise<BaseDict> {
  let dict: BaseDict;
  const dictModules = import.meta.glob("./*.json");
  const match = dictModules[`./${locale.replace("_", "-")}.json`];
  try {
    dict = (await match()) as BaseDict;
  } catch {
    dict = await import("./zh-cn.json");
  }
  // flatten the dictionary to make all nested keys available top-level
  return flatten(dict);
}

export function hasLocale(locale: unknown): locale is Locale {
  return typeof locale === "string" && localeList.includes(locale as Locale);
}
