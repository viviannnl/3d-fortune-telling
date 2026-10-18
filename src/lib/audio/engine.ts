/**
 * Procedural Web Audio: a generative score that follows the sky and the
 * visitor, plus restrained interface sounds in the same key.
 * Nothing plays until setAudioEnabled(true) is called from a user gesture.
 */

import { createConductor, createMusicGraph, type Conductor, type MusicGraph } from "./conductor";
import { chime, createReverb } from "./instruments";
import { DEFAULT_SCENE, elementHz, inKeyHz, type MusicScene } from "./score";

export type SoundName = "hover" | "enter" | "select" | "flip" | "reveal" | "back" | "blessing" | "ripple" | "element";
export type { MusicScene } from "./score";

/** How far ahead of the audio clock the score is scheduled, and how often. */
const LOOKAHEAD = 3;
const TICK_MS = 250;
/** Music and effects levels before the user's own volume; cues sit a few dB above the music. */
const MUSIC_LEVEL = 0.9;
const EFFECTS_LEVEL = 2.0;

interface Session {
  /** Fades the whole score in on start and out on stop. */
  fade: GainNode;
  graph: MusicGraph;
  conductor: Conductor;
  timer: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let effectsBus: GainNode | null = null;
let session: Session | null = null;
let enabled = false;
let scene: MusicScene = DEFAULT_SCENE;
let volumes = { music: 0.7, effects: 0.8 };

/** The shared output: music and effects meet in a gentle limiter, then the master fade. */
function buildOutput(ac: BaseAudioContext) {
  const out = ac.createGain();
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.01;
  limiter.release.value = 0.4;
  limiter.connect(out);
  const music = ac.createGain();
  music.connect(limiter);
  const effects = ac.createGain();
  effects.connect(limiter);
  // Interface sounds share a smaller room so they sit in the same space as the music.
  const room = createReverb(ac, 2.4);
  const send = ac.createGain();
  send.gain.value = 0.3;
  effects.connect(send).connect(room).connect(limiter);
  return { out, music, effects };
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (!ctx) {
    ctx = new window.AudioContext();
    const { out, music, effects } = buildOutput(ctx);
    master = out;
    master.gain.value = 0;
    master.connect(ctx.destination);
    musicBus = music;
    effectsBus = effects;
    applyVolumes(0);
  }
  return ctx;
}

function applyVolumes(glide: number) {
  if (!ctx || !musicBus || !effectsBus) return;
  const t = ctx.currentTime;
  // Perceived loudness is roughly logarithmic; squaring makes the slider feel even.
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL * volumes.music ** 2, t, glide || 0.001);
  effectsBus.gain.setTargetAtTime(EFFECTS_LEVEL * volumes.effects ** 2, t, glide || 0.001);
}

function startMusic(ac: AudioContext, out: AudioNode): Session {
  const fade = ac.createGain();
  fade.connect(out);
  fade.gain.setValueAtTime(0, ac.currentTime);
  fade.gain.linearRampToValueAtTime(1, ac.currentTime + 4);
  const graph = createMusicGraph(ac, fade);
  const seed = Math.floor(Math.random() * 1e9);
  const conductor = createConductor(ac, graph, () => scene, seed, ac.currentTime + 0.1);
  conductor.scheduleUntil(ac.currentTime + LOOKAHEAD);
  const timer = window.setInterval(() => conductor.scheduleUntil(ac.currentTime + LOOKAHEAD), TICK_MS);
  return { fade, graph, conductor, timer };
}

function stopMusic(ac: AudioContext, s: Session) {
  window.clearInterval(s.timer);
  const t = ac.currentTime;
  s.fade.gain.cancelScheduledValues(t);
  s.fade.gain.setValueAtTime(s.fade.gain.value, t);
  s.fade.gain.linearRampToValueAtTime(0, t + 0.6);
  s.conductor.stop(t + 0.7);
  // Notes already scheduled play into a silent, then disconnected, graph.
  window.setTimeout(() => {
    s.graph.disconnect();
    s.fade.disconnect();
  }, 800);
}

export function isAudioEnabled(): boolean {
  return enabled;
}

