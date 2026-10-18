/** A source of uniformly distributed numbers in [0, 1). Injected so tests can be deterministic. */
export type RandomSource = () => number;

/** Small, fast, seedable PRNG (mulberry32). For tests and reproducible demos only. */
export function seededRandom(seed: number): RandomSource {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cryptographically strong source for real readings. */
export const cryptoRandom: RandomSource = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
};

function checked(rng: RandomSource): number {
  const x = rng();
  if (!(x >= 0 && x < 1)) throw new RangeError(`RandomSource returned ${x}; expected a number in [0, 1)`);
  return x;
}

/** Uniform integer in [0, n). */
export function randomInt(rng: RandomSource, n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new RangeError(`randomInt needs a positive integer bound, got ${n}`);
  return Math.floor(checked(rng) * n);
}

/** True with probability p. */
export function randomChance(rng: RandomSource, p: number): boolean {
  return checked(rng) < p;
}
