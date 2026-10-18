import { CARD_IDS } from "./cards";
import { isValidDeck, type DeckEntry } from "./deck";
import { SPREAD_POSITIONS, type CardSelection, type Category } from "./types";

export const SPREAD_SIZE = SPREAD_POSITIONS.length;

export type ReadingPhase = "choosing" | "drawing" | "revealing" | "complete";

export interface ReadingState {
  phase: ReadingPhase;
  category: Category | null;
  /** Shuffled, face-down deck shown as the fan. Empty while choosing. */
  deck: readonly DeckEntry[];
  /** Deck indices in the order they were picked; index i fills SPREAD_POSITIONS[i]. */
  picks: readonly number[];
  /** How many picked cards are face up (always revealed in spread order). */
  revealed: number;
  /** Increments on every new reading, so derived data (e.g. interpretations) can be keyed safely. */
  readingId: number;
}

export type ReadingEvent =
  | { type: "begin"; category: Category; deck: readonly DeckEntry[] }
  | { type: "pick"; deckIndex: number }
  | { type: "reveal" }
  | { type: "reset" };

export const INITIAL_READING: ReadingState = {
  phase: "choosing",
  category: null,
  deck: [],
  picks: [],
  revealed: 0,
  readingId: 0,
};

/**
 * Pure reading state machine. Invalid events return the *same* state object,
 * so callers (and tests) can detect a rejected transition by identity.
 */
export function readingReducer(state: ReadingState, event: ReadingEvent): ReadingState {
  switch (event.type) {
    case "begin": {
      if (state.phase !== "choosing") return state;
      if (!isValidDeck(event.deck, CARD_IDS)) return state;
      return {
        phase: "drawing",
        category: event.category,
        deck: event.deck,
        picks: [],
        revealed: 0,
        readingId: state.readingId + 1,
      };
    }
    case "pick": {
      if (state.phase !== "drawing") return state;
      const i = event.deckIndex;
      if (!Number.isInteger(i) || i < 0 || i >= state.deck.length) return state;
      if (state.picks.includes(i)) return state;
      const picks = [...state.picks, i];
      return { ...state, picks, phase: picks.length === SPREAD_SIZE ? "revealing" : "drawing" };
    }
    case "reveal": {
      if (state.phase !== "revealing") return state;
      const revealed = state.revealed + 1;
      return { ...state, revealed, phase: revealed === SPREAD_SIZE ? "complete" : "revealing" };
    }
    case "reset": {
      if (state.phase === "choosing" && state.category === null) return state;
      return { ...INITIAL_READING, readingId: state.readingId };
    }
  }
}

/** The spread so far, in position order. */
export function selectionsOf(state: ReadingState): CardSelection[] {
  return state.picks.map((deckIndex, i) => ({
    cardId: state.deck[deckIndex].cardId,
    orientation: state.deck[deckIndex].orientation,
    position: SPREAD_POSITIONS[i],
  }));
}

/** Which spread slot a deck card occupies, or -1 if it is still in the fan. */
export function slotOf(state: ReadingState, deckIndex: number): number {
  return state.picks.indexOf(deckIndex);
}

export function isRevealed(state: ReadingState, slot: number): boolean {
  return slot >= 0 && slot < state.revealed;
}
