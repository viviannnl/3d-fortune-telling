"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import type { Interpretation } from "@/features/interpretation/schema";
import { useDictionary } from "@/lib/i18n/useDictionary";
import type { InterpretationEntry } from "@/stores/interpretations";
import { Button } from "./Button";

/** Quiet orbiting loader: one moon circling, honouring reduced motion via the global CSS rule. */
function CelestialLoader({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <span aria-hidden className="relative size-6">
          <span className="absolute inset-1.5 rounded-full border border-border" />
          <span className="absolute inset-0 animate-orbit">
            <span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-lavender" />
          </span>
        </span>
        {label}
      </div>
      {/* Skeleton shaped like the reading */}
      <div aria-hidden className="flex animate-shimmer flex-col gap-2">
        <span className="h-3 w-11/12 rounded-sm bg-surface-raised" />
        <span className="h-3 w-4/5 rounded-sm bg-surface-raised" />
        <span className="h-3 w-3/5 rounded-sm bg-surface-raised" />
        <span className="mt-3 h-4 w-2/5 rounded-sm bg-surface-raised" />
        <span className="h-3 w-10/12 rounded-sm bg-surface-raised" />
        <span className="h-3 w-9/12 rounded-sm bg-surface-raised" />
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5 className="text-xs tracking-[0.16em] text-accent uppercase">{title}</h5>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-text">
        {items.map((x) => (
          <li key={x} className="border-l border-border pl-3">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InterpretationBody({
  interpretation,
  itemTitles,
}: {
  interpretation: Interpretation;
  itemTitles: Record<string, string>;
}) {
  const t = useDictionary().ai;
  return (
    <article className="flex animate-rise-in flex-col gap-6" data-testid="interpretation">
      <p className="font-serif text-lg leading-relaxed text-text">{interpretation.overview}</p>
      <ol className="flex flex-col gap-5">
        {interpretation.items.map((item) => (
          <li key={item.key} data-key={item.key}>
            <p className="text-xs tracking-[0.16em] text-text-muted uppercase">{itemTitles[item.key] ?? item.key}</p>
            <h5 className="mt-1 font-serif text-xl text-text">{item.title}</h5>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-text">{item.interpretation}</p>
          </li>
        ))}
      </ol>
      <div>
        <h5 className="text-xs tracking-[0.16em] text-accent uppercase">{t.themes}</h5>
        <p className="mt-2 flex flex-wrap gap-2">
          {interpretation.themes.map((th) => (
            <span key={th} className="rounded-pill border border-border-subtle px-3 py-1 text-xs text-text">
              {th}
            </span>
          ))}
        </p>
      </div>
      <List title={t.questions} items={interpretation.reflectionQuestions} />
      <List title={t.suggestions} items={interpretation.suggestions} />
      <div>
        <h5 className="text-xs tracking-[0.16em] text-accent uppercase">{t.summary}</h5>
        <p className="mt-2 font-serif text-lg text-text italic">{interpretation.shareableSummary}</p>
      </div>
      <p className="text-xs text-text-muted">{t.disclaimer}</p>
    </article>
  );
}

interface InterpretationSectionProps {
  entry: InterpretationEntry | undefined;
  intro: string;
  onGenerate: () => void;
  itemTitles: Record<string, string>;
  /** Extra controls shown before generating (e.g. a topic selector). */
  controls?: React.ReactNode;
}

/** Idle → loading → success | error (with retry). The curated reading never depends on this. */
export function InterpretationSection({ entry, intro, onGenerate, itemTitles, controls }: InterpretationSectionProps) {
  const t = useDictionary().ai;
  return (
    <section
      aria-labelledby="ai-heading"
      className="flex flex-col gap-4 border-t border-border-subtle pt-6"
      data-ai-status={entry?.status ?? "idle"}
    >
      <h4 id="ai-heading" className="flex items-center gap-2 font-serif text-2xl text-text">
        <Sparkles aria-hidden className="size-4 text-accent" />
        {t.heading}
      </h4>

      {!entry && (
        <>
          <p className="text-sm leading-relaxed text-text-muted">{intro}</p>
          {controls}
          <Button variant="primary" className="self-start" onClick={onGenerate}>
            {t.generate}
          </Button>
        </>
      )}

      {entry?.status === "loading" && <CelestialLoader label={t.generating} />}

      {entry?.status === "error" && (
        <div role="alert" className="flex flex-col gap-3 rounded-sm border border-danger-border px-4 py-3">
          <p className="text-sm leading-relaxed text-danger">{t.errors[entry.error]}</p>
          {entry.error !== "not_configured" && entry.error !== "invalid_request" && (
            <Button variant="secondary" className="self-start" onClick={onGenerate}>
              <RotateCcw aria-hidden className="size-4" />
              {t.retry}
            </Button>
          )}
        </div>
      )}

      {entry?.status === "success" && (
        <InterpretationBody interpretation={entry.interpretation} itemTitles={itemTitles} />
      )}
    </section>
  );
}
