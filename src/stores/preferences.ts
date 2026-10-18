import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/dictionaries";

interface PreferencesState {
  locale: Locale;
  /** True once the user has explicitly picked a locale (vs. browser default). */
  localeChosen: boolean;
  setLocale: (locale: Locale) => void;
  /** Never persisted: sound always starts off and requires an explicit opt-in. */
  soundEnabled: boolean;
  setSoundEnabled: (on: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      localeChosen: false,
      setLocale: (locale) => set({ locale, localeChosen: true }),
      soundEnabled: false,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    {
      name: "mts-preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, localeChosen }) => ({ locale, localeChosen }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PreferencesState> | undefined;
        return {
          ...current,
          locale: isLocale(p?.locale) ? p.locale : current.locale,
          localeChosen: p?.localeChosen === true,
        };
      },
      // Rehydrated manually after mount so server and first client render match.
      skipHydration: true,
    },
  ),
);
