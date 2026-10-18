/**
 * Water ripples, kept outside React so a click never triggers a re-render and
 * other components (lily pads, lanterns) can read the same pool each frame.
 */

export interface Ripple {
  x: number;
  z: number;
  /** Seconds, from the render clock. */
  born: number;
  active: boolean;
}

export const RIPPLE_LIFE = 2.6;
export const RIPPLE_SPEED = 3.4;
const POOL = 8;

const pool: Ripple[] = Array.from({ length: POOL }, () => ({ x: 0, z: 0, born: 0, active: false }));
let cursor = 0;

export function emitRipple(x: number, z: number, now: number): void {
  const slot = pool[cursor];
  cursor = (cursor + 1) % POOL;
  slot.x = x;
  slot.z = z;
  slot.born = now;
  slot.active = true;
}

export function ripples(): readonly Ripple[] {
  return pool;
}

/**
 * Vertical displacement a point feels from the active ripples: a single wave
 * crest travelling outward, fading with age and distance.
 */
export function rippleLiftAt(x: number, z: number, now: number): number {
  let lift = 0;
  for (const r of pool) {
    if (!r.active) continue;
    const age = now - r.born;
    if (age < 0 || age > RIPPLE_LIFE) {
      r.active = false;
      continue;
    }
    const radius = age * RIPPLE_SPEED;
    const d = Math.hypot(x - r.x, z - r.z);
    const offset = d - radius;
    // A narrow crest at the wavefront.
    const crest = Math.exp(-(offset * offset) / 0.5);
    lift += crest * (1 - age / RIPPLE_LIFE) * 0.07;
  }
  return lift;
}
