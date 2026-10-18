"use client";

import { isModalOpen } from "@/lib/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageDown, X } from "lucide-react";
import { ShareDialog } from "@/components/share/ShareDialog";
import { Button } from "@/components/ui/Button";
import { tarotShareContent } from "@/features/share/content";
import type { CardSelection } from "@/features/tarot/types";
import { CardDetail } from "./CardDetail";
import { getCard } from "@/features/tarot/cards";
import { selectionsOf } from "@/features/tarot/reading";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useTarot } from "@/stores/tarot";
import { useInterpretations } from "@/stores/interpretations";
import { InterpretationSection } from "@/components/ui/InterpretationView";

/** Readable HTML interpretation of the exact spread on the table. */
export function TarotReadingPanel() {
  const t = useDictionary().tarot;
  const locale = usePreferences((s) => s.locale);
  const reading = useTarot((s) => s.reading);
  const setPanelOpen = useTarot((s) => s.setPanelOpen);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isModalOpen()) return;
      e.preventDefault(); // close the panel first; don't leave the garden
      setPanelOpen(false);
    };
    // Capture phase: runs before the destination's own Escape-to-leave handler.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [setPanelOpen]);

  const selections = selectionsOf(reading);
  const { ai: aiText, share: shareText } = useDictionary();
  const subject = selections.map((s) => `${s.position}:${s.cardId}:${s.orientation}`);
  // Keyed by the exact spread and language: a new reading or language never reuses an old reflection.
  const aiKey = `tarot:${reading.readingId}:${locale}:${subject.join("|")}`;
  const entry = useInterpretations((s) => s.entries[aiKey]);
  const generate = () => {
    if (!reading.category) return;
    void useInterpretations
      .getState()
      .request(aiKey, "/api/interpret/tarot", { locale, category: reading.category, selections }, subject);
  };
  const [sharing, setSharing] = useState(false);
  const [detail, setDetail] = useState<CardSelection | null>(null);
  const aiSummary = entry?.status === "success" ? entry.interpretation.shareableSummary : null;
  const category = reading.category;
  const buildShare = useCallback(
    (includeDate: boolean) =>
      tarotShareContent(category ?? "self", selectionsOf(useTarot.getState().reading), {
        locale,
        includeDate,
        today: new Date(),
        aiSummary,
      }),
    [category, locale, aiSummary],
  );
  const itemTitles = Object.fromEntries(
    selections.map((sel) => [sel.cardId, `${t.positions[sel.position]} · ${getCard(sel.cardId)?.name[locale] ?? ""}`]),
  );

  return (
    <aside
      aria-labelledby="tarot-reading-title"
      className="pointer-events-auto absolute inset-x-3 top-24 bottom-3 flex animate-rise-in flex-col overflow-hidden rounded-md border border-border-subtle bg-surface/90 shadow-md backdrop-blur-md md:inset-x-auto md:top-6 md:right-6 md:bottom-6 md:w-[min(30rem,42vw)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 pt-5 pb-4">
        <div>
          {reading.category && (
            <p className="text-xs tracking-[0.18em] text-text-muted uppercase">
              {t.panel.categoryLabel} · {t.choose.categories[reading.category].name}
            </p>
          )}
          <h3
            id="tarot-reading-title"
            ref={heading}
            tabIndex={-1}
            className="mt-1 font-serif text-3xl text-text outline-none"
          >
            {t.panel.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(false)}
          aria-label={t.panel.close}
          className="-mr-2 flex size-9 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <ol className="flex flex-col gap-7">
          {selections.map((sel) => {
            const card = getCard(sel.cardId);
            return (
              <li
                key={sel.position}
                data-card-id={sel.cardId}
                data-orientation={sel.orientation}
                data-position={sel.position}
              >
                <p className="text-xs tracking-[0.18em] text-accent uppercase">
                  {t.positions[sel.position]} · {t.orientation[sel.orientation]}
                </p>
                <h4 className="mt-1 font-serif text-2xl text-text">{card ? card.name[locale] : t.unknownCard}</h4>
                {card && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDetail(sel)}
                      data-testid="card-detail-open"
                      className="mt-1 cursor-pointer rounded-sm text-xs text-accent underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-moonlight"
                    >
                      {t.detail.open}
                    </button>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-text">{card[sel.orientation][locale]}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      <span className="sr-only">{t.panel.keywords}: </span>
                      {card.keywords[sel.orientation].map((k) => k[locale]).join(" · ")}
                    </p>
                    {reading.category && (
                      <p className="mt-3 border-l border-border pl-3 text-sm leading-relaxed text-text-muted italic">
                        {card.focus[reading.category][locale]}
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-8 mb-6 text-xs text-text-muted">{t.panel.curatedNote}</p>
        <InterpretationSection entry={entry} intro={aiText.intro} onGenerate={generate} itemTitles={itemTitles} />
        <div className="mt-8 border-t border-border-subtle pt-5">
          <Button variant="secondary" onClick={() => setSharing(true)}>
            <ImageDown aria-hidden className="size-4" />
            {shareText.open}
          </Button>
        </div>
        {detail && category && <CardDetail selection={detail} category={category} onClose={() => setDetail(null)} />}
        {sharing && (
          <ShareDialog
            build={buildShare}
            defaultIncludeDate
            privacyNote={shareText.privacyTarot}
            fileName="moonlit-tarot-reading.png"
            onClose={() => setSharing(false)}
          />
        )}
      </div>
    </aside>
  );
}
