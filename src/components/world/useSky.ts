"use client";

import { useEffect, useState } from "react";
import { moodForHour, SEASONS, skyStateAt, type Season, type SkyState } from "@/features/sky/celestial";

/** Refresh cadence: the moon and the hour change slowly, so once a minute is plenty. */
const TICK_MS = 60_000;

/**
 * Optional overrides for previewing the sky, via URL query params:
 * `?sky=summer` forces a season and `?hour=5` forces the time of day.
 * Visual review only; nothing else reads them.
 */
function overrides(): { season?: Season; hour?: number } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const season = params.get("sky");
  const hour = Number(params.get("hour"));
  return {
    season: SEASONS.includes(season as Season) ? (season as Season) : undefined,
    hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : undefined,
  };
}

function currentSky(): SkyState {
  const base = skyStateAt(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone);
  const { season, hour } = overrides();
  if (season === undefined && hour === undefined) return base;
  return {
    ...base,
    season: season ?? base.season,
    mood: hour === undefined ? base.mood : moodForHour(hour),
    localHour: hour ?? base.localHour,
  };
}

/**
 * The live sky derived from the real date and the viewer's time zone.
 * Server-rendered output is deterministic (null) and fills in after mount, so
 * hydration never mismatches.
 */
export function useSky(): SkyState | null {
  const [sky, setSky] = useState<SkyState | null>(null);
  useEffect(() => {
    const update = () => setSky(currentSky());
    update();
    const id = window.setInterval(update, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return sky;
}
