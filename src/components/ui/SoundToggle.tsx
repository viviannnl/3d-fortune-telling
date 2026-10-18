"use client";

import { useEffect, useId, useRef } from "react";
import { ChevronDown, Volume2, VolumeX } from "lucide-react";
import { setAudioEnabled } from "@/lib/audio/engine";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";

function VolumeSlider({ kind, label }: { kind: "music" | "effects"; label: string }) {
  const id = useId();
  const value = usePreferences((s) => (kind === "music" ? s.musicVolume : s.effectsVolume));
  const setVolume = usePreferences((s) => s.setVolume);
  const percent = Math.round(value * 100);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <label htmlFor={id} className="font-medium text-text">
          {label}
        </label>
        <span aria-hidden className="tabular-nums text-text-muted">
          {percent}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        aria-valuetext={`${percent}%`}
        data-testid={`volume-${kind}`}
        onChange={(e) => setVolume(kind, Number(e.target.value) / 100)}
        className="h-5 w-full cursor-pointer accent-lavender disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function SoundToggle() {
  const t = useDictionary();
  const on = usePreferences((s) => s.soundEnabled);
  const setOn = usePreferences((s) => s.setSoundEnabled);
  const panelId = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !on;
    setAudioEnabled(next); // inside the click gesture so the AudioContext may start
    setOn(next);
  };

  // Place the popover under its button each time it opens.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open" || !anchor.current) return;
      const r = anchor.current.getBoundingClientRect();
      el.style.top = `${r.bottom + 8}px`;
      el.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
    };
    el.addEventListener("beforetoggle", place);
    return () => el.removeEventListener("beforetoggle", place);
  }, [on]);

  return (
    <div className="control-surface flex h-9 items-center rounded-pill">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        title={on ? t.sound.on : t.sound.off}
        className="flex h-full cursor-pointer items-center gap-2 rounded-pill px-3 text-xs font-medium text-text-muted transition-[color,transform] duration-150 ease-out hover:text-text active:scale-[0.97] aria-pressed:text-text"
      >
        {on ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}
        <span className="max-sm:sr-only">{t.sound.label}</span>
      </button>
      {on && (
        <>
          <button
            ref={anchor}
            type="button"
            popoverTarget={panelId}
            aria-label={t.sound.settings}
            title={t.sound.settings}
            data-testid="sound-settings"
            className="-ml-1 flex h-full cursor-pointer items-center rounded-pill pr-2.5 pl-1 text-text-muted transition-[color,transform] duration-150 ease-out hover:text-text active:scale-[0.97]"
          >
            <ChevronDown aria-hidden className="size-3.5" />
          </button>
          <div
            ref={panel}
            id={panelId}
            popover="auto"
            aria-label={t.sound.settings}
            className="control-surface fixed inset-auto m-0 w-64 rounded-md p-4 text-text"
          >
            <div className="grid gap-4">
              <VolumeSlider kind="music" label={t.sound.music} />
              <VolumeSlider kind="effects" label={t.sound.effects} />
              <p className="text-xs leading-relaxed text-text-muted">{t.sound.follows}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
