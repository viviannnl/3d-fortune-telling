import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addWish, normalizeWish, parseWishes, type Wish } from "@/features/wishes/wish";

interface WishStore {
  wishes: readonly Wish[];
  /** Lantern under the pointer, for showing its wish. Never persisted. */
  hoveredId: string | null;
  setHovered: (id: string | null) => void;
  /** Increments per release so the 3D layer can animate the newest lantern. */
  releaseSeq: number;
  /** Returns false when the text was empty after trimming. */
  release: (raw: string, now?: number) => boolean;
  clear: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Wishes are stored only in this browser; nothing is ever uploaded. */
export const useWishes = create<WishStore>()(
  persist(
    (set) => ({
      wishes: [],
      hoveredId: null,
      setHovered: (hoveredId) => set({ hoveredId }),
      releaseSeq: 0,
      release: (raw, now = Date.now()) => {
        const text = normalizeWish(raw);
        if (!text) return false;
        set((s) => ({ wishes: addWish(s.wishes, text, now, newId()), releaseSeq: s.releaseSeq + 1 }));
        return true;
      },
      clear: () => set({ wishes: [], releaseSeq: 0, hoveredId: null }),
    }),
    {
      name: "mts-wishes",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ wishes }) => ({ wishes }),
      merge: (persisted, current) => ({
        ...current,
        wishes: parseWishes((persisted as { wishes?: unknown } | undefined)?.wishes),
      }),
      skipHydration: true,
    },
  ),
);
