import { PALETTE } from "@/lib/palette";

/** Shared material parameters so every structure speaks the same visual language. */
export const SILVER = { color: "#cfc8e6", metalness: 0.9, roughness: 0.28 } as const;
/** Antique silver: darker, brushed, for structural metal. */
export const ANTIQUE_SILVER = { color: "#9a93b4", metalness: 0.95, roughness: 0.42 } as const;
export const MUTED_GOLD = { color: "#c8b27e", metalness: 0.85, roughness: 0.35 } as const;
/** Restrained champagne gold for fine accents. */
export const CHAMPAGNE = { color: "#d9c79c", metalness: 0.9, roughness: 0.25 } as const;
/** Polished obsidian for architectural bases. */
export const OBSIDIAN = {
  color: "#1c1830",
  roughness: 0.22,
  metalness: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.12,
} as const;
/** Frosted glass for lanterns. */
export const FROSTED = {
  color: "#efe6ff",
  roughness: 0.6,
  metalness: 0,
  transmission: 0,
  transparent: true,
  opacity: 0.85,
} as const;
export const JADE = {
  color: "#8fb2a6",
  roughness: 0.32,
  metalness: 0.05,
  clearcoat: 0.7,
  clearcoatRoughness: 0.2,
} as const;
export const PEARL = {
  color: PALETTE.deepViolet,
  roughness: 0.35,
  metalness: 0.2,
  sheen: 1,
  sheenColor: PALETTE.lavender,
  sheenRoughness: 0.4,
  clearcoat: 0.8,
  clearcoatRoughness: 0.15,
} as const;
