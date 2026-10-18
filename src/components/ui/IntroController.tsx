"use client";

import { useEffect } from "react";
import { INTRO_SEEN_KEY } from "@/lib/introKey";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { introRemainingMs, useIntro } from "@/stores/intro";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Runs the entrance's clock: resumes straight into a short descent on later
 * loads this session, ends the descent on time, and lets any click or key
 * hurry it along.
 */
export function IntroController() {
  const t = useDictionary();
  const phase = useIntro((s) => s.phase);
  const full = useIntro((s) => s.full);
  const skip = useIntro((s) => s.skip);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_SEEN_KEY) === "seen";
    } catch {
      // No storage: treat as a first visit.
    }
    if (seen) useIntro.getState().resume(window.matchMedia(REDUCED).matches);
  }, []);

  // Re-armed when a skip shortens the remaining time.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setTimeout(() => useIntro.getState().finish(), introRemainingMs() + 30);
    return () => window.clearTimeout(id);
  }, [phase, skip]);

  useEffect(() => {
    if (phase !== "playing" || !full) return;
    const hurry = () => useIntro.getState().skipToEnd();
    window.addEventListener("pointerdown", hurry);
    window.addEventListener("keydown", hurry);
    return () => {
      window.removeEventListener("pointerdown", hurry);
      window.removeEventListener("keydown", hurry);
    };
  }, [phase, full]);

  if (phase !== "playing" || !full || skip) return null;
  return (
    <p
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-8 z-30 text-center text-xs tracking-wide text-text-muted/80 animate-[fade-in_400ms_var(--ease-out)_1.5s_both] [text-shadow:var(--text-halo)]"
    >
      {t.intro.skip}
    </p>
  );
}
