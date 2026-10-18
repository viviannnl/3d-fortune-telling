"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ImageDown, Pencil, Sparkles } from "lucide-react";
import { ShareDialog } from "@/components/share/ShareDialog";
import { destinyShareContent } from "@/features/share/content";
import { useInterpretations } from "@/stores/interpretations";
import { Button } from "@/components/ui/Button";
import { ELEMENT_COUNT_NOTE } from "@/features/destiny/reference";
import { ELEMENTS, stemByChar, branchByChar } from "@/features/destiny/symbols";
import { PILLAR_KEYS, type Pillar } from "@/features/destiny/types";
import { format } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useDestiny } from "@/stores/destiny";
import { OrnamentDivider } from "@/components/ui/icons";
import { DestinyDetail } from "./DestinyDetail";
import { ELEMENT_COLOR } from "./elementStyle";

function PillarColumn({
  pillar,
  label,
  selected,
  onSelect,
}: {
  pillar: Pillar;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useDictionary().destiny;
  const stem = stemByChar(pillar.stem);
  const branch = branchByChar(pillar.branch);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-pillar={pillar.key}
      data-name={pillar.name}
      data-day={pillar.key === "day"}
      className="group flex cursor-pointer flex-col items-center rounded-sm border border-border-subtle px-1 py-2.5 text-center data-[day=true]:border-champagne/45 data-[day=true]:bg-deep-violet/40 transition-[background-color,border-color,transform] duration-150 ease-out hover:border-border hover:bg-surface-raised/50 active:scale-[0.98] aria-pressed:border-accent aria-pressed:bg-surface-raised/70"
    >
      <span className="text-[0.7rem] tracking-[0.14em] text-text-muted uppercase">{label}</span>
      <span className="mt-1 text-[0.7rem] text-text-muted group-data-[day=true]:text-champagne">
        {pillar.tenGod ?? t.chart.self}
      </span>
      <span
        lang="zh-Hans"
        className="mt-1 font-serif text-3xl leading-none"
        style={{ color: stem ? ELEMENT_COLOR[stem.element] : undefined }}
      >
        {pillar.stem}
      </span>
      <span
        lang="zh-Hans"
        className="mt-1 font-serif text-3xl leading-none"
        style={{ color: branch ? ELEMENT_COLOR[branch.element] : undefined }}
      >
        {pillar.branch}
      </span>
      <span lang="zh-Hans" className="mt-2 text-[0.7rem] text-text-muted">
        {pillar.hiddenStems.map((h) => h.stem).join(" ")}
      </span>
    </button>
  );
}

