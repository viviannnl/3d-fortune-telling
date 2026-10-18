"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useCharms } from "@/stores/charms";

const W = 320;
const SHOW_MS = 6500;

/** The blessing revealed by a charm, floating up from where it was clicked. */
export function BlessingToast() {
  const t = useDictionary().charms;
  const locale = usePreferences((s) => s.locale);
  const blessing = useCharms((s) => s.blessing);
  const dismiss = useCharms((s) => s.dismiss);
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!blessing) return;
    const id = window.setTimeout(dismiss, blessing.final ? SHOW_MS * 1.6 : SHOW_MS);
    return () => window.clearTimeout(id);
  }, [blessing, dismiss]);

  if (!blessing) return null;
  // Keep the card on screen and above the click point.
  const left = Math.min(Math.max(blessing.x - W / 2, 16), viewport.w - W - 16);
  const top = Math.min(Math.max(blessing.y - 150, 84), viewport.h - 220);

  return (
    <div
      key={blessing.seq}
      role="status"
      aria-live="polite"
      data-testid="blessing"
      className="pointer-events-auto absolute z-20 animate-rise-in"
      style={{ left, top, width: W }}
    >
      <div
        data-final={blessing.final}
        className="relative overflow-hidden rounded-md border border-champagne/40 bg-midnight/80 px-5 pt-4 pb-5 shadow-md backdrop-blur-md data-[final=true]:border-champagne/80"
      >
        <span
          aria-hidden
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-champagne/80 to-transparent"
        />
        <div className="flex items-start gap-3">
          <Sparkles aria-hidden className="mt-1 size-4 shrink-0 text-champagne" />
          <p lang={locale === "zh" ? "zh-Hans" : "en"} className="flex-1 font-serif text-lg leading-snug text-text">
            {blessing.text[locale]}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t.close}
            className="-mt-1 -mr-2 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
