import type { DayMood, Season } from "@/features/sky/celestial";

/**
 * The generative score: which notes to play, never how they sound.
 *
 * Everything is built on one major pentatonic (五声: 宫 商 角 徵 羽) per
 * season, so melody, chords and interaction sounds always share a key. Chords
 * use the full major scale for colour, and the melody refuses any note a
 * semitone away from a sounding chord tone, so nothing ever rubs.
 */

export type Place = "sanctuary" | "tarot" | "destiny";

export interface MusicScene {
  season: Season;
  mood: DayMood;
  /** Lit fraction of the real moon, 0..1. */
  moon: number;
  place: Place;
  /** 0 = full music, 1 = a reading is open and the music steps back. */
  dim: number;
}

export const DEFAULT_SCENE: MusicScene = { season: "spring", mood: "night", moon: 0.5, place: "sanctuary", dim: 0 };

/** Pentatonic degrees in semitones above 宫 (gong): 宫 商 角 徵 羽. */
export const PENTATONIC = [0, 2, 4, 7, 9] as const;

interface ChordShape {
  /** Bass note, semitones from the tonic (one octave down is added on top). */
  bass: number;
  /** Pad voicing, semitones from the tonic. */
  pad: readonly number[];
}

/** Hand-voiced chords in a major key, open and close enough to blur softly. */
const CHORDS = {
  /** I add9 */
  I: { bass: 0, pad: [0, 7, 14, 16] },
  /** vi add11 — the relative minor, quartal and misty */
  vi: { bass: -3, pad: [4, 7, 9, 14] },
  /** IV maj7 */
  IV: { bass: -7, pad: [5, 9, 12, 16] },
  /** IV maj9 #11 — the lydian lift of summer */
  IVlyd: { bass: -7, pad: [9, 11, 16, 19] },
  /** V 6sus4 — suspended, never resolving all the way */
  V: { bass: -5, pad: [2, 7, 12, 16] },
  /** iii7 — a gentle shadow */
  iii: { bass: -8, pad: [4, 7, 11, 14] },
} as const satisfies Record<string, ChordShape>;

type ChordName = keyof typeof CHORDS;

interface SeasonKey {
  /** MIDI note of 宫 in the pad register. */
  tonic: number;
  progression: readonly ChordName[];
}

/**
 * Spring and summer sit in bright major; autumn and winter start on the
 * relative minor, so the same scale turns wistful and then still.
 */
export const SEASON_KEYS: Record<Season, SeasonKey> = {
  spring: { tonic: 55, progression: ["I", "vi", "IV", "V"] }, // G
  summer: { tonic: 52, progression: ["I", "IVlyd", "vi", "V"] }, // E
  autumn: { tonic: 51, progression: ["vi", "IV", "I", "V"] }, // E♭ (C minor colour)
  winter: { tonic: 53, progression: ["vi", "iii", "IV", "vi"] }, // F (D minor colour)
};

interface MoodShape {
  /** Seconds each chord lasts. */
  chordSeconds: number;
  /** Pad low-pass cutoff in Hz: darker at night. */
  brightness: number;
  /** Chance that a melody slot sounds, before the moon and dimming apply. */
  density: number;
}

export const MOOD_SHAPES: Record<DayMood, MoodShape> = {
  dusk: { chordSeconds: 10, brightness: 3400, density: 0.42 },
  night: { chordSeconds: 12, brightness: 2800, density: 0.34 },
  deepNight: { chordSeconds: 15, brightness: 1900, density: 0.22 },
  dawn: { chordSeconds: 11, brightness: 3200, density: 0.38 },
  day: { chordSeconds: 10, brightness: 4000, density: 0.46 },
};

/** Melody slots per chord. */
export const SLOTS = 8;
/** Melody range in MIDI: above the pad, below anything piercing. */
export const MELODY_LOW = 62;
export const MELODY_HIGH = 86;

export interface MelodyNote {
  /** Slot within the chord, 0..SLOTS-1. */
  slot: number;
  midi: number;
  /** 0..1 */
  velocity: number;
}