export function DestinyChartPanel() {
  const t = useDictionary().destiny;
  const locale = usePreferences((s) => s.locale);
  const chart = useDestiny((s) => s.chart);
  const selection = useDestiny((s) => s.selection);
  const readingOpen = useDestiny((s) => s.readingOpen);
  const { select, edit, setReadingOpen } = useDestiny.getState();
  const { ai, share } = useDictionary();
  const chartSeq = useDestiny((s) => s.chartSeq);
  const [sharing, setSharing] = useState(false);
  // Use any successful reflection for this exact calculation and language as the card's summary line.
  const aiSummary = useInterpretations((s) => {
    for (const [key, e] of Object.entries(s.entries)) {
      if (key.startsWith(`destiny:${chartSeq}:`) && key.endsWith(`:${locale}`) && e.status === "success")
        return e.interpretation.shareableSummary;
    }
    return null;
  });
  const buildShare = useCallback(
    (includeDate: boolean) => {
      const c = useDestiny.getState().chart;
      if (!c) throw new Error("no chart");
      return destinyShareContent(c, { locale, includeDate, today: new Date(), aiSummary });
    },
    [locale, aiSummary],
  );
  if (!chart) return null;

  const max = Math.max(1, ...Object.values(chart.elementCounts));

  return (
    <div className="flex flex-col gap-4" data-testid="destiny-chart" data-day-master={chart.dayMaster.stem}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl text-text">{t.chart.title}</h3>
        <Button variant="ghost" className="-mr-2 h-8 px-3 text-xs" onClick={edit}>
          <Pencil aria-hidden className="size-3.5" />
          {t.chart.edit}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PILLAR_KEYS.map((key) => {
          const pillar = chart.pillars[key];
          if (!pillar) {
            return (
              <div
                key={key}
                data-pillar={key}
                data-name=""
                className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-subtle px-1 py-2.5 text-center"
              >
                <span className="text-[0.7rem] tracking-[0.14em] text-text-muted uppercase">
                  {t.chart.pillars[key]}
                </span>
                <span className="mt-6 mb-6 text-xs text-text-muted">{t.chart.hourUnknown}</span>
              </div>
            );
          }
          const selected = selection?.kind === "pillar" && selection.id === key;
          return (
            <PillarColumn
              key={key}
              pillar={pillar}
              label={t.chart.pillars[key]}
              selected={selected}
              onSelect={() => select(selected ? null : { kind: "pillar", id: key })}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => select(selection?.kind === "dayMaster" ? null : { kind: "dayMaster" })}
        aria-pressed={selection?.kind === "dayMaster"}
        className="flex cursor-pointer items-center justify-between rounded-sm border border-border-subtle px-3 py-2 text-left text-sm transition-colors duration-150 hover:border-border aria-pressed:border-accent"
      >
        <span className="text-text-muted">{t.chart.dayMaster}</span>
        <span className="text-text">
          <span lang="zh-Hans" className="font-serif text-lg" style={{ color: ELEMENT_COLOR[chart.dayMaster.element] }}>
            {chart.dayMaster.stem}
          </span>{" "}
          · {t.chart.polarity[chart.dayMaster.polarity]} {t.elementNames[chart.dayMaster.element]}
        </span>
      </button>

      <OrnamentDivider />
      <div>
        <div className="flex items-baseline justify-between">
          <h4 className="font-serif text-lg text-text">{t.chart.elements}</h4>
          <span className="text-xs text-text-muted">{format(t.chart.counted, { n: chart.countedCharacters })}</span>
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {ELEMENTS.map((el) => {
            const n = chart.elementCounts[el];
            const selected = selection?.kind === "element" && selection.id === el;
            return (
              <li key={el}>
                <button
                  type="button"
                  onClick={() => select(selected ? null : { kind: "element", id: el })}
                  aria-pressed={selected}
                  data-element={el}
                  data-count={n}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-2 py-1 text-left text-sm transition-colors duration-150 hover:bg-surface-raised/50 aria-pressed:bg-surface-raised/80"
                >
                  <span className="w-16 text-text">{t.elementNames[el]}</span>
                  <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-raised">
                    <span
                      className="block h-full rounded-pill"
                      style={{ width: `${(n / max) * 100}%`, background: ELEMENT_COLOR[el] }}
                    />
                  </span>
                  <span className="w-4 text-right tabular-nums text-text">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">{t.chart.sizeNote}</p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{ELEMENT_COUNT_NOTE[locale]}</p>
      </div>

      <div
        className="flex flex-col gap-1.5 border-t border-border-subtle pt-3 text-xs leading-relaxed text-text-muted"
        data-testid="destiny-notes"
      >
        {chart.ambiguities.map((a) => (
          <p key={a.key} className="text-text" data-ambiguity={a.key}>
            {format(t.chart.ambiguous, { pillar: t.chart.pillars[a.key], options: a.candidates.join(" / ") })}
          </p>
        ))}
        {!chart.timeKnown && <p>{t.chart.timeUnknownNote}</p>}
        {chart.timeKnown && chart.normalized.daylightSavingRemoved && (
          <p>{format(t.chart.dstNote, { time: chart.normalized.localStandard })}</p>
        )}
        {chart.timeKnown && !chart.normalized.daylightSavingRemoved && (
          <p>{format(t.chart.normalized, { time: chart.normalized.localStandard })}</p>
        )}
        {chart.trueSolar && (
          <p>
            {format(t.chart.trueSolar, {
              minutes: Math.abs(chart.trueSolar.offsetMinutes),
              direction: chart.trueSolar.offsetMinutes >= 0 ? t.chart.trueSolarAhead : t.chart.trueSolarBehind,
            })}{" "}
            {chart.trueSolar.hourPillarWouldDiffer && <span className="text-text">{t.chart.trueSolarDiffer}</span>}
          </p>
        )}
        <Link href="/about#bazi" className="self-start underline decoration-border underline-offset-4 hover:text-text">
          {t.chart.method}
        </Link>
      </div>

      {selection ? <DestinyDetail /> : <p className="text-xs text-text-muted">{t.chart.explore}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setReadingOpen(!readingOpen)} aria-expanded={readingOpen}>
          <Sparkles aria-hidden className="size-4" />
          {readingOpen ? ai.close : ai.open}
        </Button>
        <Button variant="secondary" onClick={() => setSharing(true)}>
          <ImageDown aria-hidden className="size-4" />
          {share.open}
        </Button>
      </div>
      {sharing && (
        <ShareDialog
          build={buildShare}
          defaultIncludeDate={false}
          privacyNote={share.privacy}
          fileName="moonlit-four-pillars.png"
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
