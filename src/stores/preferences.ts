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
  /** 0..1 each; remembered, since they only matter once sound is switched on. */
  musicVolume: number;
  effectsVolume: number;
  setVolume: (kind: "music" | "effects", value: number) => void;
}

const DEFAULT_MUSIC_VOLUME = 0.7;
const DEFAULT_EFFECTS_VOLUME = 0.8;

function volumeOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      localeChosen: false,
      setLocale: (locale) => set({ locale, localeChosen: true }),
      soundEnabled: false,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      musicVolume: DEFAULT_MUSIC_VOLUME,
      effectsVolume: DEFAULT_EFFECTS_VOLUME,
      setVolume: (kind, value) =>
        set(kind === "music" ? { musicVolume: volumeOr(value, 0) } : { effectsVolume: volumeOr(value, 0) }),
    }),
    {
      name: "mts-preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, localeChosen, musicVolume, effectsVolume }) => ({
        locale,
        localeChosen,
        musicVolume,
        effectsVolume,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PreferencesState> | undefined;
        return {
          ...current,
          locale: isLocale(p?.locale) ? p.locale : current.locale,
          localeChosen: p?.localeChosen === true,
          musicVolume: volumeOr(p?.musicVolume, current.musicVolume),
          effectsVolume: volumeOr(p?.effectsVolume, current.effectsVolume),
        };
      },
      // Rehydrated manually after mount so server and first client render match.
      skipHydration: true,
    },
  ),
);
