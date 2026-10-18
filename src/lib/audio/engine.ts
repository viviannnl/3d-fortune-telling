/**
 * Procedural Web Audio: a quiet ambient pad and a few restrained effects.
 * Nothing plays until setAudioEnabled(true) is called from a user gesture.
 */

export type SoundName = "hover" | "enter" | "select" | "flip" | "reveal" | "back" | "blessing" | "ripple" | "element";

interface Ambient {
  stop: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: Ambient | null = null;
let enabled = false;

const MASTER_LEVEL = 0.9;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (!ctx) {
    ctx = new window.AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  return ctx;
}

function startAmbient(ac: AudioContext, out: AudioNode): Ambient {
  const bus = ac.createGain();
  bus.gain.value = 0;
  bus.gain.linearRampToValueAtTime(0.05, ac.currentTime + 3);
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.4;
  bus.connect(filter).connect(out);

  // D major 7 voicing, slowly breathing.
  const notes = [146.83, 220.0, 277.18, 369.99];
  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;
    const gain = ac.createGain();
    gain.gain.value = i === 0 ? 0.5 : 0.22;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.023;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.detune.value = (i - 1.5) * 4;
    osc.connect(gain).connect(bus);
    osc.start();
    lfo.start();
    sources.push(osc, lfo);
  });

  return {
    stop: () => {
      const t = ac.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.6);
      sources.forEach((s) => s.stop(t + 0.7));
    },
  };
}

function chime(ac: AudioContext, out: AudioNode, base: number, level: number, decay: number, delay = 0) {
  const t = ac.currentTime + delay;
  [1, 2.76, 5.4].forEach((ratio, i) => {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = base * ratio;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level / (i + 1), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay / (i * 0.6 + 1));
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.1);
  });
}

function whoosh(ac: AudioContext, out: AudioNode, level: number, duration: number) {
  const length = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1800;
  band.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.value = level;
  src.connect(band).connect(g).connect(out);
  src.start();
}

export function isAudioEnabled(): boolean {
  return enabled;
}

/** Turns all sound on or off. Turning on must happen inside a user gesture. */
export function setAudioEnabled(on: boolean): void {
  enabled = on;
  const ac = ensureContext();
  if (!ac || !master) return;
  const t = ac.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  if (on) {
    void ac.resume();
    master.gain.linearRampToValueAtTime(MASTER_LEVEL, t + 0.3);
    ambient ??= startAmbient(ac, master);
  } else {
    // Mute immediately; then release the ambient voices.
    master.gain.setValueAtTime(0, t);
    ambient?.stop();
    ambient = null;
  }
}

/** 五声音阶 (gong–shang–jue–zhi–yu) note per element, in generating-cycle order. */
const ELEMENT_TONES: Record<string, number> = { wood: 329.63, fire: 392.0, earth: 261.63, metal: 293.66, water: 440.0 };

/** Plays one pentatonic note for a Five Elements object. */
export function playElementTone(element: string): void {
  const base = ELEMENT_TONES[element];
  if (!enabled || !ctx || !master || ctx.state !== "running" || !base) return;
  chime(ctx, master, base, 0.045, 1.9);
  chime(ctx, master, base * 2, 0.018, 1.2, 0.04);
}

export function playSound(name: SoundName): void {
  if (!enabled || !ctx || !master || ctx.state !== "running") return;
  switch (name) {
    case "hover":
      chime(ctx, master, 1318.5, 0.012, 0.35);
      break;
    case "enter":
      chime(ctx, master, 523.25, 0.05, 2.2);
      chime(ctx, master, 783.99, 0.035, 2.0, 0.12);
      break;
    case "select":
      chime(ctx, master, 659.25, 0.035, 1.0);
      break;
    case "flip":
      whoosh(ctx, master, 0.05, 0.22);
      break;
    case "reveal":
      chime(ctx, master, 880, 0.03, 1.6);
      break;
    case "ripple":
      // A soft low plink, like a drop on still water.
      chime(ctx, master, 196, 0.02, 1.1);
      break;
    case "element":
      // Pentatonic note chosen by the caller via `elementTone`.
      break;
    case "blessing":
      // A soft rising arpeggio, like wind chimes.
      [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => chime(ctx!, master!, f, 0.028, 1.8, i * 0.09));
      break;
    case "back":
      chime(ctx, master, 392, 0.035, 1.4);
      break;
  }
}
