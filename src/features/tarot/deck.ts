import { randomChance, randomInt, type RandomSource } from "./random";
import type { Orientation } from "./types";

/** One face-down card in the shuffled deck. Identity and orientation are fixed at shuffle time. */
export interface DeckEntry {
  cardId: string;
  orientation: Orientation;
}

export const REVERSAL_CHANCE = 0.5;

/**
 * Fisher–Yates shuffle plus an independent orientation per card.
 * Produces a permutation, so every card appears exactly once.
 */
export function shuffleDeck(
  cardIds: readonly string[],
  rng: RandomSource,
  reversalChance = REVERSAL_CHANCE,
): DeckEntry[] {
  if (new Set(cardIds).size !== cardIds.length) throw new Error("shuffleDeck: card ids must be unique");
  const ids = [...cardIds];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((cardId) => ({
    cardId,
    orientation: randomChance(rng, reversalChance) ? "reversed" : "upright",
  }));
}

/** True if `deck` is a valid shuffle of exactly `cardIds`. */
export function isValidDeck(deck: readonly DeckEntry[], cardIds: readonly string[]): boolean {
  if (deck.length !== cardIds.length) return false;
  const expected = new Set(cardIds);
  const seen = new Set<string>();
  for (const entry of deck) {
    if (!expected.has(entry.cardId) || seen.has(entry.cardId)) return false;
    if (entry.orientation !== "upright" && entry.orientation !== "reversed") return false;
    seen.add(entry.cardId);
  }
  return true;
}
