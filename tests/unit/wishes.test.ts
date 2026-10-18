import { beforeEach, describe, expect, it } from "vitest";
import { addWish, MAX_WISHES, normalizeWish, parseWishes, WISH_MAX_LENGTH } from "@/features/wishes/wish";
import { useWishes } from "@/stores/wishes";

describe("normalizeWish", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeWish("  may   I  rest \n well  ")).toBe("may I rest well");
  });

  it("rejects empty and whitespace-only input", () => {
    for (const raw of ["", "   ", "\n\t", "\u0000"]) expect(normalizeWish(raw)).toBeNull();
  });

  it("strips control characters and caps the length", () => {
    expect(normalizeWish("hi\u0007there")).toBe("hi there");
    const long = normalizeWish("愿".repeat(200));
    expect(long).toHaveLength(WISH_MAX_LENGTH);
  });

  it("keeps Chinese and emoji intact", () => {
    expect(normalizeWish("愿家人平安 🌙")).toBe("愿家人平安 🌙");
  });
});

describe("addWish", () => {
  it("appends in order and keeps only the newest within the limit", () => {
    let list = [] as ReturnType<typeof addWish>;
    for (let i = 0; i < MAX_WISHES + 5; i++) list = addWish(list, `w${i}`, i, `id${i}`);
    expect(list).toHaveLength(MAX_WISHES);
    expect(list[0].text).toBe("w5");
    expect(list[list.length - 1].text).toBe(`w${MAX_WISHES + 4}`);
  });
});

describe("parseWishes", () => {
  it("drops malformed entries instead of throwing", () => {
    const stored = [
      { id: "a", text: "ok", createdAt: 1 },
      { id: "", text: "no id", createdAt: 1 },
      { id: "b", text: "", createdAt: 1 },
      { id: "c", text: "x".repeat(WISH_MAX_LENGTH + 1), createdAt: 1 },
      { id: "d", text: "bad date", createdAt: Number.NaN },
      "not an object",
      null,
    ];
    expect(parseWishes(stored).map((w) => w.id)).toEqual(["a"]);
    expect(parseWishes("nope")).toEqual([]);
    expect(parseWishes(undefined)).toEqual([]);
  });
});

describe("wish store", () => {
  const initial = useWishes.getState();
  beforeEach(() => useWishes.setState({ ...initial, wishes: [], releaseSeq: 0 }, true));

  it("releases a lantern per valid wish and ignores empty ones", () => {
    expect(useWishes.getState().release("  ")).toBe(false);
    expect(useWishes.getState().releaseSeq).toBe(0);
    expect(useWishes.getState().release("愿一切都好", 1000)).toBe(true);
    expect(useWishes.getState().wishes).toEqual([{ id: expect.any(String), text: "愿一切都好", createdAt: 1000 }]);
    expect(useWishes.getState().releaseSeq).toBe(1);
  });

  it("gives every lantern a distinct id", () => {
    for (let i = 0; i < 5; i++) useWishes.getState().release(`wish ${i}`);
    const ids = useWishes.getState().wishes.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clear forgets everything", () => {
    useWishes.getState().release("remember me");
    useWishes.getState().clear();
    expect(useWishes.getState().wishes).toEqual([]);
  });
});
