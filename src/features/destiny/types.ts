import type { ElementId, TenGod } from "./symbols";

export const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;
export type PillarKey = (typeof PILLAR_KEYS)[number];

/** Normalized, validated input to the engine. */
export interface BirthInput {
  /** Local civil date at the birthplace, YYYY-MM-DD. */
  date: string;
  /** Local civil clock time HH:MM, or null when the birth time is unknown. */
  time: string | null;
  /** IANA time zone of the birthplace, e.g. "Asia/Shanghai". */
  timeZone: string;
  /** Birthplace longitude in degrees east; only used for the informational true-solar-time note. */
  longitude: number | null;
  /** Which occurrence to use when a clock time happens twice (DST fall-back). */
  fold?: "earlier" | "later";
}

export interface HiddenStem {
  stem: string;
  role: "main" | "middle" | "residual";
  tenGod: TenGod;
}

export interface Pillar {
  key: PillarKey;
  /** Sexagenary name, e.g. "甲子". */
  name: string;
  stem: string;
  branch: string;
  stemElement: ElementId;
  branchElement: ElementId;
  hiddenStems: HiddenStem[];
  /** Ten God of the visible stem relative to the Day Master; null for the Day pillar itself. */
  tenGod: TenGod | null;
}

export interface PillarAlternative {
  key: "year" | "month";
  /** Pillar names that are possible on this date when the time is unknown. */
  candidates: string[];
}

export interface ChartResult {
  ok: true;
  conventionId: string;
  timeKnown: boolean;
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  dayMaster: { stem: string; element: ElementId; polarity: "yang" | "yin" };
  /** Simple count of the visible stems and branches' principal elements (8, or 6 without the hour). */
  elementCounts: Record<ElementId, number>;
  countedCharacters: number;
  /** Pillars that cannot be fixed without a birth time (solar-term day). */
  ambiguities: PillarAlternative[];
  normalized: {
    /** ISO instant of birth (null when the time is unknown). */
    utc: string | null;
    /** Local standard time used for the day and hour pillars (DST removed). */
    localStandard: string;
    /** China Standard Time (UTC+8) used for solar-term comparisons (year/month pillars). */
    chinaStandard: string | null;
    utcOffsetMinutes: number | null;
    standardOffsetMinutes: number;
    daylightSavingRemoved: boolean;
  };
  trueSolar: {
    offsetMinutes: number;
    /** Hour pillar under true solar time differs from the chart's (informational). */
    hourPillarWouldDiffer: boolean;
    /** Day pillar under true solar time differs (informational). */
    dayPillarWouldDiffer: boolean;
  } | null;
}

export type ChartErrorCode =
  | "invalid_date"
  | "invalid_time"
  | "out_of_range"
  | "invalid_time_zone"
  | "nonexistent_local_time"
  | "ambiguous_local_time";

export interface ChartError {
  ok: false;
  code: ChartErrorCode;
}

export type ChartOutcome = ChartResult | ChartError;
