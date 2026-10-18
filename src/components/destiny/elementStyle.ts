import type { ElementId } from "@/features/destiny/symbols";

/**
 * Muted, harmonised element hues (jade, ember-rose, ochre-gold, silver, pale water)
 * so the Five Elements sit inside the lavender world rather than a festival palette.
 * Shared by the HTML chart and the 3D objects.
 */
export const ELEMENT_COLOR: Record<ElementId, string> = {
  wood: "#9cc4a8",
  fire: "#e6aaa4",
  earth: "#d6c08a",
  metal: "#dcd8ec",
  water: "#a9c9ee",
};
