import { describe, expect, it } from "vitest";
import { CARD_IDS, getCard, MAJOR_ARCANA } from "@/features/tarot/cards";
import { CATEGORIES, type TarotCard } from "@/features/tarot/types";
import type { LocalizedText } from "@/lib/i18n/types";

function localizedFields(card: TarotCard): [string, LocalizedText][] {
  return [
    ["name", card.name],
    ...card.keywords.upright.map((k, i): [string, LocalizedText] => [`keywords.upright[${i}]`, k]),
    ...card.keywords.reversed.map((k, i): [string, LocalizedText] => [`keywords.reversed[${i}]`, k]),
    ["upright", card.upright],
    ["reversed", card.reversed],
    ...CATEGORIES.map((c): [string, LocalizedText] => [`focus.${c}`, card.focus[c]]),
  ];
}

describe("MAJOR_ARCANA", () => {
  it("contains all 22 cards", () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    expect(CARD_IDS).toHaveLength(22);
  });

  it("has unique ids in the major-NN-slug format", () => {
    const ids = MAJOR_ARCANA.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CARD_IDS).toEqual(ids);
    for (const id of ids) expect(id).toMatch(/^major-\d{2}-[a-z-]+$/);
  });

  it("numbers 0..21 exactly once, matching the id", () => {
    const numbers = MAJOR_ARCANA.map((c) => c.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 22 }, (_, i) => i));
    for (const card of MAJOR_ARCANA) {
      expect(card.arcana).toBe("major");
      expect(Number(card.id.slice(6, 8))).toBe(card.number);
    }
  });

  it("uses Rider–Waite–Smith numbering for Strength and Justice", () => {
    expect(getCard("major-08-strength")?.name.en).toBe("Strength");
    expect(getCard("major-11-justice")?.name.en).toBe("Justice");
  });

  it("points each asset at /cards/<id>.svg", () => {
    for (const card of MAJOR_ARCANA) expect(card.asset).toBe(`/cards/${card.id}.svg`);
  });

  it("has 3 keywords per orientation", () => {
    for (const card of MAJOR_ARCANA) {
      expect(card.keywords.upright, card.id).toHaveLength(3);
      expect(card.keywords.reversed, card.id).toHaveLength(3);
    }
  });

  it("has non-empty en and zh for every localized field", () => {
    for (const card of MAJOR_ARCANA) {
      for (const [field, text] of localizedFields(card)) {
        expect(text.en.trim(), `${card.id} ${field}.en`).not.toBe("");
        expect(text.zh.trim(), `${card.id} ${field}.zh`).not.toBe("");
      }
    }
  });
});

describe("getCard", () => {
  it("round-trips every id", () => {
    for (const card of MAJOR_ARCANA) expect(getCard(card.id)).toBe(card);
    for (const id of CARD_IDS) expect(getCard(id)?.id).toBe(id);
  });

  it("returns undefined for unknown ids", () => {
    expect(getCard("major-22-unknown")).toBeUndefined();
    expect(getCard("")).toBeUndefined();
    expect(getCard("MAJOR-00-FOOL")).toBeUndefined();
  });
});
