import { describe, expect, it } from "vitest";
import { DAY_MOODS, SEASONS } from "@/features/sky/celestial";
import { MOOD_PALETTES, SEASON_PALETTES } from "@/features/sky/palette";

const HEX = /^#[0-9a-f]{6}$/i;

/** Relative luminance, for ordering night moods by brightness. */
function luminance(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

describe("mood palettes", () => {
  it("cover every mood with valid colours", () => {
    for (const mood of DAY_MOODS) {
      const p = MOOD_PALETTES[mood];
      for (const [key, value] of Object.entries(p)) {
        if (typeof value === "string") expect(value, `${mood}.${key}`).toMatch(HEX);
      }
      expect(p.ambientIntensity).toBeGreaterThan(0.4);
      expect(p.ambientIntensity).toBeLessThanOrEqual(1);
      expect(p.horizonWarmth).toBeGreaterThanOrEqual(0);
      expect(p.horizonWarmth).toBeLessThanOrEqual(1);
    }
  });

  it("gets darkest at deep night and brightest in daylight hours", () => {
    const zenith = (m: (typeof DAY_MOODS)[number]) => luminance(MOOD_PALETTES[m].zenith);
    expect(zenith("deepNight")).toBeLessThan(zenith("night"));
    expect(zenith("night")).toBeLessThan(zenith("day"));
    expect(zenith("dawn")).toBeGreaterThan(zenith("deepNight"));
    // Every mood stays a night sky: nothing approaches daylight luminance.
    for (const mood of DAY_MOODS) expect(zenith(mood)).toBeLessThan(0.1);
  });

  it("warms the horizon only at dusk and dawn", () => {
    expect(MOOD_PALETTES.dusk.horizonWarmth).toBeGreaterThan(0.5);
    expect(MOOD_PALETTES.dawn.horizonWarmth).toBeGreaterThan(0.5);
    expect(MOOD_PALETTES.night.horizonWarmth).toBe(0);
    expect(MOOD_PALETTES.deepNight.horizonWarmth).toBe(0);
  });
});

describe("season palettes", () => {
  it("cover every season with complete, valid colour sets", () => {
    for (const season of SEASONS) {
      const p = SEASON_PALETTES[season];
      expect(p.flowers.length).toBeGreaterThanOrEqual(5);
      expect(p.leaves.length).toBeGreaterThanOrEqual(3);
      expect(p.driftColors.length).toBeGreaterThanOrEqual(3);
      expect(p.pads.length).toBe(3);
      for (const hex of [
        ...p.flowers,
        ...p.leaves,
        ...p.driftColors,
        ...p.pads,
        p.spike,
        p.spikeEmissive,
        p.cascadeDeep,
        p.cascadePale,
        p.cascadeEmissive,
      ]) {
        expect(hex, `${season}`).toMatch(HEX);
      }
      expect(p.shore).toHaveLength(3);
      for (const channel of p.shore) {
        expect(channel).toBeGreaterThan(0);
        expect(channel).toBeLessThan(128);
      }
    }
  });

  it("gives each season a distinct look", () => {
    const signatures = SEASONS.map((s) => SEASON_PALETTES[s].flowers.join("|"));
    expect(new Set(signatures).size).toBe(SEASONS.length);
    // Winter drifts are snow-white; autumn drifts are warm.
    expect(SEASON_PALETTES.winter.driftColors).toContain("#ffffff");
    expect(luminance(SEASON_PALETTES.autumn.leaves[0])).toBeLessThan(luminance(SEASON_PALETTES.winter.flowers[0]));
  });
});
