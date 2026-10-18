"use client";

import { registerLabel } from "@/components/world/labelRegistry";
import { useWishes } from "@/stores/wishes";

/** A drifting lantern reveals its wish as readable HTML when hovered. */
export function WishLabels() {
  const wishes = useWishes((s) => s.wishes);
  const hoveredId = useWishes((s) => s.hoveredId);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {wishes.map((w) => (
        <span
          key={w.id}
          ref={(node) => {
            registerLabel(`wish:${w.id}`, node);
            return () => registerLabel(`wish:${w.id}`, null);
          }}
          style={{ visibility: "hidden" }}
          className="absolute top-0 left-0 max-w-[16rem] whitespace-nowrap will-change-transform"
        >
          <span
            data-visible={hoveredId === w.id}
            className="block overflow-hidden rounded-pill bg-midnight/70 px-2.5 py-1 text-xs text-ellipsis text-champagne opacity-0 backdrop-blur-[2px] transition-opacity duration-150 [text-shadow:var(--text-halo)] data-[visible=true]:opacity-100"
          >
            {w.text}
          </span>
        </span>
      ))}
    </div>
  );
}
