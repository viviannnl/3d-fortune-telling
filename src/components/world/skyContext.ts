"use client";

import { createContext, useContext } from "react";
import { MOOD_PALETTES, SEASON_PALETTES, type MoodPalette, type SeasonPalette } from "@/features/sky/palette";
import type { SkyState } from "@/features/sky/celestial";

export interface SkyLook {
  sky: SkyState | null;
  mood: MoodPalette;
  season: SeasonPalette;
}

/** Defaults match the previous fixed look, so SSR and tests are stable. */
export const DEFAULT_SKY_LOOK: SkyLook = { sky: null, mood: MOOD_PALETTES.night, season: SEASON_PALETTES.spring };

export const SkyLookContext = createContext<SkyLook>(DEFAULT_SKY_LOOK);

export function useSkyLook(): SkyLook {
  return useContext(SkyLookContext);
}
