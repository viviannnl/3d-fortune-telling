import { beforeEach, describe, expect, it } from "vitest";
import { BLESSINGS, createBlessingBag, FINAL_BLESSING } from "@/features/blessings";
import { seededRandom } from "@/features/tarot/random";
import { CHARMS, resetCharmBag, useCharms } from "@/stores/charms";

const initial = useCharms.getState();
const touch = (id: (typeof CHARMS)[number]) => useCharms.getState().touch(id, [0, 0, 0], { x: 10, y: 10 });

describe("blessings", () => {
  it("are bilingual and non-empty", () => {
    expect(BLESSINGS.length).toBeGreaterThanOrEqual(20);
    for (const b of [...BLESSINGS, FINAL_BLESSING]) {
      expect(b.en.trim().length).toBeGreaterThan(5);
      expect(b.zh.trim().length).toBeGreaterThan(3);
    }
  });

  it("the bag shows every blessing once before repeating, and never repeats back-to-back", () => {
    const bag = createBlessingBag(BLESSINGS.length, seededRandom(4));
    const seen: number[] = [];
    for (let i = 0; i < BLESSINGS.length * 4; i++) seen.push(bag.next());
    for (let round = 0; round < 4; round++) {
      const slice = seen.slice(round * BLESSINGS.length, (round + 1) * BLESSINGS.length);
      expect(new Set(slice).size).toBe(BLESSINGS.length);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });
});

describe("charm store", () => {
  beforeEach(() => {
    useCharms.setState(initial, true);
    resetCharmBag(seededRandom(9));
  });

  it("records each charm once and shows a blessing at the click point", () => {
    touch("moon");
    touch("moon");
    const s = useCharms.getState();
    expect(s.found).toEqual(["moon"]);
    expect(s.blessing).toMatchObject({ x: 10, y: 10, final: false });
    expect(s.bursts).toHaveLength(2);
  });

  it("celebrates exactly once, with the final blessing, when the last charm is found", () => {
    CHARMS.slice(0, -1).forEach(touch);
    expect(useCharms.getState().celebrateSeq).toBe(0);
    touch(CHARMS[CHARMS.length - 1]);
    expect(useCharms.getState().celebrateSeq).toBe(1);
    expect(useCharms.getState().blessing?.text).toEqual(FINAL_BLESSING);
    touch("orb");
    expect(useCharms.getState().celebrateSeq).toBe(1);
    expect(useCharms.getState().blessing?.final).toBe(false);
  });

  it("keeps at most six bursts alive and can clear them", () => {
    for (let i = 0; i < 10; i++) touch("orb");
    const bursts = useCharms.getState().bursts;
    expect(bursts.length).toBeLessThanOrEqual(6);
    useCharms.getState().clearBurst(bursts[0].seq);
    expect(useCharms.getState().bursts.length).toBe(bursts.length - 1);
  });
});
