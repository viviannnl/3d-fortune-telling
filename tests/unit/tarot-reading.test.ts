import { describe, expect, it } from "vitest";
import { CARD_IDS, getCard } from "@/features/tarot/cards";
import { isValidDeck, shuffleDeck } from "@/features/tarot/deck";
import { randomInt, seededRandom } from "@/features/tarot/random";
import {
  INITIAL_READING,
  isRevealed,
  readingReducer,
  selectionsOf,
  slotOf,
  SPREAD_SIZE,
  type ReadingEvent,
  type ReadingState,
} from "@/features/tarot/reading";
import { SPREAD_POSITIONS } from "@/features/tarot/types";

function run(events: ReadingEvent[], start: ReadingState = INITIAL_READING) {
  return events.reduce(readingReducer, start);
}

function begun(seed = 1) {
  return readingReducer(INITIAL_READING, {
    type: "begin",
    category: "love",
    deck: shuffleDeck(CARD_IDS, seededRandom(seed)),
  });
}

describe("random source", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("rejects out-of-range sources instead of silently skewing", () => {
    expect(() => randomInt(() => 1, 5)).toThrow(RangeError);
    expect(() => randomInt(() => -0.1, 5)).toThrow(RangeError);
    expect(() => randomInt(() => Number.NaN, 5)).toThrow(RangeError);
    expect(() => randomInt(() => 0.5, 0)).toThrow(RangeError);
  });

  it("handles the extreme edges of the valid range", () => {
    expect(randomInt(() => 0, 22)).toBe(0);
    expect(randomInt(() => 0.9999999999, 22)).toBe(21);
  });
});

describe("shuffleDeck", () => {
  it("is a permutation: every card exactly once", () => {
    for (let seed = 0; seed < 200; seed++) {
      const deck = shuffleDeck(CARD_IDS, seededRandom(seed));
      expect(isValidDeck(deck, CARD_IDS)).toBe(true);
      expect(new Set(deck.map((d) => d.cardId)).size).toBe(CARD_IDS.length);
    }
  });

  it("is reproducible with the same seed and varies across seeds", () => {
    expect(shuffleDeck(CARD_IDS, seededRandom(7))).toEqual(shuffleDeck(CARD_IDS, seededRandom(7)));
    expect(shuffleDeck(CARD_IDS, seededRandom(7))).not.toEqual(shuffleDeck(CARD_IDS, seededRandom(8)));
  });

  it("respects the reversal chance at its extremes", () => {
    expect(shuffleDeck(CARD_IDS, seededRandom(3), 0).every((d) => d.orientation === "upright")).toBe(true);
    expect(shuffleDeck(CARD_IDS, seededRandom(3), 1).every((d) => d.orientation === "reversed")).toBe(true);
  });

  it("produces roughly balanced orientations and positions over many shuffles", () => {
    const rng = seededRandom(99);
    let reversed = 0;
    const firstSlot = new Map<string, number>();
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const deck = shuffleDeck(CARD_IDS, rng);
      reversed += deck.filter((d) => d.orientation === "reversed").length;
      firstSlot.set(deck[0].cardId, (firstSlot.get(deck[0].cardId) ?? 0) + 1);
    }
    expect(reversed / (N * CARD_IDS.length)).toBeGreaterThan(0.48);
    expect(reversed / (N * CARD_IDS.length)).toBeLessThan(0.52);
    const expected = N / CARD_IDS.length;
    for (const id of CARD_IDS) expect(Math.abs((firstSlot.get(id) ?? 0) - expected)).toBeLessThan(expected * 0.35);
  });

  it("rejects duplicate input ids", () => {
    expect(() => shuffleDeck(["a", "a"], seededRandom(1))).toThrow();
  });

  it("works with a degenerate always-zero source", () => {
    expect(
      isValidDeck(
        shuffleDeck(CARD_IDS, () => 0),
        CARD_IDS,
      ),
    ).toBe(true);
  });
});

