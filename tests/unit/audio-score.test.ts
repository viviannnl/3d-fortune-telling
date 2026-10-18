import { describe, expect, it } from "vitest";
import { DAY_MOODS, SEASONS } from "@/features/sky/celestial";
import {
  DEFAULT_SCENE,
  ELEMENT_DEGREE,
  elementHz,
  inKeyHz,
  MELODY_HIGH,
  MELODY_LOW,
  melodyDensity,
  midiToHz,
  MOOD_SHAPES,
  PENTATONIC,
  pentatonicNotes,
  scoreChord,
  SEASON_KEYS,
  SLOTS,
  type MusicScene,
} from "@/lib/audio/score";

const pc = (m: number) => ((m % 12) + 12) % 12;
const classDistance = (a: number, b: number) => Math.min(pc(a - b), 12 - pc(a - b));

/** A long run of the score, carrying the melody across chords as the conductor does. */
function run(scene: MusicScene, chords: number, seed = 7) {
  let previous: number | null = null;
  return Array.from({ length: chords }, (_, i) => {
    const chord = scoreChord(scene, i, seed, previous);
    previous = chord.melody.at(-1)?.midi ?? previous;
    return chord;
  });
}

const scenes: MusicScene[] = SEASONS.flatMap((season) =>
  DAY_MOODS.map((mood) => ({ ...DEFAULT_SCENE, season, mood, moon: 0.8 })),
);

describe("key and harmony", () => {
  it("every season's scale is the five pentatonic degrees", () => {
    for (const season of SEASONS) {
      const notes = pentatonicNotes(season, 60, 71);
      const tonic = pc(SEASON_KEYS[season].tonic);
      expect(notes.map((m) => pc(m - tonic)).sort((a, b) => a - b)).toEqual([...PENTATONIC]);
    }
  });

  it("chords stay in the season's major key and in a sensible register", () => {
    const major = [0, 2, 4, 5, 7, 9, 11];
    for (const scene of scenes) {
      const tonic = SEASON_KEYS[scene.season].tonic;
      for (const chord of run(scene, 8)) {
        for (const m of [chord.bass, ...chord.pad]) expect(major).toContain(pc(m - tonic));
        // Nothing in the sub-bass that small speakers cannot play.
        expect(midiToHz(chord.bass)).toBeGreaterThan(55);
        expect(chord.bass).toBeLessThan(Math.min(...chord.pad));
        expect(Math.max(...chord.pad)).toBeLessThanOrEqual(72);
      }
    }
  });

  it("pad voicings never stack a semitone", () => {
    for (const scene of scenes) {
      for (const chord of run(scene, 4)) {
        for (const a of chord.pad) for (const b of chord.pad) if (a !== b) expect(Math.abs(a - b)).not.toBe(1);
      }
    }
  });
});

