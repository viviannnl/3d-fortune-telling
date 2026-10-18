/**
 * The single, explicit calculation convention for the MVP. Shown to users on the
 * About page and in the chart, and sent verbatim to the interpretation service.
 */
export const CONVENTION = {
  id: "bazi-mvp-1",
  library: "tyme4ts 1.5.x (6tail, MIT); solar terms from the ShouXing astronomical algorithms (sxwnl)",
  supportedYears: { min: 1900, max: 2100 },
  rules: [
    "Year pillar changes at the exact instant of Lichun (立春), not on the lunar new year.",
    "Month pillar changes at the exact instant of each of the twelve Jie (节) solar terms.",
    "Solar-term instants are computed in China Standard Time (UTC+8); a birth anywhere is compared at the same absolute instant.",
    "Day and hour pillars use the birthplace's local standard clock time; any daylight-saving hour is removed.",
    "Day boundary: the day pillar advances at 23:00 local standard time (the start of the Zi hour, 子初换日).",
    "Hour pillars are the twelve two-hour Shichen (时辰) starting at 23:00; the hour stem follows the day stem (五鼠遁).",
    "True solar time is NOT applied. Its estimated offset is shown for information only.",
    "Unknown birth time: only the year, month, and day pillars are calculated; if a Jie solar term falls on that date, the affected pillar is reported as ambiguous.",
    "Element counts are a simple tally of the visible stems and the principal element of each branch. Hidden stems are listed but not counted. This is not a strength (旺衰) assessment.",
  ],
} as const;

export type Convention = typeof CONVENTION;
