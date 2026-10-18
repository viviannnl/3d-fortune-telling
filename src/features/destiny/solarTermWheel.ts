import { BRANCHES } from "./symbols";

/**
 * The twelve Jie (节) solar terms that open each solar month, in branch order,
 * and where each sits on the 24-mark ring. Derived from the month pillar's
 * branch, so it needs no extra calculation and cannot drift from the chart.
 */
export const JIE_BY_BRANCH: Record<string, string> = {
  寅: "立春",
  卯: "惊蛰",
  辰: "清明",
  巳: "立夏",
  午: "芒种",
  未: "小暑",
  申: "立秋",
  酉: "白露",
  戌: "寒露",
  亥: "立冬",
  子: "大雪",
  丑: "小寒",
};

/** The 24 terms in calendar order, starting at 立春. */
export const TERMS_FROM_LICHUN = [
  "立春",
  "雨水",
  "惊蛰",
  "春分",
  "清明",
  "谷雨",
  "立夏",
  "小满",
  "芒种",
  "夏至",
  "小暑",
  "大暑",
  "立秋",
  "处暑",
  "白露",
  "秋分",
  "寒露",
  "霜降",
  "立冬",
  "小雪",
  "大雪",
  "冬至",
  "小寒",
  "大寒",
] as const;

export interface TermMark {
  /** The Jie that opened this solar month. */
  term: string;
  /** Index 0–23 on the ring, counted from 立春. */
  index: number;
}

/** Which mark on the ring a chart's month pillar corresponds to. */
export function termMarkForBranch(branch: string): TermMark | null {
  const term = JIE_BY_BRANCH[branch];
  if (!term) return null;
  const index = TERMS_FROM_LICHUN.indexOf(term as (typeof TERMS_FROM_LICHUN)[number]);
  return index < 0 ? null : { term, index };
}

/** Every branch maps to a Jie, so the ring always has exactly twelve marked positions. */
export function allJieMarks(): TermMark[] {
  return BRANCHES.map((b) => termMarkForBranch(b.char)).filter((m): m is TermMark => m !== null);
}
