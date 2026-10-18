/**
 * Reference palette for the WebGL layer, which cannot read CSS variables.
 * Must stay in sync with the tokens in src/app/globals.css.
 */
export const PALETTE = {
  midnight: "#17152f",
  deepViolet: "#302448",
  amethyst: "#55427c",
  lavender: "#bca6f5",
  moonlight: "#e7ddfb",
  paleBlue: "#c5ddf8",
  /** Base tint of the reflective water (a lifted deep violet). */
  water: "#3a2d5e",
} as const;
