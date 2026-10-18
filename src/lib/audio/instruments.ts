import { midiToHz, seeded } from "./score";

/**
 * Synthesized instruments. Each takes a start time on the audio clock and an
 * output node, schedules itself, and cleans up when its last voice ends.
 * Works on any BaseAudioContext, so the score can be rendered offline too.
 */

type Ctx = BaseAudioContext;

/** A stereo room built from decaying noise, darkened over time like a real hall. */
export function createReverb(ac: Ctx, seconds = 4.5): ConvolverNode {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const random = seeded(17 + ch * 31);
    let low = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // A one-pole low-pass whose cutoff falls with time: the tail loses its sparkle.
      const k = 0.55 - 0.47 * t;
      low += k * (random() * 2 - 1 - low);
      // Short fade-in avoids a click; the body decays exponentially.
      data[i] = low * Math.min(1, i / (ac.sampleRate * 0.012)) * Math.exp(-5.2 * t);
    }
  }
  const convolver = ac.createConvolver();
  convolver.buffer = buffer;
  return convolver;
}

function panned(ac: Ctx, out: AudioNode, pan: number): AudioNode {
  const p = ac.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(out);
  return p;
}

/**
 * One pad note: two detuned voices, a slow swell in and a long release, so
 * consecutive chords cross-fade into each other.
 */
export function padNote(
  ac: Ctx,
  out: AudioNode,
  midi: number,
  at: number,
  seconds: number,
  level: number,
  pan: number,
) {
  const attack = Math.min(3.5, seconds * 0.35);
  const release = 4.5;
  const end = at + seconds + release;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + attack);
  g.gain.setValueAtTime(level, at + seconds);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  g.connect(panned(ac, out, pan));
  const hz = midiToHz(midi);
  (
    [
      ["triangle", -7, 1],
      ["sawtooth", 6, 0.22],
    ] as const
  ).forEach(([type, cents, mix]) => {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.value = hz;
    osc.detune.value = cents;
    const m = ac.createGain();
    m.gain.value = mix;
    osc.connect(m).connect(g);
    osc.start(at);
    osc.stop(end + 0.05);
  });
}

/** A soft, round bass under each chord. */
export function bassNote(ac: Ctx, out: AudioNode, midi: number, at: number, seconds: number, level: number) {
  const end = at + seconds + 3.5;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + 2.5);
  g.gain.setValueAtTime(level, at + seconds);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  g.connect(out);
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.value = midiToHz(midi);
  osc.connect(g);
  osc.start(at);
  osc.stop(end + 0.05);
}

/** Struck partials with independent decays: the core of every bell-like sound. */
function partials(
  ac: Ctx,
  out: AudioNode,
  hz: number,
  at: number,
  level: number,
  spec: readonly (readonly [ratio: number, amp: number, decay: number])[],
) {
  let last = at;
  spec.forEach(([ratio, amp, decay]) => {
    const f = hz * ratio;
    if (f > 16_000) return;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level * amp, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + decay + 0.05);
    last = Math.max(last, at + decay);
  });
  return last;
}

/** Celesta / music box: bright attack, glassy and short. The sanctuary's voice. */
export function celesta(ac: Ctx, out: AudioNode, midi: number, at: number, level: number, pan: number) {
  partials(ac, panned(ac, out, pan), midiToHz(midi), at, level, [
    [1, 1, 2.8],
    [2, 0.28, 1.4],
    [3.01, 0.08, 0.7],
    [4.02, 0.12, 0.5],
  ]);
}

/**
 * Plucked string: rich harmonics through a filter that closes quickly, the way
 * a string's brightness dies before its body. `bend` slides in from below in
 * cents and `vibrato` adds the pressed-string waver of a guzheng.
 */
