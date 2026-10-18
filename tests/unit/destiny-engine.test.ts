import { describe, expect, it } from "vitest";
import { SolarTerm } from "tyme4ts";
import { calculateChart } from "@/features/destiny/engine";
import { equationOfTimeMinutes } from "@/features/destiny/solarTime";
import { BRANCHES, STEMS } from "@/features/destiny/symbols";
import type { BirthInput, ChartResult } from "@/features/destiny/types";
import { resolveWallTime, standardOffsetMinutes } from "@/features/destiny/zonedTime";
import hko from "../fixtures/hko-solar-terms.json";

// ───────────────────────── independent reference math (no tyme4ts) ─────────────────────────

const STEM_CHARS = STEMS.map((s) => s.char);
const BRANCH_CHARS = BRANCHES.map((b) => b.char);
const cycleName = (i: number) => STEM_CHARS[((i % 10) + 10) % 10] + BRANCH_CHARS[((i % 12) + 12) % 12];

/** Julian Day Number of a Gregorian date (Fliegel–Van Flandern). */
function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}
/** Sexagenary day: JDN − 11 ≡ 0 (mod 60) is 甲子 (e.g. 1949-10-01). */
const refDayPillar = (y: number, m: number, d: number) => cycleName(jdn(y, m, d) - 11);
/** Sexagenary year for a date safely after Lichun: 1984 = 甲子. */
const refYearPillar = (y: number) => cycleName(y - 4);
/** 五虎遁: the stem of the Yin (寅) month from the year stem. */
function refMonthPillar(yearStemIndex: number, branchIndex: number) {
  const yinStem = [2, 4, 6, 8, 0][yearStemIndex % 5]; // 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲
  const monthsFromYin = (branchIndex - 2 + 12) % 12;
  return STEM_CHARS[(yinStem + monthsFromYin) % 10] + BRANCH_CHARS[branchIndex];
}
/** 五鼠遁: the stem of the Zi (子) hour from the day stem. */
function refHourPillar(dayStemIndex: number, branchIndex: number) {
  const ziStem = [0, 2, 4, 6, 8][dayStemIndex % 5]; // 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬
  return STEM_CHARS[(ziStem + branchIndex) % 10] + BRANCH_CHARS[branchIndex];
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
function chart(partial: Partial<BirthInput> & { date: string }): ChartResult {
  const res = calculateChart({ time: null, timeZone: "Asia/Shanghai", longitude: null, ...partial });
  if (!res.ok) throw new Error(`chart failed: ${res.code}`);
  return res;
}
const pillarNames = (c: ChartResult) => [
  c.pillars.year.name,
  c.pillars.month.name,
  c.pillars.day.name,
  c.pillars.hour?.name ?? null,
];

// ───────────────────────── solar terms vs the Hong Kong Observatory ─────────────────────────

describe("solar terms match the Hong Kong Observatory (2019–2028, 240 instants)", () => {
  it("every term is within one minute of HKO's published time (UTC+8)", () => {
    const worst = { diff: 0, label: "" };
    for (const t of hko.terms) {
      // tyme4ts numbers each year's cycle from the previous December's 冬至, so December's 冬至 is next year's index 0.
      const cycleYear = t.name === "冬至" && t.month === 12 ? t.year + 1 : t.year;
      const st = SolarTerm.fromName(cycleYear, t.name).getJulianDay().getSolarTime();
      const lib = Date.UTC(st.getYear(), st.getMonth() - 1, st.getDay(), st.getHour(), st.getMinute(), st.getSecond());
      const ref = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
      const diff = Math.abs(lib - ref) / 60_000;
      if (diff > worst.diff) Object.assign(worst, { diff, label: `${t.year} ${t.name}` });
    }
    expect(worst.diff, worst.label).toBeLessThanOrEqual(1);
  });
});

// ───────────────────────── month & year boundaries at Jie terms ─────────────────────────

const JIE = ["小寒", "立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪"];
/** Branch that begins at each Jie: 小寒→丑, 立春→寅, … 大雪→子. */
const JIE_BRANCH: Record<string, string> = Object.fromEntries(JIE.map((n, i) => [n, BRANCH_CHARS[(i + 1) % 12]]));

describe("month and year pillars switch exactly at Jie instants (Asia/Shanghai)", () => {
  const jieTerms = hko.terms.filter((t) => JIE.includes(t.name));

  it.each(jieTerms.map((t) => [`${t.year} ${t.name}`, t] as const))("%s", (_label, t) => {
    const at = (deltaMin: number) => {
      const d = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute + deltaMin));
      return chart({
        date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
        time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
      });
    };
    const before = at(-2);
    const after = at(+2);
    expect(after.pillars.month.branch).toBe(JIE_BRANCH[t.name]);
    expect(before.pillars.month.branch).not.toBe(JIE_BRANCH[t.name]);
    // The year changes only at Lichun.
    if (t.name === "立春") {
      expect(after.pillars.year.name).toBe(refYearPillar(t.year));
      expect(before.pillars.year.name).toBe(refYearPillar(t.year - 1));
    } else {
      expect(after.pillars.year.name).toBe(before.pillars.year.name);
    }
  });
});

