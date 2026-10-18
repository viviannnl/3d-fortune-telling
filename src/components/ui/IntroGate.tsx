"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { useSky } from "@/components/world/useSky";
import { setAudioEnabled } from "@/lib/audio/engine";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useIntro } from "@/stores/intro";
import { usePreferences } from "@/stores/preferences";
import { LanguageToggle } from "./LanguageToggle";
import { PhaseGlyph } from "./SkyLine";

/** How long the fly-through takes before the gate is removed. */
const LEAVE_MS = 1500;

/**
 * The moon gate (月洞门): the first thing a visitor sees. Walking through it
 * starts the descent into the sanctuary, and — because it is a real click —
 * may start the music too.
 */
export function IntroGate() {
  const t = useDictionary();
  const sky = useSky();
  const reducedMotion = useReducedMotion();
  const phase = useIntro((s) => s.phase);
  const full = useIntro((s) => s.full);
  const [gone, setGone] = useState(false);
  const leaving = phase !== "gate";

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setGone(true), reducedMotion ? 0 : LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [leaving, reducedMotion]);

  // A resumed session never shows the gate at all.
  if (gone || (leaving && !full)) return null;

  const enter = (withSound: boolean) => {
    if (withSound) {
      // Inside the click, so the browser lets the audio start.
      setAudioEnabled(true);
      usePreferences.getState().setSoundEnabled(true);
    }
    useIntro.getState().enter(reducedMotion);
  };

  return (
    <section
      aria-label={t.intro.gateLabel}
      data-testid="intro-gate"
      data-leaving={leaving}
      inert={leaving}
      className="intro-gate pointer-events-auto absolute inset-0 z-40 grid place-items-center transition-opacity duration-[1200ms] ease-in data-[leaving=true]:opacity-0"
      style={{
        background: "radial-gradient(circle at 50% 46%, rgb(23 21 47 / 0.25), rgb(23 21 47 / 0.88) 62%)",
      }}
    >
      <div className="absolute top-5 right-5 md:top-8 md:right-8">
        <LanguageToggle />
      </div>

      <div className="flex flex-col items-center gap-8 px-6">
        {/* The gate: a ring of moonlight that the camera passes through. */}
        <div
          data-leaving={leaving}
          className="relative grid aspect-square w-[min(58vmin,460px)] place-items-center rounded-full border border-lavender/45 transition-[transform,opacity] duration-[1400ms] ease-in animate-[gate-breathe_6s_ease-in-out_infinite] data-[leaving=true]:scale-[5] data-[leaving=true]:opacity-0"
          style={{
            boxShadow: "0 0 50px 2px rgb(188 166 245 / 0.2), inset 0 0 40px 2px rgb(188 166 245 / 0.12)",
          }}
        >
          <div aria-hidden className="absolute inset-[7%] rounded-full border border-lavender/15" />
          {/* The words fade at once, so only the ring of light flies past. */}
          <div
            data-leaving={leaving}
            className="flex flex-col items-center gap-4 text-center transition-opacity duration-[250ms] ease-in [text-shadow:var(--text-halo)] data-[leaving=true]:opacity-0"
          >
            <span className="text-champagne/90">
              {sky ? (
                <PhaseGlyph illumination={sky.moon.illumination} waxing={sky.moon.waxing} className="size-14" />
              ) : (
                <span className="block size-14" />
              )}
            </span>
            <h2 className="font-serif text-4xl font-medium tracking-wide text-text md:text-5xl">{t.brand.name}</h2>
            <p className="max-w-[18rem] text-sm leading-relaxed text-text-muted">{t.brand.tagline}</p>
          </div>
        </div>

        <div
          data-leaving={leaving}
          className="flex flex-col items-center gap-3 transition-opacity duration-[400ms] ease-in data-[leaving=true]:opacity-0"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              autoFocus
              data-testid="enter-with-sound"
              onClick={() => enter(true)}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-pill bg-lavender px-6 text-sm font-medium text-midnight shadow-[0_0_30px_rgb(188_166_245/0.35)] transition-[transform,background-color] duration-150 ease-out hover:bg-moonlight active:scale-[0.97]"
            >
              <Volume2 aria-hidden className="size-4" />
              {t.intro.enterWithSound}
            </button>
            <button
              type="button"
              data-testid="enter-quietly"
              onClick={() => enter(false)}
              className="control-surface h-11 cursor-pointer rounded-pill px-6 text-sm font-medium text-text transition-[transform,color] duration-150 ease-out hover:text-moonlight active:scale-[0.97]"
            >
              {t.intro.enterQuietly}
            </button>
          </div>
          <p className="text-xs text-text-muted">{t.intro.soundNote}</p>
        </div>
      </div>
    </section>
  );
}
