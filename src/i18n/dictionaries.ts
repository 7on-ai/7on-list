/* All visitor-facing copy lives in ./locales — one file per language.
   Add a language by adding a file and listing it here; the visitor's
   browser language (Accept-Language) picks it automatically. */

import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { id } from "./locales/id";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { pt } from "./locales/pt";
import { th } from "./locales/th";
import { vi } from "./locales/vi";
import { zhHans } from "./locales/zh-Hans";
import { zhHant } from "./locales/zh-Hant";
import type { Dictionary } from "./types";

export type { Dictionary, Moment } from "./types";

export const DICTIONARIES = {
  en,
  th,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja,
  ko,
  vi,
  id,
  es,
  fr,
  de,
  pt,
} satisfies Record<string, Dictionary>;

export type Locale = keyof typeof DICTIONARIES;
export const LOCALES = Object.keys(DICTIONARIES) as Locale[];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && value in DICTIONARIES;
}

/* Map one language tag (e.g. "pt-BR", "zh-TW") to a supported locale */
function fromTag(tag: string): Locale | null {
  const t = tag.trim().toLowerCase();
  const base = t.split("-")[0];
  if (base === "zh") {
    return /hant|-tw|-hk|-mo/.test(t) ? "zh-Hant" : "zh-Hans";
  }
  if (base === "in") return "id"; // legacy tag for Indonesian
  return isLocale(base) ? base : null;
}

/* Pick the best supported locale from an Accept-Language header,
   honouring q-weights (e.g. "th-TH,th;q=0.9,en;q=0.8"). */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .filter(({ q }) => q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const locale = fromTag(tag);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

/* Each language has its own address (/th, /ja, /zh-hant …) so search engines
   can find every translation. "/" still follows the visitor's browser. */
const SEGMENTS: Record<Locale, string> = {
  en: "en",
  th: "th",
  "zh-Hans": "zh-hans",
  "zh-Hant": "zh-hant",
  ja: "ja",
  ko: "ko",
  vi: "vi",
  id: "id",
  es: "es",
  fr: "fr",
  de: "de",
  pt: "pt",
};

export function segmentOf(locale: Locale) {
  return SEGMENTS[locale];
}

export function localeFromSegment(segment: string | null | undefined): Locale | null {
  if (!segment) return null;
  return LOCALES.find((l) => SEGMENTS[l] === segment.toLowerCase()) ?? null;
}

export function pathOf(locale: Locale) {
  return `/${SEGMENTS[locale]}`;
}
