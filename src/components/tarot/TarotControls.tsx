"use client";

import { useEffect, useRef } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { selectionsOf } from "@/features/tarot/reading";
import { CATEGORIES, SPREAD_POSITIONS } from "@/features/tarot/types";
import { playSound } from "@/lib/audio/engine";
import { format } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { useExperience } from "@/stores/experience";
import { useTarot } from "@/stores/tarot";
import { TarotReadingPanel } from "./TarotReadingPanel";

/** Compact HTML guide for each step of the reading; the 3D table carries the ritual. */
export function TarotControls() {
  const t = useDictionary().tarot;
  const reading = useTarot((s) => s.reading);
  const panelOpen = useTarot((s) => s.panelOpen);
  const { begin, pickRandom, reveal, reset, setPanelOpen } = useTarot.getState();

  // Quiet the world while cards are turned and read.
  useEffect(() => {
    const dim = panelOpen ? 0.85 : reading.phase === "revealing" || reading.phase === "complete" ? 0.55 : 0;
    useExperience.getState().setDim(dim);
  }, [reading.phase, panelOpen]);
  useEffect(() => {
    useExperience.getState().setCameraShift(panelOpen ? 1.15 : 0);
  }, [panelOpen]);
  useEffect(
    () => () => {
      useExperience.getState().setDim(0);
      useExperience.getState().setCameraShift(0);
    },
    [],
  );

  // The reveal control visibly rests between flips (and right after the spread completes).
  const pacing = useTarot((s) => s.pacing);
  const turn = () => {
    if (reveal()) playSound("flip");
  };

  // Keep keyboard focus on the next primary action as steps replace each other.
  const primary = useRef<HTMLButtonElement>(null);
  const firstCategory = useRef<HTMLButtonElement>(null);
  const stepKey = `${reading.phase}:${reading.picks.length}:${reading.revealed}`;
  const lastStep = useRef(stepKey);
  useEffect(() => {
    if (lastStep.current === stepKey) return;
    lastStep.current = stepKey;
    const active = document.activeElement;
    // Only move focus when it was lost or sat inside these controls (never steal it from elsewhere).
    if (active && active !== document.body && !active.closest("[data-testid=tarot-controls]")) return;
    (reading.phase === "choosing" ? firstCategory.current : primary.current)?.focus();
  }, [stepKey, reading.phase]);

  const picked = selectionsOf(reading);
  const nextPosition = SPREAD_POSITIONS[reading.revealed];

  return (
    <>
      <div
        data-testid="tarot-controls"
        data-phase={reading.phase}
        data-picks={reading.picks.length}
        data-revealed={reading.revealed}
        className="pointer-events-auto mt-auto w-full max-w-sm animate-rise-in rounded-md control-surface p-5 [animation-delay:700ms] md:mb-2"
      >
        {reading.phase === "choosing" && (
          <div>
            <p className="text-xs tracking-[0.18em] text-text-muted uppercase">{t.deckLabel}</p>
            <h3 className="mt-2 font-serif text-xl text-text">{t.choose.title}</h3>
            <div className="mt-4 flex flex-col gap-2">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c}
                  ref={i === 0 ? firstCategory : undefined}
                  type="button"
                  onClick={() => {
                    begin(c);
                    playSound("select");
                  }}
                  className="cursor-pointer rounded-md border border-border-subtle px-4 py-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out hover:border-border hover:bg-surface-raised/60 active:scale-[0.99]"
                >
                  <span className="block font-serif text-lg leading-tight text-text">
                    {t.choose.categories[c].name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-text-muted">
                    {t.choose.categories[c].blurb}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {reading.phase !== "choosing" && reading.category && (
          <p className="text-xs tracking-[0.18em] text-text-muted uppercase">
            {t.choose.categories[reading.category].name} · {t.deckLabel}
          </p>
        )}

        {reading.phase === "drawing" && (
          <div>
            <h3 className="mt-2 font-serif text-xl text-text">{t.draw.title}</h3>
            <p className="mt-1 text-sm text-text-muted" aria-live="polite">
              {format(t.draw.progress, { n: reading.picks.length })}
            </p>
          </div>
        )}

        {reading.phase !== "choosing" && (
          <ol className="mt-3 grid grid-cols-3 gap-2" aria-label={t.panel.title}>
            {SPREAD_POSITIONS.map((pos, i) => {
              const filled = i < picked.length;
              return (
                <li
                  key={pos}
                  data-filled={filled}
                  className="flex items-center gap-1.5 rounded-sm border border-border-subtle px-2 py-1.5 text-xs text-text-muted data-[filled=true]:border-border data-[filled=true]:text-text"
                >
                  {filled ? (
                    <Check aria-hidden className="size-3.5 text-accent" />
                  ) : (
                    <span aria-hidden className="size-3.5" />
                  )}
                  <span>{t.positions[pos]}</span>
                </li>
              );
            })}
          </ol>
        )}

        {reading.phase === "revealing" && nextPosition && (
          <div className="mt-4">
            <h3 className="font-serif text-xl text-text">{t.reveal.title}</h3>
            <p className="mt-1 text-sm text-text-muted">{t.reveal.hint}</p>
          </div>
        )}

        {reading.phase === "complete" && <h3 className="mt-4 font-serif text-xl text-text">{t.complete.title}</h3>}

        <div className="mt-4 flex flex-wrap gap-2">
          {reading.phase === "drawing" && (
            <Button
              key="draw"
              ref={primary}
              variant="primary"
              onClick={() => {
                if (pickRandom()) playSound("select");
              }}
            >
              <Sparkles aria-hidden className="size-4" />
              {t.draw.drawForMe}
            </Button>
          )}
          {reading.phase === "revealing" && nextPosition && (
            <Button
              key="turn"
              ref={primary}
              variant="primary"
              onClick={turn}
              aria-disabled={pacing}
              data-testid="tarot-turn"
            >
              {format(t.reveal.action, { position: t.positions[nextPosition] })}
            </Button>
          )}
          {reading.phase === "complete" && (
            <Button
              key="open"
              ref={primary}
              variant="primary"
              onClick={() => setPanelOpen(true)}
              aria-expanded={panelOpen}
            >
              {t.complete.open}
            </Button>
          )}
          {reading.phase !== "choosing" && (
            <Button variant="ghost" onClick={reset}>
              {reading.phase === "complete" ? t.restart : t.startOver}
            </Button>
          )}
        </div>
      </div>

      {panelOpen && reading.phase === "complete" && <TarotReadingPanel />}
    </>
  );
}
