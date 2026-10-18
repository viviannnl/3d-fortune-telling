import { describe, expect, it } from "vitest";
import {
  BRANCH_NOTES,
  DAY_MASTER_INTRO,
  ELEMENT_COUNT_NOTE,
  ELEMENT_NOTES,
  HIDDEN_STEMS_NOTE,
  PILLAR_NOTES,
  STEM_NOTES,
  TEN_GOD_NOTES,
} from "@/features/destiny/reference";
import { BRANCHES, ELEMENTS, STEMS, TEN_GODS, type ElementId } from "@/features/destiny/symbols";
import { PILLAR_KEYS } from "@/features/destiny/types";
import type { LocalizedText } from "@/lib/i18n/types";

function expectText(text: LocalizedText, label: string) {
  expect(text.en.trim(), `${label}.en`).not.toBe("");
  expect(text.zh.trim(), `${label}.zh`).not.toBe("");
}

/** Follows a relation from `start` and returns the visited order until it repeats. */
function walk(start: ElementId, next: (e: ElementId) => ElementId): ElementId[] {
  const seen: ElementId[] = [];
  let current = start;
  while (!seen.includes(current)) {
    seen.push(current);
    current = next(current);
  }
  expect(current, "cycle returns to its start").toBe(start);
  return seen;
}

describe("destiny reference notes", () => {
  it("has an entry for every element, stem, branch, ten god and pillar", () => {
    expect(Object.keys(ELEMENT_NOTES).sort()).toEqual([...ELEMENTS].sort());
    expect(Object.keys(STEM_NOTES).sort()).toEqual(STEMS.map((s) => s.char).sort());
    expect(Object.keys(BRANCH_NOTES).sort()).toEqual(BRANCHES.map((b) => b.char).sort());
    expect(Object.keys(TEN_GOD_NOTES).sort()).toEqual([...TEN_GODS].sort());
    expect(Object.keys(PILLAR_NOTES).sort()).toEqual([...PILLAR_KEYS].sort());
  });

  it("has non-empty English and Chinese text everywhere", () => {
    for (const e of ELEMENTS) {
      expectText(ELEMENT_NOTES[e].name, `element ${e} name`);
      expectText(ELEMENT_NOTES[e].qualities, `element ${e} qualities`);
    }
    for (const { char } of STEMS) {
      const note = STEM_NOTES[char];
      expect(note, `stem ${char}`).toBeDefined();
      expectText(note.image, `stem ${char} image`);
      expectText(note.note, `stem ${char} note`);
    }
    for (const { char } of BRANCHES) {
      const note = BRANCH_NOTES[char];
      expect(note, `branch ${char}`).toBeDefined();
      expectText(note.season, `branch ${char} season`);
      expectText(note.note, `branch ${char} note`);
    }
    for (const god of TEN_GODS) {
      expectText(TEN_GOD_NOTES[god].name, `${god} name`);
      expectText(TEN_GOD_NOTES[god].relation, `${god} relation`);
      expectText(TEN_GOD_NOTES[god].note, `${god} note`);
    }
    for (const key of PILLAR_KEYS) {
      expectText(PILLAR_NOTES[key].name, `pillar ${key} name`);
      expectText(PILLAR_NOTES[key].note, `pillar ${key} note`);
    }
    expectText(DAY_MASTER_INTRO, "DAY_MASTER_INTRO");
    expectText(HIDDEN_STEMS_NOTE, "HIDDEN_STEMS_NOTE");
    expectText(ELEMENT_COUNT_NOTE, "ELEMENT_COUNT_NOTE");
  });

  it("generating cycle is Wood → Fire → Earth → Metal → Water → Wood", () => {
    expect(walk("wood", (e) => ELEMENT_NOTES[e].generates)).toEqual(["wood", "fire", "earth", "metal", "water"]);
  });

  it("controlling cycle is Wood → Earth → Water → Fire → Metal → Wood", () => {
    expect(walk("wood", (e) => ELEMENT_NOTES[e].controls)).toEqual(["wood", "earth", "water", "fire", "metal"]);
  });

  it("branch hours are twelve consecutive two-hour slots starting 23:00–01:00 at 子", () => {
    const pad = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
    BRANCHES.forEach(({ char }, i) => {
      const start = 23 + 2 * i;
      expect(BRANCH_NOTES[char].hours, char).toBe(`${pad(start)}–${pad(start + 2)}`);
    });
    expect(BRANCH_NOTES["子"].hours).toBe("23:00–01:00");
  });
});
