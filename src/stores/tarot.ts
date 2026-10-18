import { create } from "zustand";
import { CARD_IDS } from "@/features/tarot/cards";
import { shuffleDeck } from "@/features/tarot/deck";
import { cryptoRandom, randomInt, type RandomSource } from "@/features/tarot/random";
import { INITIAL_READING, readingReducer, type ReadingEvent, type ReadingState } from "@/features/tarot/reading";
import type { Category } from "@/features/tarot/types";

/** Minimum time between reveals so each flip reads as its own moment. */
export const REVEAL_INTERVAL_MS = 650;

interface TarotStore {
  reading: ReadingState;
  panelOpen: boolean;
  /** Time of the last reveal, or of completing the spread — reveals are paced from here. */
  lastRevealAt: number;
  /** True during the pacing interval; drives the disabled state of the reveal control. */
  pacing: boolean;
  begin: (category: Category) => void;
  pick: (deckIndex: number, now?: number) => boolean;
  /** Accessible alternative to choosing in 3D: picks a random card still in the fan. */
  pickRandom: (now?: number) => boolean;
  /** Reveals the next card; returns false if rejected (wrong phase or too soon). */
  reveal: (now?: number) => boolean;
  reset: () => void;
  setPanelOpen: (open: boolean) => void;
}

let rng: RandomSource = cryptoRandom;
/** Test hook: swap the randomness source. */
export function setTarotRandomSource(source: RandomSource) {
  rng = source;
}

export const useTarot = create<TarotStore>()((set, get) => {
  const dispatch = (event: ReadingEvent): boolean => {
    const prev = get().reading;
    const next = readingReducer(prev, event);
    if (next === prev) return false;
    set({ reading: next });
    return true;
  };

  let pacingTimer: ReturnType<typeof setTimeout> | undefined;
  const startPacing = (now: number) => {
    clearTimeout(pacingTimer);
    set({ lastRevealAt: now, pacing: true });
    pacingTimer = setTimeout(() => set({ pacing: false }), REVEAL_INTERVAL_MS);
  };

  // Completing the spread starts the pacing clock, so a carried-over rapid click can't flip a card.
  const pickAt = (deckIndex: number, now: number): boolean => {
    const ok = dispatch({ type: "pick", deckIndex });
    if (ok && get().reading.phase === "revealing") startPacing(now);
    return ok;
  };

  return {
    reading: INITIAL_READING,
    panelOpen: false,
    lastRevealAt: 0,
    pacing: false,
    begin: (category) => {
      dispatch({ type: "begin", category, deck: shuffleDeck(CARD_IDS, rng) });
    },
    pick: (deckIndex, now = Date.now()) => pickAt(deckIndex, now),
    pickRandom: (now = Date.now()) => {
      const { reading } = get();
      if (reading.phase !== "drawing") return false;
      const remaining = reading.deck.map((_, i) => i).filter((i) => !reading.picks.includes(i));
      return pickAt(remaining[randomInt(rng, remaining.length)], now);
    },
    reveal: (now = Date.now()) => {
      if (now - get().lastRevealAt < REVEAL_INTERVAL_MS) return false;
      const ok = dispatch({ type: "reveal" });
      if (ok) startPacing(now);
      return ok;
    },
    reset: () => {
      dispatch({ type: "reset" });
      clearTimeout(pacingTimer);
      set({ panelOpen: false, lastRevealAt: 0, pacing: false });
    },
    setPanelOpen: (open) => {
      if (open && get().reading.phase !== "complete") return;
      set({ panelOpen: open });
    },
  };
});
