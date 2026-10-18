import { describe, expect, it } from "vitest";
import { cardTarget, SPREAD_SCALE } from "@/components/tarot/spreadLayout";
import { CARD_IDS } from "@/features/tarot/cards";
import { shuffleDeck } from "@/features/tarot/deck";
import { seededRandom } from "@/features/tarot/random";
import { INITIAL_READING, readingReducer, type ReadingState } from "@/features/tarot/reading";

function drawing(): ReadingState {
  return readingReducer(INITIAL_READING, {
    type: "begin",
    category: "love",
    deck: shuffleDeck(CARD_IDS, seededRandom(4)),
  });
}

const pick = (s: ReadingState, i: number) => readingReducer(s, { type: "pick", deckIndex: i });
const reveal = (s: ReadingState) => readingReducer(s, { type: "reveal" });

describe("card layout", () => {
  it("fans every card face down, interactive, at distinct positions", () => {
    const s = drawing();
    const targets = s.deck.map((_, i) => cardTarget(s, i, null));
    expect(targets.every((t) => t.flip === Math.PI && t.interactive)).toBe(true);
    const keys = new Set(targets.map((t) => t.position.map((n) => n.toFixed(3)).join(",")));
    expect(keys.size).toBe(s.deck.length);
    // Symmetric fan: first and last mirror each other in x.
    expect(targets[0].position[0]).toBeCloseTo(-targets[21].position[0], 6);
  });

  it("lifts only the hovered fan card", () => {
    const s = drawing();
    const rest = cardTarget(s, 3, null);
    const hover = cardTarget(s, 3, 3);
    expect(hover.position[1]).toBeGreaterThan(rest.position[1]);
    expect(cardTarget(s, 4, 3).position).toEqual(cardTarget(s, 4, null).position);
  });

  it("moves picks into stable Past/Present/Future slots, left to right, enlarged", () => {
    let s = drawing();
    s = pick(pick(pick(s, 10), 2), 19);
    const [past, present, future] = [10, 2, 19].map((i) => cardTarget(s, i, null));
    expect(past.position[0]).toBeLessThan(present.position[0]);
    expect(present.position[0]).toBeLessThan(future.position[0]);
    for (const t of [past, present, future]) {
      expect(t.scale).toBe(SPREAD_SCALE);
      expect(t.flip).toBe(Math.PI);
    }
    // Hovering elsewhere never moves a placed card.
    expect(cardTarget(s, 10, 5)).toEqual(past);
  });

  it("only the next card to reveal is interactive, and revealed cards turn face up", () => {
    let s = pick(pick(pick(drawing(), 0), 1), 2);
    expect([0, 1, 2].map((i) => cardTarget(s, i, null).interactive)).toEqual([true, false, false]);
    s = reveal(s);
    expect(cardTarget(s, 0, null).flip).toBe(0);
    expect([0, 1, 2].map((i) => cardTarget(s, i, null).interactive)).toEqual([false, true, false]);
    s = reveal(reveal(s));
    expect([0, 1, 2].every((i) => cardTarget(s, i, null).flip === 0 && !cardTarget(s, i, null).interactive)).toBe(true);
  });

  it("quiets the unpicked cards once the spread is set", () => {
    const s = pick(pick(pick(drawing(), 0), 1), 2);
    const t = cardTarget(s, 7, 7);
    expect(t.interactive).toBe(false);
    expect(t.presence).toBeLessThan(1);
  });
});
