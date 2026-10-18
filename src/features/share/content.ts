import type { ChartResult } from "@/features/destiny/types";
import { ELEMENTS, type ElementId } from "@/features/destiny/symbols";
import { getCard } from "@/features/tarot/cards";
import type { CardSelection, Category } from "@/features/tarot/types";
import type { Locale } from "@/lib/i18n/dictionaries";
import { DICTIONARIES } from "@/lib/i18n/dictionaries";

export interface ShareCardTarot {
  kind: "tarot";
  title: string;
  subtitle: string;
  cards: { position: string; name: string; orientation: string; reversed: boolean; asset: string; numeral: number }[];
  summary: string;
  dateLabel: string | null;
}

export interface ShareCardDestiny {
  kind: "destiny";
  title: string;
  subtitle: string;
  pillars: { label: string; stem: string; branch: string; stemElement: ElementId; branchElement: ElementId }[];
  dayMaster: string;
  elements: { id: ElementId; label: string; count: number }[];
  summary: string;
  dateLabel: string | null;
}

export type ShareCardContent = ShareCardTarot | ShareCardDestiny;

export interface ShareOptions {
  locale: Locale;
  /** Reading date (today), never the birth date. Off by default for destiny cards. */
  includeDate: boolean;
  today: Date;
  /** AI one-line summary when available; otherwise a curated fallback is used. */
  aiSummary?: string | null;
}

function dateLabel(opts: ShareOptions): string | null {
  if (!opts.includeDate) return null;
  return new Intl.DateTimeFormat(opts.locale === "zh" ? "zh-Hans" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(opts.today);
}

export function tarotShareContent(category: Category, selections: CardSelection[], opts: ShareOptions): ShareCardTarot {
  const t = DICTIONARIES[opts.locale];
  const cards = selections.map((s) => {
    const card = getCard(s.cardId);
    return {
      position: t.tarot.positions[s.position],
      name: card?.name[opts.locale] ?? t.tarot.unknownCard,
      orientation: t.tarot.orientation[s.orientation],
      reversed: s.orientation === "reversed",
      asset: card?.asset ?? "",
      numeral: card?.number ?? 0,
    };
  });
  const keywords = selections
    .map((s) => getCard(s.cardId)?.keywords[s.orientation][0]?.[opts.locale])
    .filter(Boolean)
    .join(" · ");
  return {
    kind: "tarot",
    title: t.share.tarotTitle,
    subtitle: `${t.tarot.choose.categories[category].name} · ${t.tarot.deckLabel}`,
    cards,
    summary: opts.aiSummary?.trim() || keywords,
    dateLabel: dateLabel(opts),
  };
}

/** Only the calculated symbols — never the birth date, time, place, or normalized timestamps. */
export function destinyShareContent(chart: ChartResult, opts: ShareOptions): ShareCardDestiny {
  const t = DICTIONARIES[opts.locale];
  const keys = ["year", "month", "day", "hour"] as const;
  const pillars = keys.flatMap((k) => {
    const p = chart.pillars[k];
    return p
      ? [
          {
            label: t.destiny.chart.pillars[k],
            stem: p.stem,
            branch: p.branch,
            stemElement: p.stemElement,
            branchElement: p.branchElement,
          },
        ]
      : [];
  });
  return {
    kind: "destiny",
    title: t.share.destinyTitle,
    subtitle: t.share.destinySubtitle,
    pillars,
    dayMaster: `${t.destiny.chart.dayMaster} ${chart.dayMaster.stem} · ${t.destiny.chart.polarity[chart.dayMaster.polarity]} ${t.destiny.elementNames[chart.dayMaster.element]}`,
    elements: ELEMENTS.map((id) => ({ id, label: t.destiny.elementNames[id], count: chart.elementCounts[id] })),
    summary: opts.aiSummary?.trim() || t.share.destinyFallback,
    dateLabel: dateLabel(opts),
  };
}
