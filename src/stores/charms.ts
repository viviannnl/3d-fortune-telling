import { create } from "zustand";
import { BLESSINGS, createBlessingBag, FINAL_BLESSING } from "@/features/blessings";
import type { LocalizedText } from "@/lib/i18n/types";

export const CHARMS = [
  "wisteria-left",
  "wisteria-right",
  "lantern-left",
  "lantern-right",
  "crystal-left",
  "crystal-right",
  "orb",
  "moon",
] as const;
export type CharmId = (typeof CHARMS)[number];

export interface Burst {
  seq: number;
  position: [number, number, number];
  color: string;
}

export interface Blessing {
  seq: number;
  text: LocalizedText;
  /** Viewport coordinates of the click, used to place the message. */
  x: number;
  y: number;
  final: boolean;
}

interface CharmStore {
  found: readonly CharmId[];
  blessing: Blessing | null;
  bursts: readonly Burst[];
  /** Increments once, when the last charm is found. */
  celebrateSeq: number;
  /** Time (performance.now) each charm was last touched, for per-object flares. */
  touched: Partial<Record<CharmId, number>>;
  touch: (id: CharmId, position: [number, number, number], screen: { x: number; y: number }, color?: string) => void;
  dismiss: () => void;
  clearBurst: (seq: number) => void;
}

let bag = createBlessingBag(BLESSINGS.length);
let seq = 0;

/** Test hook: deterministic blessing order. */
export function resetCharmBag(random?: () => number) {
  bag = createBlessingBag(BLESSINGS.length, random);
}

export const useCharms = create<CharmStore>()((set, get) => ({
  found: [],
  blessing: null,
  bursts: [],
  celebrateSeq: 0,
  touched: {},
  touch: (id, position, screen, color = "#e9d8ff") => {
    const { found } = get();
    const isNew = !found.includes(id);
    const nextFound = isNew ? [...found, id] : found;
    const completesSet = isNew && nextFound.length === CHARMS.length;
    seq += 1;
    set((s) => ({
      found: nextFound,
      touched: { ...s.touched, [id]: typeof performance !== "undefined" ? performance.now() : 0 },
      bursts: [...s.bursts.slice(-5), { seq, position, color }],
      blessing: {
        seq,
        text: completesSet ? FINAL_BLESSING : BLESSINGS[bag.next()],
        x: screen.x,
        y: screen.y,
        final: completesSet,
      },
      celebrateSeq: completesSet ? s.celebrateSeq + 1 : s.celebrateSeq,
    }));
  },
  dismiss: () => set({ blessing: null }),
  clearBurst: (burstSeq) => set((s) => ({ bursts: s.bursts.filter((b) => b.seq !== burstSeq) })),
}));
