"use client";

import { MOON_PHASE_NAMES } from "@/features/sky/celestial";
import { format } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useSky } from "@/components/world/useSky";

/** Tiny crescent/disc that mirrors the real phase. */
function PhaseGlyph({ illumination, waxing }: { illumination: number; waxing: boolean }) {
  // Offset a shadow disc across the lit disc; direction follows waxing/waning.
  const shift = (1 - illumination) * 2 * (waxing ? 1 : -1);
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" aria-hidden className="size-3.5 overflow-visible">
      <defs>
        <mask id="moon-phase-mask">
          <circle r="1" fill="#fff" />
          <circle r="1.02" cx={shift} fill="#000" />
        </mask>
      </defs>
      <circle r="1" fill="currentColor" opacity={0.22} />
      <circle r="1" fill="currentColor" mask="url(#moon-phase-mask)" />
    </svg>
  );
}

/** One quiet line of real sky data: lunar date, solar term, and moon phase. */
export function SkyLine() {
  const t = useDictionary();
  const locale = usePreferences((s) => s.locale);
  const sky = useSky();
  if (!sky) return null;

  const term = format(t.sky.termDay, { term: sky.solarTerm.name, n: sky.solarTerm.dayIndex });
  const lunar = locale === "zh" ? sky.lunar.full : `${sky.lunar.monthName}${sky.lunar.dayName}`;

  return (
    <p
      data-testid="sky-line"
      data-season={sky.season}
      data-mood={sky.mood}
      title={t.sky.note}
      className="mt-2 flex items-center gap-2 text-xs leading-relaxed tracking-wide text-text-muted [text-shadow:var(--text-halo)]"
    >
      <span className="text-champagne">
        <PhaseGlyph illumination={sky.moon.illumination} waxing={sky.moon.waxing} />
      </span>
      <span lang={locale === "zh" ? "zh-Hans" : undefined}>
        {MOON_PHASE_NAMES[sky.moon.phase][locale]} · {lunar} · {term} · {t.sky.seasons[sky.season]}
      </span>
    </p>
  );
}
