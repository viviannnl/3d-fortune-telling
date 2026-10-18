/**
 * Time-zone arithmetic using only the platform's IANA database (Intl).
 * No implicit guessing: DST gaps and overlaps are reported to the caller.
 */

export interface WallTime {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock fields of an instant in a zone. */
export function wallTimeAt(instantMs: number, timeZone: string): WallTime & { second: number } {
  const parts = formatter(timeZone).formatToParts(new Date(instantMs));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function wallAsUtcMs(w: WallTime & { second?: number }): number {
  // Date.UTC treats years 0–99 as 1900+; setUTCFullYear avoids that.
  const d = new Date(Date.UTC(2000, w.month - 1, w.day, w.hour, w.minute, w.second ?? 0));
  d.setUTCFullYear(w.year);
  return d.getTime();
}

/** UTC offset (minutes, east positive) in effect at an instant. */
export function offsetMinutesAt(instantMs: number, timeZone: string): number {
  const w = wallTimeAt(instantMs, timeZone);
  return Math.round((wallAsUtcMs(w) - Math.floor(instantMs / 1000) * 1000) / 60_000);
}

/**
 * The zone's standard (non-daylight-saving) offset for a given year:
 * the smaller of the January and July offsets. DST always adds time in the
 * IANA data as exposed by Intl, so this holds for both hemispheres.
 */
export function standardOffsetMinutes(year: number, timeZone: string): number {
  const jan = wallAsUtcMs({ year, month: 1, day: 1, hour: 12, minute: 0 });
  const jul = wallAsUtcMs({ year, month: 7, day: 1, hour: 12, minute: 0 });
  return Math.min(offsetMinutesAt(jan, timeZone), offsetMinutesAt(jul, timeZone));
}

export type WallResolution =
  | { kind: "unique"; instantMs: number; offsetMinutes: number }
  | {
      kind: "ambiguous";
      earlier: { instantMs: number; offsetMinutes: number };
      later: { instantMs: number; offsetMinutes: number };
    }
  | { kind: "nonexistent" };

/** Resolves a local wall time to instant(s), detecting DST gaps and overlaps. */
export function resolveWallTime(w: WallTime, timeZone: string): WallResolution {
  const wallMs = wallAsUtcMs(w);
  const day = 86_400_000;
  const offsets = new Set([
    offsetMinutesAt(wallMs - day, timeZone),
    offsetMinutesAt(wallMs, timeZone),
    offsetMinutesAt(wallMs + day, timeZone),
  ]);
  const candidates = [...offsets]
    .map((offset) => ({ instantMs: wallMs - offset * 60_000, offsetMinutes: offset }))
    .filter((c) => offsetMinutesAt(c.instantMs, timeZone) === c.offsetMinutes)
    .sort((a, b) => a.instantMs - b.instantMs);
  if (candidates.length === 0) return { kind: "nonexistent" };
  if (candidates.length === 1) return { kind: "unique", ...candidates[0] };
  return { kind: "ambiguous", earlier: candidates[0], later: candidates[candidates.length - 1] };
}

/** Wall time of an instant at a fixed UTC offset. */
export function wallTimeAtOffset(instantMs: number, offsetMinutes: number): WallTime & { second: number } {
  const d = new Date(instantMs + offsetMinutes * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

export function isRealDate(year: number, month: number, day: number): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  const d = new Date(Date.UTC(2000, month - 1, day));
  d.setUTCFullYear(year);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}
