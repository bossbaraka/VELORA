import en from "./en.json";
import ar from "./ar.json";
import type { Locale } from "@/lib/types";
export type TranslationKey = keyof typeof en;
export const dictionaries = { en, ar };
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars: Record<string, string | number> = {},
) {
  let s: string = dictionaries[locale][key];
  for (const [k, v] of Object.entries(vars))
    s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