describe("readingReducer", () => {
  it("runs the full flow: choose → draw 3 → reveal 3 → complete", () => {
    let s = begun();
    expect(s.phase).toBe("drawing");
    expect(s.category).toBe("love");
    expect(s.readingId).toBe(1);
    s = run(
      [
        { type: "pick", deckIndex: 4 },
        { type: "pick", deckIndex: 0 },
      ],
      s,
    );
    expect(s.phase).toBe("drawing");
    s = readingReducer(s, { type: "pick", deckIndex: 21 });
    expect(s.phase).toBe("revealing");
    expect(s.picks).toEqual([4, 0, 21]);
    s = run([{ type: "reveal" }, { type: "reveal" }], s);
    expect(s.phase).toBe("revealing");
    expect(isRevealed(s, 1)).toBe(true);
    expect(isRevealed(s, 2)).toBe(false);
    s = readingReducer(s, { type: "reveal" });
    expect(s.phase).toBe("complete");
    expect(s.revealed).toBe(SPREAD_SIZE);
  });

  it("maps picks to Past, Present, Future in pick order with fixed identity and orientation", () => {
    const s0 = begun(5);
    const s = run(
      [3, 17, 9].map((deckIndex) => ({ type: "pick", deckIndex }) as const),
      s0,
    );
    const sel = selectionsOf(s);
    expect(sel.map((x) => x.position)).toEqual([...SPREAD_POSITIONS]);
    expect(sel.map((x) => x.cardId)).toEqual([s0.deck[3].cardId, s0.deck[17].cardId, s0.deck[9].cardId]);
    expect(sel.map((x) => x.orientation)).toEqual([
      s0.deck[3].orientation,
      s0.deck[17].orientation,
      s0.deck[9].orientation,
    ]);
    expect(slotOf(s, 17)).toBe(1);
    expect(slotOf(s, 0)).toBe(-1);
    // Revealing never changes identity or orientation.
    const done = run([{ type: "reveal" }, { type: "reveal" }, { type: "reveal" }], s);
    expect(selectionsOf(done)).toEqual(sel);
    for (const x of sel) expect(getCard(x.cardId)).toBeDefined();
  });

  it("always yields three distinct cards across many random readings", () => {
    const rng = seededRandom(2024);
    for (let n = 0; n < 500; n++) {
      let s = readingReducer(INITIAL_READING, { type: "begin", category: "career", deck: shuffleDeck(CARD_IDS, rng) });
      while (s.phase === "drawing") s = readingReducer(s, { type: "pick", deckIndex: randomInt(rng, s.deck.length) });
      const ids = selectionsOf(s).map((x) => x.cardId);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("rejects picking the same card twice (double click)", () => {
    const s1 = readingReducer(begun(), { type: "pick", deckIndex: 2 });
    expect(readingReducer(s1, { type: "pick", deckIndex: 2 })).toBe(s1);
  });

  it("rejects extra picks once the spread is complete", () => {
    const s = run(
      [0, 1, 2].map((deckIndex) => ({ type: "pick", deckIndex }) as const),
      begun(),
    );
    expect(readingReducer(s, { type: "pick", deckIndex: 3 })).toBe(s);
    const done = run([{ type: "reveal" }, { type: "reveal" }, { type: "reveal" }], s);
    expect(readingReducer(done, { type: "pick", deckIndex: 3 })).toBe(done);
  });

  it("rejects out-of-range and non-integer deck indices", () => {
    const s = begun();
    for (const deckIndex of [-1, 22, 1.5, Number.NaN]) expect(readingReducer(s, { type: "pick", deckIndex })).toBe(s);
  });

  it("rejects reveals before the spread is complete and beyond three", () => {
    const s = begun();
    expect(readingReducer(s, { type: "reveal" })).toBe(s);
    const partial = readingReducer(s, { type: "pick", deckIndex: 0 });
    expect(readingReducer(partial, { type: "reveal" })).toBe(partial);
    const done = run(
      [0, 1, 2]
        .map((deckIndex) => ({ type: "pick", deckIndex }) as const)
        .concat([{ type: "reveal" }, { type: "reveal" }, { type: "reveal" }] as never[]),
      s,
    );
    expect(done.phase).toBe("complete");
    expect(readingReducer(done, { type: "reveal" })).toBe(done);
  });

  it("rejects begin while a reading is in progress, and invalid decks", () => {
    const s = begun();
    expect(readingReducer(s, { type: "begin", category: "self", deck: shuffleDeck(CARD_IDS, seededRandom(9)) })).toBe(
      s,
    );
    const bad = shuffleDeck(CARD_IDS, seededRandom(1));
    bad[1] = { ...bad[0] };
    expect(readingReducer(INITIAL_READING, { type: "begin", category: "love", deck: bad })).toBe(INITIAL_READING);
    expect(readingReducer(INITIAL_READING, { type: "begin", category: "love", deck: bad.slice(0, 5) })).toBe(
      INITIAL_READING,
    );
  });

  it("rejects picks while choosing", () => {
    expect(readingReducer(INITIAL_READING, { type: "pick", deckIndex: 0 })).toBe(INITIAL_READING);
  });

  it("reset clears the reveal state, keeps the reading counter, and a new reading gets a fresh spread", () => {
    const done = run(
      [0, 1, 2]
        .map((deckIndex) => ({ type: "pick", deckIndex }) as const)
        .concat([{ type: "reveal" }, { type: "reveal" }, { type: "reveal" }] as never[]),
      begun(11),
    );
    const reset = readingReducer(done, { type: "reset" });
    expect(reset).toMatchObject({
      phase: "choosing",
      category: null,
      picks: [],
      revealed: 0,
      deck: [],
      readingId: done.readingId,
    });
    expect(readingReducer(reset, { type: "reset" })).toBe(reset);
    const next = readingReducer(reset, {
      type: "begin",
      category: "self",
      deck: shuffleDeck(CARD_IDS, seededRandom(12)),
    });
    expect(next.readingId).toBe(done.readingId + 1);
    expect(next.picks).toEqual([]);
    expect(next.revealed).toBe(0);
  });

  it("reset is allowed mid-draw", () => {
    const s = readingReducer(begun(), { type: "pick", deckIndex: 0 });
    expect(readingReducer(s, { type: "reset" }).phase).toBe("choosing");
  });
});
