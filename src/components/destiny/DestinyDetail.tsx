"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  BRANCH_NOTES,
  DAY_MASTER_INTRO,
  ELEMENT_NOTES,
  HIDDEN_STEMS_NOTE,
  PILLAR_NOTES,
  STEM_NOTES,
  TEN_GOD_NOTES,
} from "@/features/destiny/reference";
import { branchByChar, stemByChar } from "@/features/destiny/symbols";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";
import { useDestiny } from "@/stores/destiny";

/** Curated explanation of the selected pillar, element, or the Day Master. */
export function DestinyDetail() {
  const t = useDictionary().destiny;
  const locale = usePreferences((s) => s.locale);
  const chart = useDestiny((s) => s.chart);
  const selection = useDestiny((s) => s.selection);
  const select = useDestiny((s) => s.select);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: false });
  }, [selection]);

  if (!chart || !selection) return null;

  let title = "";
  let body: React.ReactNode = null;

  if (selection.kind === "element") {
    const note = ELEMENT_NOTES[selection.id];
    title = `${note.name[locale]} · ${chart.elementCounts[selection.id]}`;
    body = (
      <>
        <p>{note.qualities[locale]}</p>
        <p className="mt-2 text-text-muted">
          {t.chart.generates} {t.elementNames[note.generates]} · {t.chart.controls} {t.elementNames[note.controls]}
        </p>
      </>
    );
  } else if (selection.kind === "dayMaster") {
    const stem = STEM_NOTES[chart.dayMaster.stem];
    title = `${t.chart.dayMaster} · ${chart.dayMaster.stem}`;
    body = (
      <>
        <p>{DAY_MASTER_INTRO[locale]}</p>
        {stem && (
          <p className="mt-2">
            <span className="text-text">{stem.image[locale]}.</span> {stem.note[locale]}
          </p>
        )}
      </>
    );
  } else {
    const pillar = chart.pillars[selection.id];
    const pillarNote = PILLAR_NOTES[selection.id];
    title = `${pillarNote.name[locale]}${pillar ? ` · ${pillar.name}` : ""}`;
    if (pillar) {
      const stem = stemByChar(pillar.stem);
      const branch = branchByChar(pillar.branch);
      const stemNote = STEM_NOTES[pillar.stem];
      const branchNote = BRANCH_NOTES[pillar.branch];
      const god = pillar.tenGod ? TEN_GOD_NOTES[pillar.tenGod] : null;
      body = (
        <>
          <p>{pillarNote.note[locale]}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
            <dt lang="zh-Hans" className="font-serif text-lg text-text">
              {pillar.stem}
            </dt>
            <dd>
              {stem && `${t.chart.polarity[stem.polarity]} ${t.elementNames[stem.element]} · ${stem.pinyin}. `}
              {stemNote?.note[locale]}
            </dd>
            <dt lang="zh-Hans" className="font-serif text-lg text-text">
              {pillar.branch}
            </dt>
            <dd>
              {branch && `${t.elementNames[branch.element]} · ${branch.animal[locale]} · ${branchNote?.hours ?? ""}. `}
              {branchNote?.note[locale]}
            </dd>
          </dl>
          {god && (
            <p className="mt-3">
              <span className="text-text">
                {t.chart.tenGod}: {pillar.tenGod} — {god.name[locale]}.
              </span>{" "}
              {god.relation[locale]}. {god.note[locale]}
            </p>
          )}
          <p className="mt-3">
            <span className="text-text">{t.chart.hidden}:</span>{" "}
            {pillar.hiddenStems.map((h) => `${h.stem} (${t.chart.roles[h.role]}, ${h.tenGod})`).join(", ")}.{" "}
            {HIDDEN_STEMS_NOTE[locale]}
          </p>
        </>
      );
    } else {
      body = <p>{t.chart.timeUnknownNote}</p>;
    }
  }

  return (
    <section
      aria-labelledby="destiny-detail-title"
      className="animate-rise-in rounded-sm border border-border-subtle bg-surface/60 p-4 text-sm leading-relaxed text-text-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 id="destiny-detail-title" ref={heading} tabIndex={-1} className="font-serif text-lg text-text outline-none">
          {title}
        </h4>
        <button
          type="button"
          onClick={() => select(null)}
          aria-label={t.chart.close}
          className="-mt-1 -mr-1 flex size-8 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="mt-2">{body}</div>
    </section>
  );
}
