"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setAudioEnabled } from "@/lib/audio/engine";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";

export function SoundToggle() {
  const t = useDictionary();
  const on = usePreferences((s) => s.soundEnabled);
  const setOn = usePreferences((s) => s.setSoundEnabled);

  const toggle = () => {
    const next = !on;
    setAudioEnabled(next); // inside the click gesture so the AudioContext may start
    setOn(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? t.sound.on : t.sound.off}
      className="control-surface flex h-9 cursor-pointer items-center gap-2 rounded-pill px-3 text-xs font-medium text-text-muted transition-[color,transform] duration-150 ease-out hover:text-text active:scale-[0.97] aria-pressed:text-text"
    >
      {on ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}
      <span className="max-sm:sr-only">{t.sound.label}</span>
    </button>
  );
}
