"use client";

import { registerLabel } from "@/components/world/labelRegistry";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { DESTINATIONS, useExperience } from "@/stores/experience";

/** Decorative name tags that float over the 3D destinations (the nav buttons carry the semantics). */
export function DestinationLabels() {
  const t = useDictionary();
  const hovered = useExperience((s) => s.hovered);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {DESTINATIONS.map((id) => (
        <span
          key={id}
          ref={(el) => {
            registerLabel(`destination:${id}`, el);
            return () => registerLabel(`destination:${id}`, null);
          }}
          style={{ visibility: "hidden" }}
          className="absolute top-0 left-0 whitespace-nowrap will-change-transform"
        >
          <span
            className={[
              "block font-serif text-lg tracking-[0.14em] text-text transition-[opacity,translate] duration-[250ms] ease-out [text-shadow:var(--text-halo)]",
              hovered === id ? "translate-y-0 opacity-100" : "translate-y-1 opacity-60",
            ].join(" ")}
          >
            {t.destinations[id].name}
          </span>
        </span>
      ))}
    </div>
  );
}
