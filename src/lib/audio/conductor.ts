import { bassNote, celesta, createReverb, guzheng, harp, padNote, templeBell, wind } from "./instruments";
import { MOOD_SHAPES, scoreChord, seeded, SLOTS, type MusicScene } from "./score";

/**
 * Plays the score: schedules chords and melody a little ahead of the audio
 * clock, reading the current scene each time, so the music follows the sky
 * and the visitor without ever stopping or jumping.
 */

/** Per-voice levels, set by measuring offline renders (see the music review notes). */
const LEVEL = { pad: 0.05, air: 0.012, bass: 0.035, melody: 0.22, bell: 0.07, wind: 0.018, reverbSend: 0.55 } as const;
const PAD_PAN = [-0.6, -0.2, 0.25, 0.6];
/** The lowest pad voice sits back so the chord stays clear rather than thick. */
const PAD_WEIGHT = [0.6, 0.85, 1, 1];

export interface MusicGraph {
  /** Pads pass through a low-pass whose cutoff follows the time of day. */
  pad: GainNode;
  bass: GainNode;
  melody: GainNode;
  bell: GainNode;
  ambience: GainNode;
  brightness: BiquadFilterNode;
  /** Steps the whole score back while a reading is open. */
  presence: GainNode;
  disconnect: () => void;
}

/** Builds the music's mixing graph into `out`, with its own room reverb. */
export function createMusicGraph(ac: BaseAudioContext, out: AudioNode): MusicGraph {
  const presence = ac.createGain();
  presence.connect(out);
  const reverb = createReverb(ac);
  const wet = ac.createGain();
  wet.gain.value = 1;
  reverb.connect(wet).connect(presence);
  const mix = ac.createGain();
  // Clear out rumble below the bass line; it only muddies small speakers.
  const tidy = ac.createBiquadFilter();
  tidy.type = "highpass";
  tidy.frequency.value = 65;
  tidy.Q.value = 0.6;
  mix.connect(tidy).connect(presence);
  const send = ac.createGain();
  send.gain.value = LEVEL.reverbSend;
  tidy.connect(send).connect(reverb);

  const brightness = ac.createBiquadFilter();
  brightness.type = "lowpass";
  brightness.Q.value = 0.5;
  brightness.frequency.value = 2000;
  const pad = ac.createGain();
  pad.connect(brightness).connect(mix);
  const bass = ac.createGain();
  bass.connect(mix);
  const melody = ac.createGain();
  melody.connect(mix);
  // The bell lives mostly in the room.
  const bell = ac.createGain();
  bell.connect(reverb);
  bell.connect(mix);
  const ambience = ac.createGain();
  ambience.connect(presence);

  return {
    pad,
    bass,
    melody,
    bell,
    ambience,
    brightness,
    presence,
    disconnect: () => [presence, reverb, wet, mix, tidy, send, brightness, pad, bass, melody, bell, ambience].forEach((n) => n.disconnect()),
  };
}

interface PendingNote {
  at: number;
  midi: number;
  velocity: number;
}

export interface Conductor {
  /** Schedules everything that starts before `until` (audio-clock seconds). */
  scheduleUntil: (until: number) => void;
  stop: (when: number) => void;
}

export function createConductor(
  ac: BaseAudioContext,
  graph: MusicGraph,
  scene: () => MusicScene,
  seed: number,
  start: number,
): Conductor {
  const random = seeded(seed);
  let index = 0;
  let nextChord = start;
  let lastMelody: number | null = null;
  const pending: PendingNote[] = [];
  const air = wind(ac, graph.ambience, start, LEVEL.wind);

  // Glide the room's colour and presence only when the scene actually changes.
  let shaped = "";
  const shape = (s: MusicScene, at: number) => {
    const key = `${s.mood}|${s.dim}`;
    if (key === shaped) return;
    const first = shaped === "";
    shaped = key;
    const brightness = MOOD_SHAPES[s.mood].brightness;
    const presence = 1 - 0.4 * s.dim;
    if (first) {
      graph.brightness.frequency.setValueAtTime(brightness, at);
      graph.presence.gain.setValueAtTime(presence, at);
      return;
    }
    graph.brightness.frequency.setTargetAtTime(brightness, at, 3);
    graph.presence.gain.setTargetAtTime(presence, at, 1.2);
  };

  const scheduleChord = (s: MusicScene, at: number) => {
    const chord = scoreChord(s, index, seed, lastMelody);
    chord.pad.forEach((m, i) =>
      padNote(ac, graph.pad, m, at, chord.seconds, LEVEL.pad * (PAD_WEIGHT[i] ?? 1), PAD_PAN[i] ?? 0),
    );
    // A faint octave above the top voice: air, not another part.
    const top = Math.max(...chord.pad);
    padNote(ac, graph.melody, top + 12, at, chord.seconds, LEVEL.air, -PAD_PAN[3]);
    bassNote(ac, graph.bass, chord.bass, at, chord.seconds, LEVEL.bass);
    if (chord.bell !== null) templeBell(ac, graph.bell, chord.bell, at + 0.05, LEVEL.bell);
    const slot = chord.seconds / SLOTS;
    for (const n of chord.melody) {
      // A little human looseness in the timing.
      const sway = (random() - 0.5) * 0.08;
      pending.push({ at: at + n.slot * slot + slot * 0.5 + sway, midi: n.midi, velocity: n.velocity });
      lastMelody = n.midi;
    }
    index++;
    nextChord = at + chord.seconds;
  };

  return {
    scheduleUntil: (until) => {
      const s = scene();
      shape(s, Math.max(ac.currentTime, start));
      while (nextChord < until) scheduleChord(s, nextChord);
      // Melody notes take the voice of wherever the visitor is when they sound.
      pending.sort((a, b) => a.at - b.at);
      while (pending.length > 0 && pending[0].at < until) {
        const n = pending.shift();
        if (!n) break;
        const level = LEVEL.melody * n.velocity;
        const pan = (random() - 0.5) * 0.9;
        if (s.place === "tarot") harp(ac, graph.melody, n.midi, n.at, level, pan);
        else if (s.place === "destiny") guzheng(ac, graph.melody, n.midi, n.at, level, pan, random() < 0.3);
        else celesta(ac, graph.melody, n.midi, n.at, level * 0.9, pan);
      }
    },
    stop: (when) => air.stop(when),
  };
}
