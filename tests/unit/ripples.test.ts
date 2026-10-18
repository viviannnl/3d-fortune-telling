import { beforeEach, describe, expect, it } from "vitest";
import { emitRipple, rippleLiftAt, ripples, RIPPLE_LIFE, RIPPLE_SPEED } from "@/components/world/garden/ripplePool";

function clear() {
  // Expire everything by reading far in the future.
  rippleLiftAt(0, 0, 1e6);
}

describe("water ripples", () => {
  beforeEach(clear);

  it("activates a slot per emit and reuses the pool without growing", () => {
    const size = ripples().length;
    for (let i = 0; i < size * 3; i++) emitRipple(i, 0, 100);
    expect(ripples().length).toBe(size);
    expect(ripples().every((r) => r.active)).toBe(true);
  });

  it("lifts points at the travelling wavefront, not at the centre", () => {
    emitRipple(0, 0, 10);
    const age = 0.5;
    const radius = age * RIPPLE_SPEED;
    const atCrest = rippleLiftAt(radius, 0, 10 + age);
    const atCentre = rippleLiftAt(0, 0, 10 + age);
    const farAway = rippleLiftAt(radius + 6, 0, 10 + age);
    expect(atCrest).toBeGreaterThan(0.01);
    expect(atCentre).toBeLessThan(atCrest);
    expect(farAway).toBeLessThan(1e-6);
  });

  it("fades out and releases its slot after its lifetime", () => {
    emitRipple(2, 3, 0);
    const early = rippleLiftAt(2 + 0.2 * RIPPLE_SPEED, 3, 0.2);
    const late = rippleLiftAt(2 + 2.0 * RIPPLE_SPEED, 3, 2.0);
    expect(early).toBeGreaterThan(late);
    expect(rippleLiftAt(2, 3, RIPPLE_LIFE + 0.1)).toBe(0);
    expect(ripples().every((r) => !r.active)).toBe(true);
  });

  it("sums overlapping ripples", () => {
    emitRipple(0, 0, 0);
    emitRipple(0.05, 0, 0);
    const d = 0.3 * RIPPLE_SPEED;
    expect(rippleLiftAt(d, 0, 0.3)).toBeGreaterThan(0.02);
  });
});