function pluck(
  ac: Ctx,
  out: AudioNode,
  midi: number,
  at: number,
  level: number,
  pan: number,
  { decay, bend = 0, vibrato = 0 }: { decay: number; bend?: number; vibrato?: number },
) {
  const hz = midiToHz(midi);
  const real = new Float32Array(12);
  const imag = new Float32Array(12);
  for (let n = 1; n < 12; n++) imag[n] = 1 / n ** 1.4;
  const osc = ac.createOscillator();
  osc.setPeriodicWave(ac.createPeriodicWave(real, imag));
  osc.frequency.value = hz;
  if (bend !== 0) {
    osc.detune.setValueAtTime(bend, at);
    osc.detune.exponentialRampToValueAtTime(-0.5, at + 0.18);
    osc.detune.linearRampToValueAtTime(0, at + 0.2);
  }
  if (vibrato > 0) {
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5.2;
    const depth = ac.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(vibrato, at + 0.6);
    lfo.connect(depth).connect(osc.detune);
    lfo.start(at);
    lfo.stop(at + decay + 0.05);
  }
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(Math.min(12_000, hz * 9), at);
  filter.frequency.exponentialRampToValueAtTime(Math.max(200, hz * 1.5), at + decay * 0.5);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc
    .connect(filter)
    .connect(g)
    .connect(panned(ac, out, pan));
  osc.start(at);
  osc.stop(at + decay + 0.05);
}

/** Harp: the Tarot Garden's voice. */
export function harp(ac: Ctx, out: AudioNode, midi: number, at: number, level: number, pan: number) {
  pluck(ac, out, midi, at, level, pan, { decay: 3.2 });
}

/** Guzheng: the Destiny Palace's voice, sometimes sliding into the note. */
export function guzheng(ac: Ctx, out: AudioNode, midi: number, at: number, level: number, pan: number, slide: boolean) {
  pluck(ac, out, midi, at, level, pan, { decay: 2.6, bend: slide ? -140 : 0, vibrato: 14 });
}

/** A low temple bell: inharmonic, long, felt more than heard. */
export function templeBell(ac: Ctx, out: AudioNode, midi: number, at: number, level: number) {
  partials(ac, out, midiToHz(midi), at, level, [
    [0.5, 0.5, 7],
    [1, 1, 6],
    [1.19, 0.35, 4],
    [1.56, 0.3, 3.2],
    [2.0, 0.22, 2.6],
    [2.74, 0.15, 1.8],
  ]);
}

/** A chime for interface sounds, in the same voice family as the music. */
export function chime(ac: Ctx, out: AudioNode, hz: number, at: number, level: number, decay: number) {
  partials(ac, out, hz, at, level, [
    [1, 1, decay],
    [2.76, 0.5, decay / 1.6],
    [5.4, 0.33, decay / 2.2],
  ]);
}

/** Night air over water: filtered noise, swelling and ebbing very slowly. */
export function wind(ac: Ctx, out: AudioNode, at: number, level: number): { stop: (when: number) => void } {
  const seconds = 6;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const data = buffer.getChannelData(0);
  const random = seeded(5);
  // Brown-ish noise: soft and low, never hissy.
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    b = (b + 0.02 * (random() * 2 - 1)) / 1.02;
    data[i] = b * 3.5;
  }
  // Cross-fade the loop seam.
  const fade = Math.floor(ac.sampleRate * 0.5);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] = data[i] * k + data[data.length - fade + i] * (1 - k);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = 0;
  src.loopEnd = seconds - 0.5;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.6;
  const sweep = ac.createOscillator();
  sweep.frequency.value = 0.031;
  const sweepDepth = ac.createGain();
  sweepDepth.gain.value = 180;
  sweep.connect(sweepDepth).connect(filter.frequency);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + 6);
  const swell = ac.createOscillator();
  swell.frequency.value = 0.047;
  const swellDepth = ac.createGain();
  swellDepth.gain.value = level * 0.45;
  swell.connect(swellDepth).connect(g.gain);
  src.connect(filter).connect(g).connect(out);
  [src, sweep, swell].forEach((s) => s.start(at));
  return { stop: (when) => [src, sweep, swell].forEach((s) => s.stop(when)) };
}
