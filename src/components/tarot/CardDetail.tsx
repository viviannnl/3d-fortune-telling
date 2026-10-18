"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { getCard } from "@/features/tarot/cards";
import type { CardSelection } from "@/features/tarot/types";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { CARD_ASPECT } from "./cardTextures";

interface CardDetailProps {
  selection: CardSelection;
  category: "love" | "career" | "self";
  onClose: () => void;
}

/** A large, readable look at one drawn card: its artwork, meaning, and keywords. */
export function CardDetail({ selection, category, onClose }: CardDetailProps) {
  const t = useDictionary().tarot;
  const locale = usePreferences((s) => s.locale);
  const dialog = useRef<HTMLDialogElement>(null);
  const card = getCard(selection.cardId);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  if (!card) return null;
  const reversed = selection.orientation === "reversed";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-labelledby="card-detail-title"
      data-testid="card-detail"
      data-card-id={card.id}
      className="m-auto max-h-[94dvh] w-[min(46rem,94vw)] overflow-y-auto rounded-md border border-border-subtle bg-surface p-0 text-text shadow-md backdrop:bg-midnight/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            {t.positions[selection.position]} · {t.orientation[selection.orientation]}
          </p>
          <h3 id="card-detail-title" className="mt-1 font-serif text-3xl text-text">
            {card.name[locale]}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={t.detail.close}
          className="-mt-1 -mr-2 flex size-9 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[14rem_1fr]">
        <div>
          <div
            className="relative overflow-hidden rounded-sm border border-champagne/40 shadow-md"
            style={{ aspectRatio: `${CARD_ASPECT}` }}
          >
            <Image
              src={card.asset}
              alt={card.name[locale]}
              fill
              sizes="(max-width: 640px) 60vw, 14rem"
              className="object-cover"
              style={reversed ? { transform: "rotate(180deg)" } : undefined}
            />
          </div>
          {reversed && <p className="mt-2 text-center text-xs text-text-muted">{t.detail.reversed}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-xs tracking-[0.16em] text-accent uppercase">{t.detail.meaning}</h4>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-text">{card[selection.orientation][locale]}</p>
          </div>
          <div>
            <h4 className="text-xs tracking-[0.16em] text-accent uppercase">{t.detail.keywords}</h4>
            <p className="mt-1.5 flex flex-wrap gap-2">
              {card.keywords[selection.orientation].map((k) => (
                <span key={k.en} className="rounded-pill border border-border-subtle px-3 py-1 text-xs text-text">
                  {k[locale]}
                </span>
              ))}
            </p>
          </div>
          <div>
            <h4 className="text-xs tracking-[0.16em] text-accent uppercase">{t.detail.focus}</h4>
            <p className="mt-1.5 border-l border-border pl-3 text-sm leading-relaxed text-text-muted italic">
              {card.focus[category][locale]}
            </p>
          </div>
          <p className="text-xs text-text-muted">{t.panel.curatedNote}</p>
        </div>
      </div>
    </dialog>
  );
}
