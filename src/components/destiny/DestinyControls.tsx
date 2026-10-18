"use client";

import { useEffect } from "react";
import { useExperience } from "@/stores/experience";
import { useDestiny } from "@/stores/destiny";
import { DestinyChartPanel } from "./DestinyChartPanel";
import { DestinyForm } from "./DestinyForm";
import { DestinyReadingPanel } from "./DestinyReadingPanel";

/** HTML side of the Destiny Palace: the birth form, then the chart and its explanations. */
export function DestinyControls() {
  const editing = useDestiny((s) => s.editing);
  const hasChart = useDestiny((s) => s.chart !== null);
  const readingOpen = useDestiny((s) => s.readingOpen);

  // Quiet the world while a reflection is open.
  useEffect(() => {
    useExperience.getState().setDim(readingOpen ? 0.85 : 0);
  }, [readingOpen]);
  useEffect(
    () => () => {
      useExperience.getState().setDim(0);
      useDestiny.getState().setReadingOpen(false);
    },
    [],
  );

  // Keep the armillary sphere clear of the panel on wide screens.
  useEffect(() => {
    useExperience.getState().setCameraShift(-1.5);
    return () => useExperience.getState().setCameraShift(0);
  }, []);

  return (
    <>
      <div
        data-testid="destiny-controls"
        data-state={editing || !hasChart ? "form" : "chart"}
        className="pointer-events-auto mt-4 min-h-0 w-full max-w-md flex-1 animate-rise-in overflow-y-auto overscroll-contain rounded-md control-surface p-5 [animation-delay:600ms] md:max-h-[calc(100dvh-11rem)] md:flex-initial"
      >
        {editing || !hasChart ? <DestinyForm /> : <DestinyChartPanel />}
      </div>
      {readingOpen && hasChart && !editing && <DestinyReadingPanel />}
    </>
  );
}
