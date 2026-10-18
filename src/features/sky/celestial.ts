import { SolarTime } from "tyme4ts";
import { instantFromWallAtOffset, wallTimeAt, wallTimeAtOffset } from "@/features/destiny/zonedTime";
import type { LocalizedText } from "@/lib/i18n/types";

/**
 * The sanctuary's sky, derived from the real date and the viewer's clock.
 *
 * Conventions (documented because they are visible to the user):
 * - The Chinese lunar date and solar term are defined in China Standard Time
 *   (UTC+8), so they are computed for the same absolute instant in that zone —
 *   the same convention the Bazi engine uses.
 * - Moon phase is a global fact: the synodic age is measured between the two
 *   astronomically computed new moons bracketing the instant.
 * - Season follows the Chinese solar-term calendar, which is northern-hemisphere.
 * - Time of day comes from the viewer's own clock, since that is about them.
 */

const CHINA_OFFSET = 8 * 60;
/** Mean synodic month, used only as a search step. */
const SYNODIC_MS = 29.530588 * 86_400_000;

export const MOON_PHASES = [
  "new",
  "waxingCrescent",
  "firstQuarter",
  "waxingGibbous",
  "full",
  "waningGibbous",
  "lastQuarter",
  "waningCrescent",
] as const;
export type MoonPhaseId = (typeof MOON_PHASES)[number];

/** Canonical Chinese names, with English equivalents. */
export const MOON_PHASE_NAMES: Record<MoonPhaseId, LocalizedText> = {
  new: { en: "New moon", zh: "新月" },
  waxingCrescent: { en: "Waxing crescent", zh: "蛾眉月" },
  firstQuarter: { en: "First quarter", zh: "上弦月" },
  waxingGibbous: { en: "Waxing gibbous", zh: "盈凸月" },
  full: { en: "Full moon", zh: "满月" },
  waningGibbous: { en: "Waning gibbous", zh: "亏凸月" },
  lastQuarter: { en: "Last quarter", zh: "下弦月" },
  waningCrescent: { en: "Waning crescent", zh: "残月" },
};

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

/** The 24 solar terms, grouped into the season each one falls in. */
const SEASON_BY_TERM: Record<string, Season> = {
  立春: "spring",
  雨水: "spring",
  惊蛰: "spring",
  春分: "spring",
  清明: "spring",
  谷雨: "spring",
  立夏: "summer",
  小满: "summer",
  芒种: "summer",
  夏至: "summer",
  小暑: "summer",
  大暑: "summer",
  立秋: "autumn",
  处暑: "autumn",
  白露: "autumn",
  秋分: "autumn",
  寒露: "autumn",
  霜降: "autumn",
  立冬: "winter",
  小雪: "winter",
  大雪: "winter",
  冬至: "winter",
  小寒: "winter",
  大寒: "winter",
};

export const DAY_MOODS = ["dusk", "night", "deepNight", "dawn", "day"] as const;
export type DayMood = (typeof DAY_MOODS)[number];

/**
 * The sanctuary is always a moonlit night; the viewer's clock only leans it
 * toward one mood. Daytime hours get the brightest, bluest night.
 */
export function moodForHour(hour: number): DayMood {
  if (hour >= 17 && hour < 20) return "dusk";
  if (hour >= 20 && hour < 23) return "night";
  if (hour >= 23 || hour < 4) return "deepNight";
  if (hour < 7) return "dawn";
  return "day";
}

export interface MoonState {
  /** 0 at new moon, 0.5 at full, approaching 1 at the next new moon. */
  age: number;
  /** Lit fraction of the disc, 0..1. */
  illumination: number;
  waxing: boolean;
  phase: MoonPhaseId;
}

export interface SkyState {
  moon: MoonState;
  lunar: { full: string; dayName: string; monthName: string };
  solarTerm: { name: string; dayIndex: number };
  season: Season;
  mood: DayMood;
  /** The viewer's local hour, 0–23. */
  localHour: number;
}

function solarTimeInChina(instantMs: number): SolarTime {
  const w = wallTimeAtOffset(instantMs, CHINA_OFFSET);
  return SolarTime.fromYmdHms(w.year, w.month, w.day, w.hour, w.minute, w.second);
}

/** Absolute instant of a tyme4ts SolarTime, whose fields are China Standard Time. */
function instantOf(time: SolarTime): number {
  return instantFromWallAtOffset(
    {
      year: time.getYear(),
      month: time.getMonth(),
      day: time.getDay(),
      hour: time.getHour(),
      minute: time.getMinute(),
      second: time.getSecond(),
    },
    CHINA_OFFSET,
  );
}

/**
 * Instants of the principal phases (new, first quarter, full, last quarter)
 * bracketing `instantMs`, each tagged with its quarter index 0–3.
 *
 * The eight-name phase cycle is indexed within a lunar month and the even
 * indices are the principal phases, so stepping back by `index % 2` lands on
 * the principal phase at or before the instant.
 */
function bracketingPhases(instantMs: number) {
  const principalAtOrBefore = (ms: number) => {
    const phase = solarTimeInChina(ms).getPhase();
    const principal = phase.next(-(phase.getIndex() % 2));
    return { instant: instantOf(principal.getSolarTime()), quarter: (principal.getIndex() / 2) % 4, principal };
  };
  let before = principalAtOrBefore(instantMs);
  // Just after a principal phase the computed one can still be ahead; step back a quarter month.
  if (before.instant > instantMs) before = principalAtOrBefore(instantMs - SYNODIC_MS * 0.3);
  const nextPrincipal = before.principal.next(2);
  return { before, afterInstant: instantOf(nextPrincipal.getSolarTime()) };
}

/**
 * Lit fraction and named phase of the moon.
 *
 * Illumination is interpolated between the four astronomically computed
 * principal phases, so it is exact (0, ½, 1, ½) at each of them rather than
 * assuming a uniform orbit — the Moon's orbit is elliptical, so the quarters
 * are not exactly a quarter of a synodic month apart.
 */
export function moonStateAt(instantMs: number): MoonState {
  const { before, afterInstant } = bracketingPhases(instantMs);
  const span = afterInstant - before.instant;
  const within = span > 0 ? Math.min(1, Math.max(0, (instantMs - before.instant) / span)) : 0;
  // Phase angle: 0 at new moon, π at full, approaching 2π at the next new moon.
  const angle = (before.quarter + within) * (Math.PI / 2);
  return {
    age: angle / (Math.PI * 2),
    illumination: (1 - Math.cos(angle)) / 2,
    waxing: angle < Math.PI,
    // Eight equal buckets of phase angle, so the label always matches the disc.
    phase: MOON_PHASES[Math.round(angle / (Math.PI / 4)) % 8],
  };
}

export function skyStateAt(instantMs: number, timeZone: string): SkyState {
  const day = solarTimeInChina(instantMs).getSolarDay();
  const lunarDay = day.getLunarDay();
  const term = day.getTerm().getName();
  const localHour = wallTimeAt(instantMs, timeZone).hour;
  return {
    moon: moonStateAt(instantMs),
    lunar: {
      full: lunarDay.toString(),
      dayName: lunarDay.getName(),
      monthName: lunarDay.getLunarMonth().getName(),
    },
    solarTerm: { name: term, dayIndex: day.getTermDay().getDayIndex() + 1 },
    season: SEASON_BY_TERM[term] ?? "spring",
    mood: moodForHour(localHour),
    localHour,
  };
}
