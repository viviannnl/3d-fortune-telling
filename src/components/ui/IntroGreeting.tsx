"use client";

import { useEffect, useState } from "react";
import { MOON_PHASE_NAMES } from "@/features/sky/celestial";
import { useSky } from "@/components/world/useSky";
import { format } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useWishes } from "@/stores/wishes";

/** Marks that this browser has been here before; nothing else is stored. */
const VISITED_KEY = "mts-visited";
const SHOW_MS = 7000;
const LETTER_MS = 32;

function Typed({ text, delay, className }: { text: string; delay: number; className: string }) {
  return (
    <span aria-hidden className={className}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          className="inline-block animate-[letter-in_520ms_var(--ease-out)_both] whitespace-pre"
          style={{ animationDelay: `${delay + i * LETTER_MS}ms` }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

function visitedBefore(): boolean {
  try {
    return localStorage.getItem(VISITED_KEY) !== null;
  } catch {
    // Without storage everyone is greeted as new.
    return false;
  }
}

/**
 * A few words written into the night as the entrance completes: tonight's real
 * sky, and — for someone returning — the lanterns they left on the water.
 * Mounted only once the full entrance has finished, so it never renders on the server.
 */
export function IntroGreeting() {
  const t = useDictionary();
  const locale = usePreferences((s) => s.locale);
  const sky = useSky();
  const lanterns = useWishes((s) => s.wishes.length);
  const [returning] = useState(visitedBefore);
  const [stage, setStage] = useState<"shown" | "fading" | "gone">("shown");

  useEffect(() => {
    try {
      localStorage.setItem(VISITED_KEY, "1");
    } catch {
      // Nothing to remember without storage.
    }
  }, []);

  useEffect(() => {
    if (stage === "shown") {
      const id = window.setTimeout(() => setStage("fading"), SHOW_MS);
      return () => window.clearTimeout(id);
    }
    if (stage === "fading") {
      const id = window.setTimeout(() => setStage("gone"), 1300);
      return () => window.clearTimeout(id);
    }
  }, [stage]);

  if (stage === "gone") return null;

  const title = returning ? t.intro.welcomeBack : t.intro.welcome;
  const lines = [title];
  if (sky) {
    const lunar = `${sky.lunar.monthName}${sky.lunar.dayName}`;
    const term = format(t.sky.termDay, { term: sky.solarTerm.name, n: sky.solarTerm.dayIndex });
    lines.push(format(t.intro.tonight, { phase: MOON_PHASE_NAMES[sky.moon.phase][locale], lunar, term }));
  }
  if (returning && lanterns > 0) {
    lines.push(lanterns === 1 ? t.intro.lanternsOne : format(t.intro.lanternsMany, { n: lanterns }));
  }

  let delay = 0;
  return (
    <div
      role="status"
      data-testid="intro-greeting"
      data-fading={stage === "fading"}
      className="pointer-events-none absolute inset-x-0 top-[24%] z-30 flex flex-col items-center gap-2 px-6 text-center transition-opacity duration-[1200ms] ease-in data-[fading=true]:opacity-0 [text-shadow:var(--text-halo)]"
    >
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, i) => {
        const d = delay;
        delay += line.length * LETTER_MS + 280;
        return (
          <Typed
            key={i}
            text={line}
            delay={d}
            className={
              i === 0
                ? "font-serif text-3xl font-medium tracking-wide text-text md:text-4xl"
                : "text-sm tracking-wide text-text-muted md:text-base"
            }
          />
        );
      })}
    </div>
  );
}
