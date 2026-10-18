import type { ElementId } from "./symbols";

/**
 * Explicit, documented mapping from the element tally to 3D attributes.
 * Size and glow scale linearly with how many visible characters carry an
 * element. It is a picture of the tally — not of strength, balance, or fortune.
 */
export interface ElementVisual {
  scale: number;
  glow: number;
  /** False when the element does not appear in the tally (drawn as a faint outline). */
  present: boolean;
  isDayMaster: boolean;
}

export const VISUAL_RULES = {
  baseScale: 0.5,
  scalePerCharacter: 0.17,
  baseGlow: 0.12,
  glowPerCharacter: 0.09,
  maxCharacters: 8,
} as const;

export function elementVisual(count: number, element: ElementId, dayMaster: ElementId | null): ElementVisual {
  const n = Math.max(0, Math.min(VISUAL_RULES.maxCharacters, Math.floor(count)));
  return {
    scale: VISUAL_RULES.baseScale + VISUAL_RULES.scalePerCharacter * n,
    glow: VISUAL_RULES.baseGlow + VISUAL_RULES.glowPerCharacter * n,
    present: n > 0,
    isDayMaster: element === dayMaster,
  };
}