// ───────────────────────── day, year, month, hour vs independent formulas ─────────────────────────

describe("pillars match independent formulas across 1900–2100", () => {
  // Fixed UTC+8 with no daylight saving, so clock time equals standard time (DST has its own tests).
  const zone = { timeZone: "Etc/GMT-8" };
  const r = rng(7);
  const samples = Array.from({ length: 1500 }, () => {
    const year = 1900 + Math.floor(r() * 201);
    const month = 1 + Math.floor(r() * 12);
    return { year, month, day: 1 + Math.floor(r() * 28), hour: Math.floor(r() * 23), minute: Math.floor(r() * 60) };
  });

  it("day pillar (JDN) for every sample, before 23:00", () => {
    for (const s of samples) {
      const c = chart({
        ...zone,
        date: `${s.year}-${pad(s.month)}-${pad(s.day)}`,
        time: `${pad(s.hour)}:${pad(s.minute)}`,
      });
      expect(c.pillars.day.name, `${s.year}-${s.month}-${s.day}`).toBe(refDayPillar(s.year, s.month, s.day));
    }
  });

  it("hour pillar (五鼠遁) for every sample", () => {
    for (const s of samples) {
      const c = chart({
        ...zone,
        date: `${s.year}-${pad(s.month)}-${pad(s.day)}`,
        time: `${pad(s.hour)}:${pad(s.minute)}`,
      });
      const branch = Math.floor((s.hour + 1) / 2) % 12;
      expect(c.pillars.hour?.name).toBe(refHourPillar(STEM_CHARS.indexOf(c.pillars.day.stem), branch));
    }
  });

  it("year and month pillars (五虎遁) on the 20th, far from any Jie", () => {
    for (const s of samples) {
      const c = chart({ ...zone, date: `${s.year}-${pad(s.month)}-20`, time: "12:00" });
      // On the 20th the solar month is the one that began early in the same Gregorian month.
      const branch = s.month % 12; // Jan→丑(1), Feb→寅(2), … Dec→子(0)
      const baziYear = s.month === 1 ? s.year - 1 : s.year; // January 20 is before Lichun
      expect(c.pillars.year.name).toBe(refYearPillar(baziYear));
      expect(c.pillars.month.name).toBe(refMonthPillar(STEM_CHARS.indexOf(c.pillars.year.stem), branch));
    }
  });
});

describe("known anchor charts", () => {
  it("1949-10-01 is a 甲子 day", () => {
    expect(chart({ date: "1949-10-01", time: "15:00" }).pillars.day.name).toBe("甲子");
  });

  it("2000-01-01 12:00 Beijing: 己卯 丙子 戊午 戊午", () => {
    expect(pillarNames(chart({ date: "2000-01-01", time: "12:00" }))).toEqual(["己卯", "丙子", "戊午", "戊午"]);
  });

  it("2024 Lichun (16:27 Beijing per HKO): 16:20 is still 癸卯/乙丑, 16:35 is 甲辰/丙寅", () => {
    const before = chart({ date: "2024-02-04", time: "16:20" });
    const after = chart({ date: "2024-02-04", time: "16:35" });
    expect([before.pillars.year.name, before.pillars.month.name]).toEqual(["癸卯", "乙丑"]);
    expect([after.pillars.year.name, after.pillars.month.name]).toEqual(["甲辰", "丙寅"]);
  });
});