export interface ScoredChord {
  name: ChordName;
  seconds: number;
  bass: number;
  pad: number[];
  melody: MelodyNote[];
  /** The palace marks every other chord with a low temple bell. */
  bell: number | null;
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

/** Melody density: fuller under a bright moon, thinner while a reading is open. */
export function melodyDensity(scene: MusicScene): number {
  const moonFactor = 0.6 + 0.8 * Math.min(1, Math.max(0, scene.moon));
  const dimFactor = 1 - 0.6 * Math.min(1, Math.max(0, scene.dim));
  return Math.min(0.75, MOOD_SHAPES[scene.mood].density * moonFactor * dimFactor);
}

/** Every pentatonic note of the season's key in [low, high]. */
export function pentatonicNotes(season: Season, low: number, high: number): number[] {
  const tonicClass = SEASON_KEYS[season].tonic % 12;
  const notes: number[] = [];
  for (let m = low; m <= high; m++) {
    if (PENTATONIC.includes(((m - tonicClass + 120) % 12) as (typeof PENTATONIC)[number])) notes.push(m);
  }
  return notes;
}

/** Pitch-class distance, 0..6. */
function classDistance(a: number, b: number): number {
  const d = (((a - b) % 12) + 12) % 12;
  return Math.min(d, 12 - d);
}

/** Small deterministic RNG (mulberry32) so a score is reproducible from its seed. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The chord at position `index` of the endless progression, with its melody.
 * `previous` is the last melody note sounded, so lines stay connected across
 * chord changes.
 */
export function scoreChord(scene: MusicScene, index: number, seed: number, previous: number | null): ScoredChord {
  const key = SEASON_KEYS[scene.season];
  const name = key.progression[index % key.progression.length];
  const shape = CHORDS[name];
  const pad = shape.pad.map((n) => key.tonic + n);
  let bass = key.tonic - 12 + shape.bass;
  // Below ~65 Hz small speakers only rumble; lift it while it stays under the pad.
  if (bass < 36 && bass + 12 < Math.min(...pad)) bass += 12;
  const random = seeded(seed * 7919 + index * 104729 + 1);

  // Melody candidates: pentatonic, in range, and never a semitone from a chord tone.
  const chordTones = [bass, ...pad];
  const safe = pentatonicNotes(scene.season, MELODY_LOW, MELODY_HIGH).filter((m) =>
    chordTones.every((c) => classDistance(m, c) !== 1),
  );
  const chordish = safe.filter((m) => chordTones.some((c) => classDistance(m, c) === 0));

  const density = melodyDensity(scene);
  const melody: MelodyNote[] = [];
  let last = previous !== null && safe.includes(previous) ? previous : null;
  // Where the line actually is, even if that note clashes with the new chord.
  let reference = previous;
  let run = 0;
  for (let slot = 0; slot < SLOTS; slot++) {
    const strong = slot % 4 === 0;
    // Phrases breathe: after a few notes, leave a gap.
    if (run >= 3 + Math.floor(random() * 3)) {
      run = 0;
      continue;
    }
    if (random() > density * (strong ? 1.25 : 0.9)) {
      run = 0;
      continue;
    }
    let midi: number;
    if (last === null || (strong && random() < 0.5)) {
      // Land on a chord tone, near where the line is when there is one.
      const pool = chordish.length > 0 ? chordish : safe;
      if (reference === null) {
        midi = pool[Math.floor(random() * pool.length)];
      } else {
        const ref = reference;
        const near = pool.filter((m) => Math.abs(m - ref) <= 7);
        midi =
          near.length > 0
            ? near[Math.floor(random() * near.length)]
            : pool.reduce((best, m) => (Math.abs(m - ref) < Math.abs(best - ref) ? m : best));
      }
    } else {
      // Mostly stepwise through the scale, with the occasional leap.
      const from = safe.indexOf(last);
      const leap = random() < 0.2 ? 2 : 1;
      let step = (random() < 0.5 ? -1 : 1) * leap;
      // Lean back toward the middle of the range.
      if (last > MELODY_HIGH - 5) step = -leap;
      else if (last < MELODY_LOW + 5) step = leap;
      midi = safe[Math.min(safe.length - 1, Math.max(0, from + step))];
    }
    melody.push({ slot, midi, velocity: (strong ? 0.85 : 0.6) + random() * 0.15 });
    last = midi;
    reference = midi;
    run++;
  }

  const bell = scene.place === "destiny" && index % 2 === 0 ? key.tonic : null;
  return { name, seconds: MOOD_SHAPES[scene.mood].chordSeconds, bass, pad, melody, bell };
}

/** Nearest pentatonic note of the season's key, so interaction sounds join the music. */
export function inKeyHz(season: Season, hz: number): number {
  const midi = Math.round(hzToMidi(hz));
  const candidates = pentatonicNotes(season, midi - 3, midi + 3);
  const nearest = candidates.reduce((best, m) => (Math.abs(m - midi) < Math.abs(best - midi) ? m : best));
  return midiToHz(nearest);
}

/**
 * The classical correspondence of the five tones to the Five Elements:
 * 土 宫, 金 商, 木 角, 火 徵, 水 羽 — sounded in the current key.
 */
export const ELEMENT_DEGREE: Record<string, (typeof PENTATONIC)[number]> = {
  earth: 0,
  metal: 2,
  wood: 4,
  fire: 7,
  water: 9,
};

export function elementHz(season: Season, element: string): number | null {
  const degree = ELEMENT_DEGREE[element];
  if (degree === undefined) return null;
  // One octave above the pad tonic: clear but not shrill.
  return midiToHz(SEASON_KEYS[season].tonic + 12 + degree);
}
