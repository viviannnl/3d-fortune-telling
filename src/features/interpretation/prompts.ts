import { getCard } from "@/features/tarot/cards";
import type { Category } from "@/features/tarot/types";
import { CONVENTION } from "@/features/destiny/conventions";
import { ELEMENT_NOTES, PILLAR_NOTES, STEM_NOTES, TEN_GOD_NOTES } from "@/features/destiny/reference";
import { stemByChar } from "@/features/destiny/symbols";
import type { ChartResult, PillarKey } from "@/features/destiny/types";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { DestinyTopic, TarotInterpretationRequest } from "./schema";

export interface BuiltPrompt {
  system: string;
  user: string;
  /** Keys the response's `items` must contain, in order. */
  expectedKeys: string[];
}

const LANGUAGE: Record<Locale, string> = {
  en: "Write everything in English.",
  zh: "Write everything in natural Simplified Chinese (简体中文) for native readers. Keep card and pillar names as given.",
};

const SHARED_RULES = `You write gentle, symbolic reflections for a calm, beautifully designed fortune-telling experience.

Ground rules — follow all of them:
- Treat the reading as symbolic exploration and entertainment, never as prediction or fact. Use tentative language ("may", "invites", "could be a time to").
- Never make claims about death, illness, health, pregnancy, legal or financial outcomes, guaranteed relationship outcomes, or what another specific person privately thinks or feels.
- Never tell the reader what will definitely happen. Suggestions must be practical, optional, and within the reader's control.
- Use only the data provided below. Do not add cards, pillars, elements, or traditional rules that are not given, and do not recalculate anything.
- Keep systems distinct: do not mix in Western astrology, numerology, or other traditions, and do not claim one system confirms another.
- Be warm and specific to the provided data, but concise: short paragraphs, no headings or markdown inside fields.

Output fields:
- overview: 2–4 sentences tying the whole reading together.
- items: one entry per expected key, in exactly the given order and with exactly the given key strings; "title" is a short evocative heading, "interpretation" is 2–4 sentences.
- themes: 3–5 short symbolic themes (1–4 words each).
- reflectionQuestions: 3 open questions for the reader.
- suggestions: 3 gentle, practical, non-deterministic suggestions.
- shareableSummary: one sentence under 200 characters that contains no personal data.`;

const CATEGORY_LABEL: Record<Category, string> = {
  love: "Love and relationships",
  career: "Career and purpose",
  self: "Self-discovery",
};

/** The model receives only verified cards and the curated meanings for exactly those cards. */
export function buildTarotPrompt(req: TarotInterpretationRequest): BuiltPrompt {
  const lines = req.selections.map((s) => {
    const card = getCard(s.cardId);
    if (!card) throw new Error(`unknown card ${s.cardId}`);
    return [
      `- key: ${card.id}`,
      `  position: ${s.position}`,
      `  card: ${card.name.en} (${card.name.zh}), ${s.orientation}`,
      `  curated meaning (${s.orientation}): ${card[s.orientation].en}`,
      `  keywords: ${card.keywords[s.orientation].map((k) => k.en).join(", ")}`,
      `  focus for this question: ${card.focus[req.category].en}`,
    ].join("\n");
  });

  return {
    system: `${SHARED_RULES}\n\nThis request is a three-card tarot reading (Past, Present, Future) from a 22-card Major Arcana deck. Base each card's interpretation on its curated meaning and position. ${LANGUAGE[req.locale]}`,
    user: `Question area: ${CATEGORY_LABEL[req.category]}\n\nSpread (expected item keys in order: ${req.selections.map((s) => s.cardId).join(", ")}):\n${lines.join("\n")}`,
    expectedKeys: req.selections.map((s) => s.cardId),
  };
}

const TOPIC_LABEL: Record<DestinyTopic, string> = {
  overview: "A general reflective overview",
  love: "Relationships and closeness",
  career: "Work and purpose",
  self: "Inner life and self-understanding",
};

/**
 * The model receives the already-calculated chart and curated reference notes —
 * never the birth date, time, or place.
 */
export function buildDestinyPrompt(chart: ChartResult, topic: DestinyTopic, locale: Locale): BuiltPrompt {
  const keys: PillarKey[] = ["year", "month", "day", ...(chart.pillars.hour ? (["hour"] as const) : [])];
  const pillarLines = keys.map((key) => {
    const p = chart.pillars[key];
    if (!p) return "";
    const stem = stemByChar(p.stem);
    const god = p.tenGod ? TEN_GOD_NOTES[p.tenGod] : null;
    return [
      `- key: ${key}`,
      `  pillar: ${p.name} — stem ${p.stem} (${stem?.polarity} ${p.stemElement}), branch ${p.branch} (${p.branchElement})`,
      `  traditional association: ${PILLAR_NOTES[key].note.en}`,
      god
        ? `  ten god of the stem: ${p.tenGod} (${god.name.en}) — ${god.relation.en}`
        : `  this is the Day Master's pillar`,
      `  hidden stems: ${p.hiddenStems.map((h) => `${h.stem} (${h.role}, ${h.tenGod})`).join(", ")}`,
    ].join("\n");
  });

  const dm = STEM_NOTES[chart.dayMaster.stem];
  const tally = Object.entries(chart.elementCounts)
    .map(([el, n]) => `${el} ${n} (${ELEMENT_NOTES[el as keyof typeof ELEMENT_NOTES].qualities.en})`)
    .join("\n  ");
  const caveats = [
    !chart.timeKnown && "The birth time is unknown, so there is no hour pillar. Do not speculate about it.",
    ...chart.ambiguities.map(
      (a) =>
        `The ${a.key} pillar is uncertain without a birth time (could be ${a.candidates.join(" or ")}); the chart shows ${chart.pillars[a.key].name}. Mention this uncertainty briefly.`,
    ),
  ].filter(Boolean);

  return {
    system: `${SHARED_RULES}\n\nThis request is a reflection on a Chinese Four Pillars (八字) chart that has ALREADY been calculated with a documented convention. Never recalculate or question the pillars. The element tally is a simple count, not a strength (旺衰) analysis — do not claim any element is "missing" in a harmful sense or prescribe remedies. ${LANGUAGE[locale]}`,
    user: [
      `Topic: ${TOPIC_LABEL[topic]}`,
      `Calculation convention (${CONVENTION.id}):\n  ${CONVENTION.rules.join("\n  ")}`,
      `Day Master: ${chart.dayMaster.stem} — ${chart.dayMaster.polarity} ${chart.dayMaster.element}. Traditional image: ${dm?.image.en}. ${dm?.note.en}`,
      `Pillars (expected item keys in order: ${keys.join(", ")}):\n${pillarLines.join("\n")}`,
      `Five Elements tally of ${chart.countedCharacters} visible characters:\n  ${tally}`,
      caveats.length ? `Caveats:\n- ${caveats.join("\n- ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    expectedKeys: keys,
  };
}