describe("day boundary at 23:00 (子初换日)", () => {
  it("22:59 belongs to the calendar day; 23:00 advances the day pillar and starts 子 hour", () => {
    const late = chart({ date: "2024-06-15", time: "22:59" });
    const zi = chart({ date: "2024-06-15", time: "23:00" });
    expect(late.pillars.day.name).toBe(refDayPillar(2024, 6, 15));
    expect(late.pillars.hour?.branch).toBe("亥");
    expect(zi.pillars.day.name).toBe(refDayPillar(2024, 6, 16));
    expect(zi.pillars.hour?.name).toBe(refHourPillar(STEM_CHARS.indexOf(zi.pillars.day.stem), 0));
    expect(chart({ date: "2024-06-16", time: "00:30" }).pillars.day.name).toBe(zi.pillars.day.name);
  });
});

// ───────────────────────── time zones and daylight saving ─────────────────────────

describe("time zones", () => {
  it("compares solar terms at the absolute instant: New York 03:20 vs 03:35 EST around 2024 Lichun", () => {
    const before = chart({ date: "2024-02-04", time: "03:20", timeZone: "America/New_York" });
    const after = chart({ date: "2024-02-04", time: "03:35", timeZone: "America/New_York" });
    expect(before.pillars.year.name).toBe("癸卯");
    expect(after.pillars.year.name).toBe("甲辰");
    expect(after.pillars.month.name).toBe("丙寅");
    // The day pillar follows the New York calendar date, not Beijing's.
    expect(after.pillars.day.name).toBe(refDayPillar(2024, 2, 4));
    expect(after.normalized.chinaStandard).toBe("2024-02-04 16:35");
  });

  it("the same instant can fall on different local days in different zones", () => {
    const ny = chart({ date: "2024-03-10", time: "20:00", timeZone: "America/New_York" }); // 2024-03-11 08:00 Beijing
    const sh = chart({ date: "2024-03-11", time: "08:00", timeZone: "Asia/Shanghai" });
    expect(ny.normalized.utc).toBe(sh.normalized.utc);
    expect(ny.pillars.day.name).toBe(refDayPillar(2024, 3, 10));
    expect(sh.pillars.day.name).toBe(refDayPillar(2024, 3, 11));
    expect(ny.pillars.month.name).toBe(sh.pillars.month.name);
  });

  it("removes daylight saving: 12:30 EDT is charted as 11:30 standard time", () => {
    const c = chart({ date: "2023-07-01", time: "12:30", timeZone: "America/New_York" });
    expect(c.normalized.daylightSavingRemoved).toBe(true);
    expect(c.normalized.localStandard).toBe("2023-07-01 11:30");
    expect(c.pillars.hour?.branch).toBe("午");
    const edge = chart({ date: "2023-07-01", time: "11:30", timeZone: "America/New_York" }); // 10:30 standard
    expect(edge.pillars.hour?.branch).toBe("巳");
  });

  it("removes China's 1986–1991 daylight saving (tzdb): 1988-07-01 11:30 CDT → 10:30 CST, 巳 hour", () => {
    expect(standardOffsetMinutes(1988, "Asia/Shanghai")).toBe(480);
    const c = chart({ date: "1988-07-01", time: "11:30" });
    expect(c.normalized.utcOffsetMinutes).toBe(540);
    expect(c.normalized.localStandard).toBe("1988-07-01 10:30");
    expect(c.pillars.hour?.branch).toBe("巳");
  });

  it("works for southern-hemisphere DST (Sydney, January = daylight time)", () => {
    expect(standardOffsetMinutes(2024, "Australia/Sydney")).toBe(600);
    const c = chart({ date: "2024-01-15", time: "13:30", timeZone: "Australia/Sydney" });
    expect(c.normalized.localStandard).toBe("2024-01-15 12:30");
  });

  it("works for zones with half-hour offsets (Asia/Kolkata)", () => {
    const c = chart({ date: "2024-05-01", time: "06:00", timeZone: "Asia/Kolkata" });
    expect(c.normalized.utc).toBe("2024-05-01T00:30:00.000Z");
    expect(c.normalized.chinaStandard).toBe("2024-05-01 08:30");
  });

  it("reports a nonexistent local time in a spring-forward gap", () => {
    expect(
      calculateChart({ date: "2023-03-12", time: "02:30", timeZone: "America/New_York", longitude: null }),
    ).toEqual({
      ok: false,
      code: "nonexistent_local_time",
    });
  });

  it("requires a choice for a repeated local time in a fall-back overlap", () => {
    const base = { date: "2023-11-05", time: "01:30", timeZone: "America/New_York", longitude: null } as const;
    expect(calculateChart(base)).toEqual({ ok: false, code: "ambiguous_local_time" });
    const earlier = calculateChart({ ...base, fold: "earlier" });
    const later = calculateChart({ ...base, fold: "later" });
    if (!earlier.ok || !later.ok) throw new Error("expected charts");
    expect(new Date(later.normalized.utc ?? "").getTime() - new Date(earlier.normalized.utc ?? "").getTime()).toBe(
      3_600_000,
    );
    // In standard time those are 00:30 and 01:30 — different hour pillars.
    expect(earlier.normalized.localStandard).toBe("2023-11-05 00:30");
    expect(later.normalized.localStandard).toBe("2023-11-05 01:30");
    expect(earlier.pillars.hour?.branch).toBe("子");
    expect(later.pillars.hour?.branch).toBe("丑");
  });

  it("resolveWallTime is unique on ordinary days", () => {
    expect(resolveWallTime({ year: 2024, month: 8, day: 8, hour: 8, minute: 8 }, "Europe/London").kind).toBe("unique");
  });
});