/** Turns all sound on or off. Turning on must happen inside a user gesture. */
export function setAudioEnabled(on: boolean): void {
  enabled = on;
  const ac = ensureContext();
  if (!ac || !master || !musicBus) return;
  const t = ac.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  if (on) {
    void ac.resume();
    master.gain.linearRampToValueAtTime(1, t + 0.3);
    session ??= startMusic(ac, musicBus);
  } else {
    // Mute immediately; then release the music.
    master.gain.setValueAtTime(0, t);
    if (session) stopMusic(ac, session);
    session = null;
  }
}

/** What the music should reflect right now. Changes are heard within a few seconds. */
export function setMusicScene(next: Partial<MusicScene>): void {
  scene = { ...scene, ...next };
}

/** Music and effects volume, each 0..1. */
export function setVolumes(next: { music: number; effects: number }): void {
  const clamp = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
  volumes = { music: clamp(next.music), effects: clamp(next.effects) };
  applyVolumes(0.05);
}

/** Plays the pentatonic tone of one of the Five Elements, in the music's key. */
export function playElementTone(element: string): void {
  const hz = elementHz(scene.season, element);
  if (!enabled || !ctx || !effectsBus || ctx.state !== "running" || hz === null) return;
  const t = ctx.currentTime;
  chime(ctx, effectsBus, hz, t, 0.05, 1.9);
  chime(ctx, effectsBus, hz * 2, t + 0.04, 0.02, 1.2);
}

function whoosh(ac: BaseAudioContext, out: AudioNode, at: number, level: number, duration: number) {
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
  src.start(at);
}

/** Schedules one interface cue at `t`. */
function cue(ac: BaseAudioContext, out: AudioNode, name: SoundName, t: number, season: MusicScene["season"]) {
  // Every pitched cue is pulled to the nearest note of the music's scale.
  const ring = (hz: number, level: number, decay: number, delay = 0) =>
    chime(ac, out, inKeyHz(season, hz), t + delay, level, decay);
  switch (name) {
    case "hover":
      ring(1318.5, 0.024, 0.35);
      break;
    case "enter":
      ring(523.25, 0.05, 2.2);
      ring(783.99, 0.035, 2.0, 0.12);
      break;
    case "select":
      ring(659.25, 0.035, 1.0);
      break;
    case "flip":
      whoosh(ac, out, t, 0.08, 0.22);
      break;
    case "reveal":
      ring(880, 0.03, 1.6);
      break;
    case "ripple":
      // A soft low plink, like a drop on still water.
      ring(196, 0.032, 1.1);
      break;
    case "element":
      // Pentatonic note chosen by the caller via `playElementTone`.
      break;
    case "blessing":
      // A soft rising arpeggio, like wind chimes.
      [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => ring(f, 0.028, 1.8, i * 0.09));
      break;
    case "back":
      ring(392, 0.035, 1.4);
      break;
  }
}

export function playSound(name: SoundName): void {
  if (!enabled || !ctx || !effectsBus || ctx.state !== "running") return;
  cue(ctx, effectsBus, name, ctx.currentTime, scene.season);
}

/**
 * Renders the score offline for a fixed scene, through the same graph and
 * limiter as live playback. Used to measure levels and balance during
 * development; never called by the experience itself.
 */
export async function renderMusicOffline(
  at: MusicScene,
  seconds: number,
  { seed = 1, music = true, cues = [] }: { seed?: number; music?: boolean; cues?: { name: SoundName; at: number }[] } = {},
): Promise<AudioBuffer> {
  const sampleRate = 44_100;
  const ac = new OfflineAudioContext(2, Math.ceil(sampleRate * seconds), sampleRate);
  const { out, music: musicOut, effects } = buildOutput(ac);
  out.connect(ac.destination);
  musicOut.gain.value = MUSIC_LEVEL * volumes.music ** 2;
  effects.gain.value = EFFECTS_LEVEL * volumes.effects ** 2;
  if (music) {
    const graph = createMusicGraph(ac, musicOut);
    createConductor(ac, graph, () => at, seed, 0.1).scheduleUntil(seconds);
  }
  for (const c of cues) cue(ac, effects, c.name, c.at, at.season);
  return ac.startRendering();
}