describe("melody", () => {
  it("is pentatonic, in range, and never a semitone from a sounding chord tone", () => {
    for (const scene of scenes) {
      const scale = new Set(pentatonicNotes(scene.season, 0, 127));
      for (const chord of run(scene, 24)) {
        for (const n of chord.melody) {
          expect(scale.has(n.midi)).toBe(true);
          expect(n.midi).toBeGreaterThanOrEqual(MELODY_LOW);
          expect(n.midi).toBeLessThanOrEqual(MELODY_HIGH);
          for (const c of [chord.bass, ...chord.pad]) expect(classDistance(n.midi, c)).not.toBe(1);
          expect(n.slot).toBeGreaterThanOrEqual(0);
          expect(n.slot).toBeLessThan(SLOTS);
          expect(n.velocity).toBeGreaterThan(0);
          expect(n.velocity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("moves mostly by small steps, like a sung line", () => {
    const notes = run({ ...DEFAULT_SCENE, moon: 1 }, 60).flatMap((c) => c.melody.map((n) => n.midi));
    const leaps = notes.slice(1).map((m, i) => Math.abs(m - notes[i]));
    const small = leaps.filter((d) => d <= 5).length / leaps.length;
    expect(notes.length).toBeGreaterThan(100);
    expect(small).toBeGreaterThan(0.75);
    expect(Math.max(...leaps)).toBeLessThanOrEqual(12);
  });

  it("breathes: no chord is filled wall to wall", () => {
    for (const chord of run({ ...DEFAULT_SCENE, mood: "day", moon: 1 }, 80)) {
      expect(chord.melody.length).toBeLessThan(SLOTS);
    }
  });

  it("is reproducible from its seed and different across seeds", () => {
    const a = run(DEFAULT_SCENE, 6, 1).flatMap((c) => c.melody);
    const b = run(DEFAULT_SCENE, 6, 1).flatMap((c) => c.melody);
    const c = run(DEFAULT_SCENE, 6, 2).flatMap((x) => x.melody);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("following the scene", () => {
  it("a brighter moon brings more melody; an open reading brings less", () => {
    const count = (scene: MusicScene) => run(scene, 200).reduce((n, c) => n + c.melody.length, 0);
    const dark = count({ ...DEFAULT_SCENE, moon: 0 });
    const full = count({ ...DEFAULT_SCENE, moon: 1 });
    const reading = count({ ...DEFAULT_SCENE, moon: 1, dim: 1 });
    expect(full).toBeGreaterThan(dark * 1.4);
    expect(reading).toBeLessThan(full * 0.7);
    expect(melodyDensity({ ...DEFAULT_SCENE, mood: "day", moon: 1 })).toBeLessThanOrEqual(0.75);
  });

  it("deep night is the slowest and darkest; day the quickest and brightest", () => {
    const seconds = DAY_MOODS.map((m) => MOOD_SHAPES[m].chordSeconds);
    const brightness = DAY_MOODS.map((m) => MOOD_SHAPES[m].brightness);
    expect(MOOD_SHAPES.deepNight.chordSeconds).toBe(Math.max(...seconds));
    expect(MOOD_SHAPES.deepNight.brightness).toBe(Math.min(...brightness));
    expect(MOOD_SHAPES.day.brightness).toBe(Math.max(...brightness));
  });

  it("each season has its own key", () => {
    expect(new Set(SEASONS.map((s) => pc(SEASON_KEYS[s].tonic))).size).toBe(SEASONS.length);
  });

  it("only the Destiny Palace rings the temple bell, on every other chord", () => {
    const palace = run({ ...DEFAULT_SCENE, place: "destiny" }, 8).map((c) => c.bell !== null);
    expect(palace).toEqual([true, false, true, false, true, false, true, false]);
    expect(run(DEFAULT_SCENE, 8).every((c) => c.bell === null)).toBe(true);
    expect(run({ ...DEFAULT_SCENE, place: "tarot" }, 8).every((c) => c.bell === null)).toBe(true);
  });
});

describe("interface sounds in key", () => {
  it("snaps any pitch to the nearest note of the current scale, within three semitones", () => {
    for (const season of SEASONS) {
      const scale = new Set(pentatonicNotes(season, 0, 127).map((m) => Math.round(midiToHz(m) * 100)));
      for (const hz of [196, 392, 523.25, 659.25, 783.99, 880, 987.77, 1318.5]) {
        const snapped = inKeyHz(season, hz);
        expect(scale.has(Math.round(snapped * 100))).toBe(true);
        expect(Math.abs(12 * Math.log2(snapped / hz))).toBeLessThanOrEqual(3.01);
      }
    }
  });

  it("sounds the Five Elements on their classical tones: 土宫 金商 木角 火徵 水羽", () => {
    expect(ELEMENT_DEGREE).toEqual({ earth: 0, metal: 2, wood: 4, fire: 7, water: 9 });
    for (const season of SEASONS) {
      const gong = midiToHz(SEASON_KEYS[season].tonic + 12);
      const ratios = ["earth", "metal", "wood", "fire", "water"].map((e) => (elementHz(season, e) ?? 0) / gong);
      expect(ratios.map((r) => Math.round(12 * Math.log2(r)))).toEqual([0, 2, 4, 7, 9]);
    }
    expect(elementHz("spring", "aether")).toBeNull();
  });
});
