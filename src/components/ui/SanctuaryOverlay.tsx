"use client";

import { ArrowRight } from "lucide-react";
import { ArmillaryGlyph, TarotGlyph } from "./icons";
import { playSound } from "@/lib/audio/engine";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { format } from "@/lib/i18n/dictionaries";
import { CHARMS, useCharms } from "@/stores/charms";
import { DESTINATIONS, useExperience, type DestinationId } from "@/stores/experience";

/** Title, hint, and keyboard-accessible destination buttons mirrored with the 3D hotspots. */
export function SanctuaryOverlay() {
  const t = useDictionary();
  const hovered = useExperience((s) => s.hovered);
  const setHovered = useExperience((s) => s.setHovered);
  const found = useCharms((s) => s.found.length);

  const enter = (id: DestinationId) => {
    if (useExperience.getState().enter(id)) playSound("enter");
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* The moon is the visual focal point; the page title stays available to assistive tech. */}
      <h1 className="sr-only">
        {t.brand.name} — {t.hero.title}
      </h1>
      <p className="mx-auto mt-auto animate-fade-in text-center text-xs tracking-[0.22em] text-text uppercase opacity-80 [text-shadow:var(--text-halo)]">
        {t.hint} · <span className="text-champagne">{t.charms.hint}</span>
      </p>
      {found > 0 && (
        <p
          data-testid="charm-progress"
          className="mx-auto mt-1.5 animate-fade-in text-center text-xs tracking-wide text-champagne/90 [text-shadow:var(--text-halo)]"
        >
          ✦ {found >= CHARMS.length ? t.charms.allFound : format(t.charms.progress, { n: found, total: CHARMS.length })}
        </p>
      )}

      <nav
        aria-label={t.destinations.navLabel}
        className="pointer-events-auto mx-auto mt-4 mb-5 flex flex-wrap justify-center gap-3"
      >
        {DESTINATIONS.map((id) => {
          const d = t.destinations[id];
          const active = hovered === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => enter(id)}
              onPointerEnter={() => setHovered(id)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(id)}
              onBlur={() => setHovered(null)}
              data-active={active}
              className="group control-surface relative flex w-72 cursor-pointer items-center gap-3.5 overflow-hidden rounded-md px-4 py-3.5 text-left transition-[transform,border-color,background-color] duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] data-[active=true]:border-border"
            >
              {/* Champagne hairline that brightens on hover/focus, echoing the world's gilded edges */}
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-champagne/50 to-transparent opacity-60 transition-opacity duration-150 group-hover:opacity-100 group-data-[active=true]:opacity-100"
              />
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle text-accent transition-colors duration-150 group-hover:border-border group-hover:text-moonlight">
                {id === "tarot" ? <TarotGlyph className="size-5" /> : <ArmillaryGlyph className="size-5" />}
              </span>
              <span className="flex-1">
                <span className="block font-serif text-lg leading-tight text-text">{d.name}</span>
                <span className="mt-0.5 block text-xs leading-snug text-text-muted">{d.blurb}</span>
              </span>
              <ArrowRight
                aria-hidden
                className="size-4 text-text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
