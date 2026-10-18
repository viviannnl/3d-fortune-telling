import { describe, expect, it } from "vitest";
import {
  DAY_MOODS,
  MOON_PHASE_NAMES,
  MOON_PHASES,
  moodForHour,
  moonStateAt,
  skyStateAt,
  SEASONS,
} from "@/features/sky/celestial";
import hko from "../fixtures/hko-moon-phases.json";

/** HKO publishes Hong Kong Time (UTC+8). */
const instant = (p: { year: number; month: number; day: number; hour: number; minute: number }) =>
  Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - 8 * 3_600_000;

const NEW = 0;
const FULL = 2;

describe("moon phase vs the Hong Kong Observatory (2018–2028)", () => {
  const newMoons = hko.phases.filter((p) => p.p === NEW);
  const fullMoons = hko.phases.filter((p) => p.p === FULL);

  it("covers a decade of published phases", () => {
    expect(newMoons.length).toBeGreaterThan(100);
    expect(fullMoons.length).toBeGreaterThan(100);
  });

  it("illumination is ~0 at every published new moon", () => {
    const worst = { illumination: 0, label: "" };
    for (const p of newMoons) {
      const { illumination } = moonStateAt(instant(p));
      if (illumination > worst.illumination) {
        Object.assign(worst, { illumination, label: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` });
      }
    }
    // A one-hour error in the new-moon instant moves illumination by only ~0.1%.
    expect(worst.illumination, worst.label).toBeLessThan(0.01);
  });

  it("illumination is ~1 at every published full moon", () => {
    const worst = { illumination: 1, label: "" };
    for (const p of fullMoons) {
      const { illumination } = moonStateAt(instant(p));
      if (illumination < worst.illumination) {
        Object.assign(worst, { illumination, label: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` });
      }
    }
    expect(worst.illumination, worst.label).toBeGreaterThan(0.99);
  });

  it("the new-moon age is within ~30 minutes of the published instant", () => {
    const worst = { minutes: 0, label: "" };
    for (const p of newMoons) {
      const ms = instant(p);
      const { age } = moonStateAt(ms);
      // Age is measured from the new moon, so it is ~0 (or ~1 just before the next one).
      const minutes = Math.min(age, 1 - age) * 29.530588 * 24 * 60;
      if (minutes > worst.minutes) {
        Object.assign(worst, { minutes, label: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` });
      }
    }
    expect(worst.minutes, worst.label).toBeLessThan(30);
  });

  it("names the phase consistently with the rendered disc", () => {
    for (const p of hko.phases) {
      const { phase, illumination, waxing } = moonStateAt(instant(p));
      if (p.p === NEW) expect(phase).toBe("new");
      if (p.p === FULL) expect(phase).toBe("full");
      if (p.p === 1) expect([phase, waxing]).toEqual(["firstQuarter", true]);
      if (p.p === 3) expect([phase, waxing]).toEqual(["lastQuarter", false]);
      // Quarters are half lit; the label and the lit fraction never disagree.
      if (p.p === 1 || p.p === 3) expect(Math.abs(illumination - 0.5)).toBeLessThan(0.02);
    }
  });

  it("waxes from new to full and wanes back, monotonically across one month", () => {
    // One hour past the new moon: at the exact instant, "waxing" is meaningless
    // and HKO's minute-rounded time can fall a few seconds before it.
    const start = instant(newMoons.find((p) => p.year === 2026 && p.month === 10) ?? newMoons[0]) + 3_600_000;
    let previous = -1;
    for (let d = 0; d < 12; d++) {
      const { illumination, waxing } = moonStateAt(start + d * 86_400_000);
      expect(waxing).toBe(true);
      expect(illumination).toBeGreaterThan(previous);
      previous = illumination;
    }
    previous = 2; // reset before the waning half
    for (let d = 17; d < 27; d++) {
      const { illumination, waxing } = moonStateAt(start + d * 86_400_000);
      expect(waxing).toBe(false);
      expect(illumination).toBeLessThan(previous);
      previous = illumination;
    }
  });
});

describe("sky state", () => {
  it("reports the Chinese lunar date and solar term for the instant", () => {
    // 2026-10-17 22:00 Beijing: 农历九月初八, ten days into 寒露.
    const ms = Date.UTC(2026, 9, 17, 14, 0);
    const sky = skyStateAt(ms, "Asia/Shanghai");
    expect(sky.lunar.full).toContain("九月初八");
    expect(sky.lunar.dayName).toBe("初八");
    expect(sky.solarTerm.name).toBe("寒露");
    expect(sky.solarTerm.dayIndex).toBe(10);
    expect(sky.season).toBe("autumn");
  });

  it("uses the same absolute instant for every viewer, but their own clock for mood", () => {
    const ms = Date.UTC(2026, 9, 17, 14, 0);
    const shanghai = skyStateAt(ms, "Asia/Shanghai"); // 22:00 local
    const newYork = skyStateAt(ms, "America/New_York"); // 10:00 local
    expect(newYork.lunar.full).toBe(shanghai.lunar.full);
    expect(newYork.moon.illumination).toBe(shanghai.moon.illumination);
    expect(shanghai.localHour).toBe(22);
    expect(newYork.localHour).toBe(10);
    expect(shanghai.mood).toBe("night");
    expect(newYork.mood).toBe("day");
  });

  it.each([
    ["立春", "spring", Date.UTC(2026, 1, 10)],
    ["夏至", "summer", Date.UTC(2026, 5, 25)],
    ["白露", "autumn", Date.UTC(2026, 8, 12)],
    ["大雪", "winter", Date.UTC(2026, 11, 10)],
  ])("maps %s to %s", (term, season, ms) => {
    const sky = skyStateAt(ms, "Asia/Shanghai");
    expect(sky.solarTerm.name).toBe(term);
    expect(sky.season).toBe(season);
  });

  it("every solar term in a year maps to a known season", () => {
    for (let d = 0; d < 365; d += 3) {
      const sky = skyStateAt(Date.UTC(2026, 0, 1) + d * 86_400_000, "Asia/Shanghai");
      expect(SEASONS, sky.solarTerm.name).toContain(sky.season);
      expect(sky.solarTerm.dayIndex).toBeGreaterThanOrEqual(1);
      expect(sky.solarTerm.dayIndex).toBeLessThan(20);
    }
  });
});

describe("time of day", () => {
  it("covers all 24 hours with a known mood", () => {
    for (let h = 0; h < 24; h++) expect(DAY_MOODS).toContain(moodForHour(h));
  });

  it.each([
    [18, "dusk"],
    [21, "night"],
    [23, "deepNight"],
    [2, "deepNight"],
    [5, "dawn"],
    [12, "day"],
  ])("hour %i is %s", (hour, mood) => {
    expect(moodForHour(hour)).toBe(mood);
  });
});

describe("phase names", () => {
  it("are bilingual and complete", () => {
    for (const id of MOON_PHASES) {
      expect(MOON_PHASE_NAMES[id].en.trim().length).toBeGreaterThan(2);
      expect(MOON_PHASE_NAMES[id].zh.trim().length).toBeGreaterThan(1);
    }
  });
});
