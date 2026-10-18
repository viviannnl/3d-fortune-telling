import { describe, expect, it } from "vitest";
import { calculateChart } from "@/features/destiny/engine";
import { destinyShareContent, tarotShareContent } from "@/features/share/content";

const today = new Date("2026-10-17T12:00:00Z");

describe("share card content", () => {
  it("tarot: exact cards, positions, and orientation; summary prefers the AI line", () => {
    const sel = [
      { cardId: "major-19-sun", orientation: "upright", position: "past" },
      { cardId: "major-16-tower", orientation: "reversed", position: "present" },
      { cardId: "major-17-star", orientation: "upright", position: "future" },
    ] as const;
    const c = tarotShareContent("love", [...sel], {
      locale: "en",
      includeDate: true,
      today,
      aiSummary: "A bright line.",
    });
    expect(c.cards.map((x) => [x.position, x.name, x.reversed])).toEqual([
      ["Past", "The Sun", false],
      ["Present", "The Tower", true],
      ["Future", "The Star", false],
    ]);
    expect(c.summary).toBe("A bright line.");
    expect(c.dateLabel).toBe("October 17, 2026");
    const fallback = tarotShareContent("love", [...sel], { locale: "zh", includeDate: false, today });
    expect(fallback.dateLabel).toBeNull();
    expect(fallback.cards[1].name).toBe("高塔");
    expect(fallback.summary.length).toBeGreaterThan(0);
  });

  it("destiny: pillars and tally only — no birth date, time, place, or timestamps anywhere", () => {
    const chart = calculateChart({ date: "1990-05-17", time: "08:45", timeZone: "Asia/Shanghai", longitude: 121.47 });
    if (!chart.ok) throw new Error("chart");
    const c = destinyShareContent(chart, { locale: "en", includeDate: false, today });
    expect(c.pillars.map((p) => p.stem + p.branch)).toEqual(["庚午", "辛巳", "壬午", "甲辰"]);
    expect(c.dateLabel).toBeNull();
    const text = JSON.stringify(c);
    for (const secret of ["1990", "05-17", "5/17", "May", "08:45", "07:45", "Shanghai", "121", "Asia/"]) {
      expect(text, secret).not.toContain(secret);
    }
  });

  it("destiny: the optional date is the reading date, not the birth date", () => {
    const chart = calculateChart({ date: "1990-05-17", time: null, timeZone: "Asia/Shanghai", longitude: null });
    if (!chart.ok) throw new Error("chart");
    const c = destinyShareContent(chart, { locale: "en", includeDate: true, today });
    expect(c.dateLabel).toBe("October 17, 2026");
    expect(c.pillars).toHaveLength(3);
  });
});
