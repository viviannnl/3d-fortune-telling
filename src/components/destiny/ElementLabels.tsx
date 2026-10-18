"use client";

import { registerLabel } from "@/components/world/labelRegistry";
import { ELEMENTS } from "@/features/destiny/symbols";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { useDestiny } from "@/stores/destiny";

/** Decorative name + count tags over the 3D element objects (the chart panel carries the semantics). */
export function ElementLabels() {
  const t = useDictionary().destiny;
  const chart = useDestiny((s) => s.chart);
  const selection = useDestiny((s) => s.selection);
  if (!chart) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ELEMENTS.map((el) => (
        <span
          key={el}
          ref={(node) => {
            registerLabel(`element:${el}`, node);
            return () => registerLabel(`element:${el}`, null);
          }}
          style={{ visibility: "hidden" }}
          className="absolute top-0 left-0 whitespace-nowrap will-change-transform"
        >
          <span
            data-selected={selection?.kind === "element" && selection.id === el}
            className="block rounded-pill bg-midnight/45 px-2.5 py-0.5 text-sm tracking-wide text-text opacity-90 backdrop-blur-[2px] transition-opacity duration-150 [text-shadow:var(--text-halo)] data-[selected=true]:bg-deep-violet/80 data-[selected=true]:opacity-100"
          >
            {t.elementNames[el]} {chart.elementCounts[el]}
          </span>
        </span>
      ))}
    </div>
  );
}