// ───────────────────────── unknown time ─────────────────────────

describe("unknown birth time", () => {
  it("returns three pillars, no hour, and counts six characters", () => {
    const c = chart({ date: "1995-08-20" });
    expect(c.timeKnown).toBe(false);
    expect(c.pillars.hour).toBeNull();
    expect(c.countedCharacters).toBe(6);
    expect(Object.values(c.elementCounts).reduce((a, b) => a + b, 0)).toBe(6);
    expect(c.ambiguities).toEqual([]);
    expect(c.trueSolar).toBeNull();
    expect(c.pillars.day.name).toBe(refDayPillar(1995, 8, 20));
  });

  it("flags year and month as ambiguous when Lichun falls on that date", () => {
    const c = chart({ date: "2024-02-04" });
    expect(c.ambiguities).toEqual([
      { key: "year", candidates: ["癸卯", "甲辰"] },
      { key: "month", candidates: ["乙丑", "丙寅"] },
    ]);
  });

  it("flags only the month on an ordinary Jie day", () => {
    const c = chart({ date: "2024-03-05" }); // 惊蛰 10:23 Beijing
    expect(c.ambiguities.map((a) => a.key)).toEqual(["month"]);
  });
});

// ───────────────────────── chart structure ─────────────────────────

describe("chart structure", () => {
  it("Ten Gods relative to a 甲 day master follow the standard table", () => {
    const c = chart({ date: "1949-10-01", time: "15:00" }); // 甲子 day
    expect(c.dayMaster).toEqual({ stem: "甲", element: "wood", polarity: "yang" });
    expect(c.pillars.day.tenGod).toBeNull();
    const expected: Record<string, string> = {
      甲: "比肩",
      乙: "劫财",
      丙: "食神",
      丁: "伤官",
      戊: "偏财",
      己: "正财",
      庚: "七杀",
      辛: "正官",
      壬: "偏印",
      癸: "正印",
    };
    for (const p of [c.pillars.year, c.pillars.month, c.pillars.hour]) {
      if (p) expect(p.tenGod).toBe(expected[p.stem]);
    }
    for (const p of Object.values(c.pillars))
      for (const h of p?.hiddenStems ?? []) expect(h.tenGod).toBe(expected[h.stem]);
  });

  it("hidden stems: main first, with the standard sets for 子, 寅, 丑", () => {
    const c = chart({ date: "1949-10-01", time: "15:00" });
    expect(c.pillars.day.hiddenStems.map((h) => [h.stem, h.role])).toEqual([["癸", "main"]]);
    const yin = chart({ date: "2024-02-20", time: "12:00" }).pillars.month; // 丙寅
    expect(yin.hiddenStems.map((h) => h.stem)).toEqual(["甲", "丙", "戊"]);
    const chou = chart({ date: "2024-01-20", time: "12:00" }).pillars.month; // 乙丑
    expect(chou.hiddenStems.map((h) => h.stem)).toEqual(["己", "癸", "辛"]);
  });

  it("element counts tally the eight visible characters", () => {
    const c = chart({ date: "2000-01-01", time: "12:00" }); // 己卯 丙子 戊午 戊午
    expect(c.elementCounts).toEqual({ wood: 1, fire: 3, earth: 3, metal: 0, water: 1 });
    expect(c.countedCharacters).toBe(8);
  });

  it("is deterministic", () => {
    const input = { date: "1990-05-17", time: "08:45", timeZone: "Europe/Paris", longitude: 2.35 } as const;
    expect(calculateChart(input)).toEqual(calculateChart(input));
  });
});

