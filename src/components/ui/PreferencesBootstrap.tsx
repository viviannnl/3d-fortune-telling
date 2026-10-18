"use client";

import { useEffect } from "react";
import { HTML_LANG, resolveLocale } from "@/lib/i18n/dictionaries";
import { usePreferences } from "@/stores/preferences";

/** Restores saved preferences after hydration and keeps <html lang> in sync. */
export function PreferencesBootstrap() {
  const locale = usePreferences((s) => s.locale);

  useEffect(() => {
    void Promise.resolve(usePreferences.persist.rehydrate()).then(() => {
      if (!usePreferences.getState().localeChosen) {
        usePreferences.setState({ locale: resolveLocale(navigator.languages) });
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  return null;
}
