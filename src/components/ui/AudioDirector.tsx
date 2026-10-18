"use client";

import { useEffect } from "react";
import { renderMusicOffline, setMusicScene, setVolumes } from "@/lib/audio/engine";
import { useSky } from "@/components/world/useSky";
import { useExperience } from "@/stores/experience";
import { usePreferences } from "@/stores/preferences";

/**
 * Tells the music where the visitor is: the real sky (season, time of day,
 * moon), which destination they are in, and whether a reading is open.
 * Renders nothing; the engine stays silent until sound is switched on.
 */
export function AudioDirector() {
  const sky = useSky();
  const view = useExperience((s) => s.view);
  const dim = useExperience((s) => s.dim);
  const musicVolume = usePreferences((s) => s.musicVolume);
  const effectsVolume = usePreferences((s) => s.effectsVolume);

  useEffect(() => {
    if (sky) setMusicScene({ season: sky.season, mood: sky.mood, moon: sky.moon.illumination });
  }, [sky]);

  useEffect(() => {
    setMusicScene({ place: view, dim });
  }, [view, dim]);

  useEffect(() => {
    setVolumes({ music: musicVolume, effects: effectsVolume });
  }, [musicVolume, effectsVolume]);

  // Development only: lets the music review script render and measure the score.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as unknown as { __renderMusic?: typeof renderMusicOffline };
    w.__renderMusic = renderMusicOffline;
    return () => {
      delete w.__renderMusic;
    };
  }, []);

  return null;
}
