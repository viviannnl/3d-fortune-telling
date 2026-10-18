"use client";

import { isModalOpen } from "@/lib/modal";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { InterpretationSection } from "@/components/ui/InterpretationView";
import { DESTINY_TOPICS, type DestinyTopic } from "@/features/interpretation/schema";
import { PILLAR_KEYS } from "@/features/destiny/types";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useDestiny } from "@/stores/destiny";
import { useInterpretations } from "@/stores/interpretations";

/** Side panel holding the AI reflection on the calculated chart. */
export function DestinyReadingPanel() {
  const t = useDictionary();
  const locale = usePreferences((s) => s.locale);
  const chart = useDestiny((s) => s.chart);
  const input = useDestiny((s) => s.input);
  const chartSeq = useDestiny((s) => s.chartSeq);
  const setReadingOpen = useDestiny((s) => s.setReadingOpen);
  const [topic, setTopic] = useState<DestinyTopic>("overview");
  const heading = useRef<HTMLHeadingElement>(null);
  // Keyed by the exact calculation, topic, and language.
  const aiKey = `destiny:${chartSeq}:${topic}:${locale}`;
  const entry = useInterpretations((s) => s.entries[aiKey]);

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isModalOpen()) return;
      e.preventDefault();
      setReadingOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [setReadingOpen]);

  if (!chart || !input) return null;
  const p = chart.pillars;
  const subject = [p.year.name, p.month.name, p.day.name, p.hour?.name ?? ""];
  const itemTitles = Object.fromEntries(
    PILLAR_KEYS.map((k) => [k, `${t.destiny.chart.pillars[k]} · ${chart.pillars[k]?.name ?? ""}`]),
  );

  const generate = () =>
    void useInterpretations
      .getState()
      .request(aiKey, "/api/interpret/destiny", { locale, topic, birth: input }, subject);

  return (
    <aside
      aria-labelledby="destiny-reading-title"
      className="pointer-events-auto absolute inset-x-3 top-24 bottom-3 flex animate-rise-in flex-col overflow-hidden rounded-md border border-border-subtle bg-surface/90 shadow-md backdrop-blur-md md:inset-x-auto md:top-6 md:right-6 md:bottom-6 md:w-[min(30rem,40vw)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 pt-5 pb-4">
        <h3
          id="destiny-reading-title"
          ref={heading}
          tabIndex={-1}
          className="font-serif text-3xl text-text outline-none"
        >
          {t.ai.heading}
        </h3>
        <button
          type="button"
          onClick={() => setReadingOpen(false)}
          aria-label={t.ai.close}
          className="-mr-2 flex size-9 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <InterpretationSection
          entry={entry}
          intro={t.ai.introDestiny}
          onGenerate={generate}
          itemTitles={itemTitles}
          controls={
            <label className="flex flex-col gap-1.5 text-sm text-text">
              {t.ai.topic}
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as DestinyTopic)}
                className="h-10 w-full max-w-xs rounded-sm border border-border bg-surface/70 px-3 text-sm text-text [color-scheme:dark]"
              >
                {DESTINY_TOPICS.map((x) => (
                  <option key={x} value={x}>
                    {t.ai.topics[x]}
                  </option>
                ))}
              </select>
            </label>
          }
        />
      </div>
    </aside>
  );
}
