import { isRevealed, slotOf, SPREAD_SIZE, type ReadingState } from "@/features/tarot/reading";

/** Positions are local to the Tarot Garden island; the table top sits at y ≈ 1.02. */
export interface CardTarget {
  position: [number, number, number];
  /** Euler XYZ of the card's resting pose (before the flip). */
  rotation: [number, number, number];
  scale: number;
  /** 0 = face up toward the viewer, π = face down. */
  flip: number;
  /** Interactive in the current phase. */
  interactive: boolean;
  /** 0..1, lowered for cards that should recede. */
  presence: number;
}

export const FAN_CARD_WIDTH = 0.3;
export const SPREAD_SCALE = 1.75;

const TABLE_Y = 1.02;
const FAN = { center: [0, 1.66, 0.42] as const, radius: 1.3, spread: (62 * Math.PI) / 180 };
const SPREAD = { x: [-0.74, 0, 0.74] as const, y: 1.56, z: 1.32, tilt: -0.5 };
const STACK = { x: 0, z: 0.1 };
const HOVER_LIFT = 0.07;

function stack(index: number): Pick<CardTarget, "position" | "rotation"> {
  return {
    position: [STACK.x, TABLE_Y + 0.006 + index * 0.0035, STACK.z],
    rotation: [-Math.PI / 2, 0, (index % 2 === 0 ? 1 : -1) * 0.012 * (index % 5)],
  };
}

function fan(index: number, count: number): Pick<CardTarget, "position" | "rotation"> {
  const t = count === 1 ? 0.5 : index / (count - 1);
  const a = (t - 0.5) * 2 * FAN.spread;
  const [cx, cy, cz] = FAN.center;
  return {
    position: [
      cx + Math.sin(a) * FAN.radius,
      cy - (1 - Math.cos(a)) * FAN.radius * 0.55,
      cz - Math.abs(a) * 0.08 + index * 0.0015,
    ],
    rotation: [-0.32, 0, -a * 0.55],
  };
}

/** Pure mapping from reading state to where a deck card should rest. */
export function cardTarget(state: ReadingState, deckIndex: number, hovered: number | null): CardTarget {
  const count = state.deck.length;
  const slot = slotOf(state, deckIndex);

  if (slot >= 0) {
    const revealed = isRevealed(state, slot);
    const nextToReveal = state.phase === "revealing" && slot === state.revealed;
    const lift = nextToReveal && hovered === deckIndex ? HOVER_LIFT : 0;
    return {
      position: [SPREAD.x[slot], SPREAD.y + lift, SPREAD.z],
      rotation: [SPREAD.tilt, 0, 0],
      scale: SPREAD_SCALE,
      flip: revealed ? 0 : Math.PI,
      interactive: nextToReveal,
      presence: 1,
    };
  }

  if (state.phase === "drawing") {
    const base = fan(deckIndex, count);
    const lift = hovered === deckIndex ? HOVER_LIFT : 0;
    return {
      position: [base.position[0], base.position[1] + lift, base.position[2] + lift * 0.6],
      rotation: base.rotation,
      scale: 1,
      flip: Math.PI,
      interactive: true,
      presence: 1,
    };
  }

  // Choosing, or the spread is complete: unpicked cards settle into a quiet stack.
  const quiet = state.phase === "revealing" || state.phase === "complete";
  return { ...stack(deckIndex), scale: 1, flip: Math.PI, interactive: false, presence: quiet ? 0.35 : 1 };
}

export const SPREAD_SLOTS = SPREAD_SIZE;
