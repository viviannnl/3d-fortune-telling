import type { LocalizedText } from "@/lib/i18n/types";

export type Orientation = "upright" | "reversed";

export const SPREAD_POSITIONS = ["past", "present", "future"] as const;
export type SpreadPosition = (typeof SPREAD_POSITIONS)[number];

export const CATEGORIES = ["love", "career", "self"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface TarotCard {
  /** Stable identifier, e.g. "major-00-fool". Never reuse or rename. */
  id: string;
  arcana: "major";
  /** 0–21 for the Major Arcana. */
  number: number;
  name: LocalizedText;
  /** Public path of the card face artwork, e.g. "/cards/major-00-fool.svg". */
  asset: string;
  keywords: {
    upright: LocalizedText[];
    reversed: LocalizedText[];
  };
  /** Curated general meaning, 1–2 sentences. */
  upright: LocalizedText;
  reversed: LocalizedText;
  /** One reflective sentence per question category (orientation-neutral). */
  focus: Record<Category, LocalizedText>;
}

/** One card placed in a spread. */
export interface CardSelection {
  cardId: string;
  orientation: Orientation;
  position: SpreadPosition;
}
