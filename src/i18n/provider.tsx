"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTIONARIES, LOCALE_COOKIE, type Dictionary, type Locale } from "./dictionaries";

type I18n = { locale: Locale; t: Dictionary; setLocale: (locale: Locale) => void };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // Remember an explicit choice for a year; detection is used until then.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = DICTIONARIES[locale].meta.title;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t: DICTIONARIES[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
