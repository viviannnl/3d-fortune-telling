import { describe, expect, it } from "vitest";
import { calculateChart } from "@/features/destiny/engine";
import { EMPTY_FORM, OTHER_PLACE, parseBirthForm } from "@/features/destiny/validation";
import { elementVisual, VISUAL_RULES } from "@/features/destiny/visualMapping";
import { CITIES } from "@/features/destiny/cities";
import { isValidTimeZone } from "@/features/destiny/zonedTime";

const TODAY = "2026-10-17";
const valid = { ...EMPTY_FORM, date: "1990-05-17", time: "08:45", placeId: "shanghai" };

describe("parseBirthForm", () => {
  it("accepts a complete form and resolves the city", () => {
    expect(parseBirthForm(valid, TODAY)).toEqual({
      ok: true,
      input: { date: "1990-05-17", time: "08:45", timeZone: "Asia/Shanghai", longitude: 121.47, fold: undefined },
    });
  });

  it("reports every missing required field at once", () => {
    expect(parseBirthForm(EMPTY_FORM, TODAY)).toEqual({
      ok: false,
      errors: { date: "date_required", time: "time_required", place: "place_required" },
    });
  });

  it("unknown time: time not required and passed as null", () => {
    const r = parseBirthForm({ ...valid, timeKnown: false, time: "" }, TODAY);
    expect(r.ok && r.input.time).toBeNull();
  });

  it.each([
    ["2023-02-30", "date_invalid"],
    ["1990/05/17", "date_invalid"],
    ["1899-12-31", "date_out_of_range"],
    ["2026-10-18", "date_in_future"],
  ])("date %s → %s", (date, code) => {
    expect(parseBirthForm({ ...valid, date }, TODAY)).toEqual({ ok: false, errors: { date: code } });
  });

  it.each(["24:00", "12:60", "noon", "7:30"])("rejects time %s", (time) => {
    expect(parseBirthForm({ ...valid, time }, TODAY)).toEqual({ ok: false, errors: { time: "time_invalid" } });
  });

  it("accepts HH:MM:SS from browsers that send seconds, dropping them", () => {
    const r = parseBirthForm({ ...valid, time: "08:45:00" }, TODAY);
    expect(r.ok && r.input.time).toBe("08:45");
  });

  it("other place: requires a real IANA zone, longitude optional but bounded", () => {
    const other = { ...valid, placeId: OTHER_PLACE };
    expect(parseBirthForm({ ...other, timeZone: "Not/AZone" }, TODAY)).toEqual({
      ok: false,
      errors: { timeZone: "time_zone_invalid" },
    });
    expect(parseBirthForm({ ...other, timeZone: "Europe/Lisbon", longitude: "200" }, TODAY)).toEqual({
      ok: false,
      errors: { longitude: "longitude_invalid" },
    });
    const r = parseBirthForm({ ...other, timeZone: "Europe/Lisbon", longitude: "" }, TODAY);
    expect(r.ok && r.input).toMatchObject({ timeZone: "Europe/Lisbon", longitude: null });
  });

  it("rejects unknown city ids and unexpected fields", () => {
    expect(parseBirthForm({ ...valid, placeId: "atlantis" }, TODAY)).toEqual({
      ok: false,
      errors: { place: "place_required" },
    });
    expect(parseBirthForm({ ...valid, extra: 1 }, TODAY).ok).toBe(false);
    expect(parseBirthForm("nope", TODAY).ok).toBe(false);
  });

  it("every curated city has a valid zone and longitude, and charts successfully", () => {
    for (const city of CITIES) {
      expect(isValidTimeZone(city.timeZone), city.id).toBe(true);
      expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
      const r = parseBirthForm({ ...valid, placeId: city.id }, TODAY);
      if (!r.ok) throw new Error(city.id);
      expect(calculateChart(r.input).ok).toBe(true);
    }
    expect(new Set(CITIES.map((x) => x.id)).size).toBe(CITIES.length);
  });
});

describe("element visual mapping", () => {
  it("scales linearly with the tally and marks absent elements", () => {
    expect(elementVisual(0, "wood", "fire")).toMatchObject({
      scale: VISUAL_RULES.baseScale,
      present: false,
      isDayMaster: false,
    });
    expect(elementVisual(3, "fire", "fire")).toMatchObject({ present: true, isDayMaster: true });
    expect(elementVisual(3, "fire", "fire").scale).toBeCloseTo(
      VISUAL_RULES.baseScale + 3 * VISUAL_RULES.scalePerCharacter,
    );
    expect(elementVisual(4, "water", null).scale).toBeGreaterThan(elementVisual(2, "water", null).scale);
  });

  it("clamps out-of-range counts", () => {
    expect(elementVisual(-3, "metal", null)).toEqual(elementVisual(0, "metal", null));
    expect(elementVisual(99, "metal", null)).toEqual(elementVisual(8, "metal", null));
  });
});
