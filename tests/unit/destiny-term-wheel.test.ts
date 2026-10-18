import { describe, expect, it } from "vitest";
import { calculateChart } from "@/features/destiny/engine";
import { allJieMarks, JIE_BY_BRANCH, termMarkForBranch, TERMS_FROM_LICHUN } from "@/features/destiny/solarTermWheel";
import { BRANCHES } from "@/features/destiny/symbols";

describe("solar term wheel", () => {
  it("lists the 24 terms once each, starting at 立春", () => {
    expect(TERMS_FROM_LICHUN).toHaveLength(24);
    expect(new Set(TERMS_FROM_LICHUN).size).toBe(24);
    expect(TERMS_FROM_LICHUN[0]).toBe("立春");
    expect(TERMS_FROM_LICHUN[23]).toBe("大寒");
  });

  it("maps every branch to a distinct Jie, two marks apart on the ring", () => {
    const marks = allJieMarks();
    expect(marks).toHaveLength(12);
    expect(new Set(marks.map((m) => m.term)).size).toBe(12);
    // The twelve Jie are the even positions counted from 立春.
    for (const m of marks) expect(m.index % 2).toBe(0);
  });

  it("follows the branch cycle in order: 寅 opens 立春, then every second term", () => {
    expect(termMarkForBranch("寅")).toEqual({ term: "立春", index: 0 });
    expect(termMarkForBranch("卯")).toEqual({ term: "惊蛰", index: 2 });
    expect(termMarkForBranch("子")).toEqual({ term: "大雪", index: 20 });
    expect(termMarkForBranch("丑")).toEqual({ term: "小寒", index: 22 });
    // Walking the branch cycle from 寅 advances the ring by two each time.
    const order = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
    order.forEach((branch, i) => expect(termMarkForBranch(branch)?.index).toBe(i * 2));
  });

  it("rejects anything that is not an earthly branch", () => {
    expect(termMarkForBranch("甲")).toBeNull();
    expect(termMarkForBranch("")).toBeNull();
    expect(Object.keys(JIE_BY_BRANCH).sort()).toEqual(BRANCHES.map((b) => b.char).sort());
  });

  it("agrees with the engine: a chart's month branch marks the term it was born under", () => {
    // 2024-02-20 is after 立春 (Feb 4) and before 惊蛰, so the month pillar is 寅.
    const chart = calculateChart({ date: "2024-02-20", time: "12:00", timeZone: "Asia/Shanghai", longitude: null });
    if (!chart.ok) throw new Error("chart");
    expect(chart.pillars.month.branch).toBe("寅");
    expect(termMarkForBranch(chart.pillars.month.branch)?.term).toBe("立春");

    // 2024-10-20 falls in the 寒露 month, whose branch is 戌.
    const autumn = calculateChart({ date: "2024-10-20", time: "12:00", timeZone: "Asia/Shanghai", longitude: null });
    if (!autumn.ok) throw new Error("chart");
    expect(autumn.pillars.month.branch).toBe("戌");
    expect(termMarkForBranch(autumn.pillars.month.branch)?.term).toBe("寒露");
  });
});
