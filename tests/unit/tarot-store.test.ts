import { beforeEach, describe, expect, it } from "vitest";
import { seededRandom } from "@/features/tarot/random";
import { selectionsOf } from "@/features/tarot/reading";
import { REVEAL_INTERVAL_MS, setTarotRandomSource, useTarot } from "@/stores/tarot";

const initial = useTarot.getState();

describe("tarot store", () => {
  beforeEach(() => {
    useTarot.setState(initial, true);
    setTarotRandomSource(seededRandom(1));
  });

  it("pickRandom only draws cards still in the fan and stops at three", () => {
    const s = useTarot.getState();
    s.begin("self");
    expect(s.pickRandom()).toBe(true);
    expect(s.pickRandom()).toBe(true);
    expect(s.pickRandom()).toBe(true);
    expect(s.pickRandom()).toBe(false);
    const ids = selectionsOf(useTarot.getState().reading).map((x) => x.cardId);
    expect(new Set(ids).size).toBe(3);
  });

  it("throttles rapid reveals so cards turn one at a time", () => {
    const s = useTarot.getState();
    s.begin("love");
    const t0 = 10_000;
    [0, 1, 2].forEach((i) => s.pick(i, t0 - REVEAL_INTERVAL_MS));
    expect(s.reveal(t0)).toBe(true);
    expect(s.reveal(t0 + 10)).toBe(false);
    expect(s.reveal(t0 + REVEAL_INTERVAL_MS - 1)).toBe(false);
    expect(useTarot.getState().reading.revealed).toBe(1);
    expect(s.reveal(t0 + REVEAL_INTERVAL_MS)).toBe(true);
    expect(s.reveal(t0 + 2 * REVEAL_INTERVAL_MS)).toBe(true);
    expect(useTarot.getState().reading.phase).toBe("complete");
    expect(s.reveal(t0 + 5 * REVEAL_INTERVAL_MS)).toBe(false);
  });

  it("only opens the interpretation panel when the spread is complete; reset closes it", () => {
    const s = useTarot.getState();
    s.setPanelOpen(true);
    expect(useTarot.getState().panelOpen).toBe(false);
    s.begin("career");
    [5, 6, 7].forEach((i) => s.pick(i, 0));
    [1, 2, 3].forEach((n) => s.reveal(n * REVEAL_INTERVAL_MS));
    s.setPanelOpen(true);
    expect(useTarot.getState().panelOpen).toBe(true);
    s.reset();
    expect(useTarot.getState()).toMatchObject({ panelOpen: false });
    expect(useTarot.getState().reading.phase).toBe("choosing");
  });

  it("rejects a reveal that arrives immediately after the spread completes", () => {
    const s = useTarot.getState();
    s.begin("love");
    [0, 1, 2].forEach((i) => s.pick(i, 5_000));
    expect(s.reveal(5_010)).toBe(false);
    expect(s.reveal(5_000 + REVEAL_INTERVAL_MS)).toBe(true);
  });

  it("begin is ignored while a reading is underway, so the spread can't be replaced", () => {
    const s = useTarot.getState();
    s.begin("love");
    const deck = useTarot.getState().reading.deck;
    s.begin("career");
    expect(useTarot.getState().reading.deck).toBe(deck);
    expect(useTarot.getState().reading.category).toBe("love");
  });
});
