import { create } from "zustand";

export const DESTINATIONS = ["tarot", "destiny"] as const;
export type DestinationId = (typeof DESTINATIONS)[number];
export type View = "sanctuary" | DestinationId;

export interface EnterPulse {
  id: DestinationId;
  /** Increments on every successful entry so effects can retrigger. */
  seq: number;
}

interface ExperienceState {
  view: View;
  hovered: DestinationId | null;
  lastEnter: EnterPulse | null;
  /** 0 = full ambience, 1 = maximally quiet (used while a reading is revealed). */
  dim: number;
  /** Horizontal camera offset (world units) so side panels don't cover the subject. */
  cameraShift: number;
  setHovered: (id: DestinationId | null) => void;
  /** Enters a destination from the sanctuary. Returns false if the request was ignored. */
  enter: (id: DestinationId) => boolean;
  /** Returns to the sanctuary from any destination. */
  exit: () => void;
  setDim: (dim: number) => void;
  setCameraShift: (shift: number) => void;
}

export const useExperience = create<ExperienceState>()((set, get) => ({
  view: "sanctuary",
  hovered: null,
  lastEnter: null,
  dim: 0,
  cameraShift: 0,
  setHovered: (id) => {
    if (get().view !== "sanctuary" && id !== null) return;
    if (get().hovered !== id) set({ hovered: id });
  },
  enter: (id) => {
    const { view, lastEnter } = get();
    if (view !== "sanctuary") return false;
    set({ view: id, hovered: null, lastEnter: { id, seq: (lastEnter?.seq ?? 0) + 1 } });
    return true;
  },
  exit: () => {
    if (get().view === "sanctuary") return;
    set({ view: "sanctuary", hovered: null, dim: 0, cameraShift: 0 });
  },
  setDim: (dim) => set({ dim: Math.min(1, Math.max(0, dim)) }),
  setCameraShift: (cameraShift) => set({ cameraShift }),
}));
