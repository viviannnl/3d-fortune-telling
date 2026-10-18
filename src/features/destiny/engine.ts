import { HideHeavenStemType, SolarTime, type EightChar, type HeavenStem, type SixtyCycle } from "tyme4ts";
import { CONVENTION } from "./conventions";
import { trueSolarOffsetMinutes } from "./solarTime";
import { branchByChar, ELEMENTS, stemByChar, type ElementId, type TenGod } from "./symbols";
import type { BirthInput, ChartOutcome, HiddenStem, Pillar, PillarAlternative, PillarKey } from "./types";
import {
  isRealDate,
  isValidTimeZone,
  resolveWallTime,
  standardOffsetMinutes,
  wallTimeAtOffset,
  type WallTime,
} from "./zonedTime";

const CHINA_STANDARD_OFFSET = 8 * 60;

function eightCharAt(w: WallTime): EightChar {
  return SolarTime.fromYmdHms(w.year, w.month, w.day, w.hour, w.minute, 0).getLunarHour().getEightChar();
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function formatWall(w: WallTime, withTime = true): string {
  const date = `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}`;
  return withTime ? `${date} ${pad(w.hour)}:${pad(w.minute)}` : date;
}

const ROLE: Record<HideHeavenStemType, HiddenStem["role"]> = {
  [HideHeavenStemType.MAIN]: "main",
  [HideHeavenStemType.MIDDLE]: "middle",
  [HideHeavenStemType.RESIDUAL]: "residual",
};

function tenGod(dayMaster: HeavenStem, stem: HeavenStem): TenGod {
  return dayMaster.getTenStar(stem).getName() as TenGod;
}

function buildPillar(key: PillarKey, cycle: SixtyCycle, dayMaster: HeavenStem): Pillar {
  const stem = cycle.getHeavenStem();
  const branch = cycle.getEarthBranch();
  const stemInfo = stemByChar(stem.getName());
  const branchInfo = branchByChar(branch.getName());
  if (!stemInfo || !branchInfo) throw new Error(`Unrecognized pillar ${cycle.getName()}`);
  const order: HiddenStem["role"][] = ["main", "middle", "residual"];
  const hiddenStems = branch
    .getHideHeavenStems()
    .map((h) => ({
      stem: h.getHeavenStem().getName(),
      role: ROLE[h.getType()],
      tenGod: tenGod(dayMaster, h.getHeavenStem()),
    }))
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  return {
    key,
    name: cycle.getName(),
    stem: stemInfo.char,
    branch: branchInfo.char,
    stemElement: stemInfo.element,
    branchElement: branchInfo.element,
    hiddenStems,
    tenGod: key === "day" ? null : tenGod(dayMaster, stem),
  };
}

function parseDate(date: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return isRealDate(year, month, day) ? { year, month, day } : null;
}

function parseTime(time: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const [hour, minute] = [Number(m[1]), Number(m[2])];
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/**
 * Calculates a Four Pillars chart under the documented MVP convention (see conventions.ts).
 * Pure and deterministic: the same input always yields the same chart.
 */
export function calculateChart(input: BirthInput): ChartOutcome {
  const date = parseDate(input.date);
  if (!date) return { ok: false, code: "invalid_date" };
  if (date.year < CONVENTION.supportedYears.min || date.year > CONVENTION.supportedYears.max) {
    return { ok: false, code: "out_of_range" };
  }
  if (!isValidTimeZone(input.timeZone)) return { ok: false, code: "invalid_time_zone" };

  const stdOffset = standardOffsetMinutes(date.year, input.timeZone);
  const ambiguities: PillarAlternative[] = [];
  let yearMonthSource: EightChar;
  let dayHourSource: EightChar;
  let normalized: Extract<ChartOutcome, { ok: true }>["normalized"];
  let trueSolar: Extract<ChartOutcome, { ok: true }>["trueSolar"] = null;

  if (input.time !== null) {
    const time = parseTime(input.time);
    if (!time) return { ok: false, code: "invalid_time" };
    const resolution = resolveWallTime({ ...date, ...time }, input.timeZone);
    if (resolution.kind === "nonexistent") return { ok: false, code: "nonexistent_local_time" };
    let chosen: { instantMs: number; offsetMinutes: number };
    if (resolution.kind === "ambiguous") {
      if (!input.fold) return { ok: false, code: "ambiguous_local_time" };
      chosen = resolution[input.fold];
    } else {
      chosen = resolution;
    }

    const localStd = wallTimeAtOffset(chosen.instantMs, stdOffset);
    const china = wallTimeAtOffset(chosen.instantMs, CHINA_STANDARD_OFFSET);
    yearMonthSource = eightCharAt(china);
    dayHourSource = eightCharAt(localStd);
    normalized = {
      utc: new Date(chosen.instantMs).toISOString(),
      localStandard: formatWall(localStd),
      chinaStandard: formatWall(china),
      utcOffsetMinutes: chosen.offsetMinutes,
      standardOffsetMinutes: stdOffset,
      daylightSavingRemoved: chosen.offsetMinutes !== stdOffset,
    };

    if (input.longitude !== null) {
      const offset = trueSolarOffsetMinutes(chosen.instantMs, input.longitude, stdOffset);
      const apparent = eightCharAt(wallTimeAtOffset(chosen.instantMs, stdOffset + offset));
      trueSolar = {
        offsetMinutes: Math.round(offset),
        hourPillarWouldDiffer: apparent.getHour().getName() !== dayHourSource.getHour().getName(),
        dayPillarWouldDiffer: apparent.getDay().getName() !== dayHourSource.getDay().getName(),
      };
    }
  } else {
    // Unknown time: the day pillar comes from the civil date (noon avoids the 23:00 boundary).
    dayHourSource = eightCharAt({ ...date, hour: 12, minute: 0 });
    const instantAt = (hour: number, minute: number) =>
      Date.UTC(date.year, date.month - 1, date.day, hour, minute) - stdOffset * 60_000;
    const china = (ms: number) => eightCharAt(wallTimeAtOffset(ms, CHINA_STANDARD_OFFSET));
    const start = china(instantAt(0, 0));
    const noon = china(instantAt(12, 0));
    const end = china(instantAt(23, 59));
    yearMonthSource = noon;
    for (const key of ["year", "month"] as const) {
      const get = (ec: EightChar) => (key === "year" ? ec.getYear() : ec.getMonth()).getName();
      const candidates = [...new Set([get(start), get(end)])];
      if (candidates.length > 1) ambiguities.push({ key, candidates });
    }
    normalized = {
      utc: null,
      localStandard: formatWall({ ...date, hour: 0, minute: 0 }, false),
      chinaStandard: null,
      utcOffsetMinutes: null,
      standardOffsetMinutes: stdOffset,
      daylightSavingRemoved: false,
    };
  }

  const dayCycle = dayHourSource.getDay();
  const dayMaster = dayCycle.getHeavenStem();
  const pillars = {
    year: buildPillar("year", yearMonthSource.getYear(), dayMaster),
    month: buildPillar("month", yearMonthSource.getMonth(), dayMaster),
    day: buildPillar("day", dayCycle, dayMaster),
    hour: input.time !== null ? buildPillar("hour", dayHourSource.getHour(), dayMaster) : null,
  };

  const elementCounts = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<ElementId, number>;
  let counted = 0;
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (!p) continue;
    elementCounts[p.stemElement] += 1;
    elementCounts[p.branchElement] += 1;
    counted += 2;
  }

  const dm = stemByChar(dayMaster.getName());
  if (!dm) throw new Error("Unrecognized day master");

  return {
    ok: true,
    conventionId: CONVENTION.id,
    timeKnown: input.time !== null,
    pillars,
    dayMaster: { stem: dm.char, element: dm.element, polarity: dm.polarity },
    elementCounts,
    countedCharacters: counted,
    ambiguities,
    normalized,
    trueSolar,
  };
}
