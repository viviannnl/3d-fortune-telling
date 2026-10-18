import { create } from "zustand";
import { INTRO_SEEN_KEY } from "@/lib/introKey";

/**
 * The entrance: a moon gate, then the night assembling itself — stars, the
 * moon rising, moonlight on the water, lanterns, fireflies — while the camera
 * descends to the terrace.
 *
 * The 3D scene reads `introProgress()` every frame (no React state per frame);
 * React only sees the discrete phase changes.
 */

export type IntroPhase =
  /** Waiting for the visitor at the moon gate. */
  | "gate"
  /** Entered, but the world is still loading. */
  | "waiting"
  | "playing"
  | "done";

/** Seconds for the full descent, and the short version on later loads in a session. */
export const FULL_SECONDS = 6.5;
export const SHORT_SECONDS = 2.4;
/** A click or key during the descent finishes it this quickly instead. */
const SKIP_SECONDS = 0.8;

// Mirrored on <html data-intro> by an inline script in the root layout, so the gate never flashes.
export { INTRO_SEEN_KEY };

interface IntroState {
  phase: IntroPhase;
  /** True for the full entrance through the gate; false for the short one. */
  full: boolean;
  /** performance.now() when the descent began. */
  startedAt: number | null;
  seconds: number;
  /** Progress and time when the visitor asked to skip. */
  skip: { from: number; at: number } | null;
  /** The world has finished loading, or will never load (no WebGL). */
  settled: boolean;
  /** Visitor walked through the gate. */
  enter: (reducedMotion: boolean) => void;
  /** A later load in the same session: no gate, a short descent. */
  resume: (reducedMotion: boolean) => void;
  /** `noWorld`: WebGL is unavailable, so there is nothing to descend into. */
  settle: (noWorld?: boolean) => void;
  skipToEnd: () => void;
  finish: () => void;
}

function begin(seconds: number) {
  return { phase: "playing" as const, startedAt: performance.now(), seconds, skip: null };
}

export const useIntro = create<IntroState>()((set, get) => ({
  phase: "gate",
  full: true,
  startedAt: null,
  seconds: FULL_SECONDS,
  skip: null,
  settled: false,
  enter: (reducedMotion) => {
    if (get().phase !== "gate") return;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "seen");
    } catch {
      // Storage can be unavailable (private mode); the gate simply shows again next load.
    }
    const seconds = reducedMotion || get().seconds < 0.01 ? 0.001 : FULL_SECONDS;
    set(get().settled ? { full: true, ...begin(seconds) } : { full: true, phase: "waiting", seconds });
  },
  resume: (reducedMotion) => {
    if (get().phase !== "gate") return;
    const seconds = reducedMotion || get().seconds < 0.01 ? 0.001 : SHORT_SECONDS;
    set(get().settled ? { full: false, ...begin(seconds) } : { full: false, phase: "waiting", seconds });
  },
  settle: (noWorld = false) => {
    const { settled, phase } = get();
    if (settled) return;
    const seconds = noWorld ? 0.001 : get().seconds;
    set(phase === "waiting" ? { settled: true, ...begin(seconds) } : { settled: true, seconds });
  },
  skipToEnd: () => {
    const { phase, skip } = get();
    if (phase !== "playing" || skip) return;
    set({ skip: { from: introProgress(), at: performance.now() } });
  },
  finish: () => {
    if (get().phase === "playing") set({ phase: "done" });
  },
}));

/** 0 at the gate, rising to 1 as the descent completes. */
export function introProgress(now = performance.now()): number {
  const { phase, startedAt, seconds, skip } = useIntro.getState();
  if (phase === "done") return 1;
  if (phase !== "playing" || startedAt === null) return 0;
  if (skip) return Math.min(1, skip.from + (1 - skip.from) * Math.min(1, (now - skip.at) / (SKIP_SECONDS * 1000)));
  return Math.min(1, (now - startedAt) / (seconds * 1000));
}

/** Seconds until the descent completes from now, for scheduling the end. */
export function introRemainingMs(now = performance.now()): number {
  const { phase, startedAt, seconds, skip } = useIntro.getState();
  if (phase !== "playing" || startedAt === null) return 0;
  if (skip) return Math.max(0, SKIP_SECONDS * 1000 - (now - skip.at));
  return Math.max(0, seconds * 1000 - (now - startedAt));
}

/** Smooth 0→1 of `p` across [a, b]. */
export function ramp(p: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