// ───────────────────────── validation & true solar time ─────────────────────────

describe("invalid input never yields a chart", () => {
  it.each([
    [{ date: "2023-02-30" }, "invalid_date"],
    [{ date: "2023-13-01" }, "invalid_date"],
    [{ date: "23-01-01" }, "invalid_date"],
    [{ date: "1899-12-31" }, "out_of_range"],
    [{ date: "2101-01-01" }, "out_of_range"],
    [{ date: "2000-01-01", timeZone: "Mars/Olympus" }, "invalid_time_zone"],
    [{ date: "2000-01-01", time: "24:00" }, "invalid_time"],
    [{ date: "2000-01-01", time: "7:5" }, "invalid_time"],
  ])("%j → %s", (partial, code) => {
    expect(calculateChart({ time: null, timeZone: "Asia/Shanghai", longitude: null, ...partial })).toEqual({
      ok: false,
      code,
    });
  });

  it("accepts leap day only in leap years", () => {
    expect(calculateChart({ date: "2024-02-29", time: null, timeZone: "UTC", longitude: null }).ok).toBe(true);
    expect(calculateChart({ date: "2023-02-29", time: null, timeZone: "UTC", longitude: null }).ok).toBe(false);
  });
});

describe("true solar time (informational only)", () => {
  it("equation of time matches its well-known extremes within a minute", () => {
    expect(equationOfTimeMinutes(Date.UTC(2024, 10, 3, 12))).toBeCloseTo(16.4, 0);
    expect(equationOfTimeMinutes(Date.UTC(2024, 1, 11, 12))).toBeCloseTo(-14.2, 0);
  });

  it("Ürümqi on Beijing time is about two hours behind the sun; the chart itself is unchanged", () => {
    const withLon = chart({ date: "2024-06-15", time: "08:10", longitude: 87.6 });
    const without = chart({ date: "2024-06-15", time: "08:10" });
    expect(withLon.trueSolar?.offsetMinutes).toBeGreaterThan(-135);
    expect(withLon.trueSolar?.offsetMinutes).toBeLessThan(-125);
    expect(withLon.trueSolar?.hourPillarWouldDiffer).toBe(true);
    expect(pillarNames(withLon)).toEqual(pillarNames(without));
  });

  it("near the zone meridian the offset is small", () => {
    const c = chart({ date: "2024-04-15", time: "10:00", longitude: 120 });
    expect(Math.abs(c.trueSolar?.offsetMinutes ?? 99)).toBeLessThan(2);
    expect(c.trueSolar?.hourPillarWouldDiffer).toBe(false);
  });
});
