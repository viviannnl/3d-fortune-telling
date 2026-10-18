/**
 * Informational true-solar-time estimate. The MVP chart does NOT use it;
 * it is shown so users near an hour boundary know the hour pillar could
 * differ under the true-solar-time convention.
 */

/** Equation of time in minutes (NOAA approximation, accurate to ~±1 min). */
export function equationOfTimeMinutes(instantMs: number): number {
  const d = new Date(instantMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((instantMs - start) / 86_400_000) + 1;
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  );
}

/**
 * Minutes to add to local *standard* time to get apparent (true) solar time:
 * longitude correction (4 min per degree from the zone meridian) + equation of time.
 */
export function trueSolarOffsetMinutes(instantMs: number, longitude: number, standardOffsetMinutes: number): number {
  return longitude * 4 - standardOffsetMinutes + equationOfTimeMinutes(instantMs);
}
