import type { DayMood, Season } from "./celestial";

/**
 * How the real date and clock tint the sanctuary.
 * Pure data so the look can be reviewed and tested without a renderer.
 */

export interface MoodPalette {
  /** Sky gradient. */
  zenith: string;
  horizon: string;
  /** Nebula clouds. */
  nebulaA: string;
  nebulaB: string;
  nebulaC: string;
  fog: string;
  water: string;
  /** Ambient hemisphere light. */
  skyLight: string;
  groundLight: string;
  ambientIntensity: number;
  /** Warm glow along the horizon: dusk and dawn only. */
  horizonWarmth: number;
}

export const MOOD_PALETTES: Record<DayMood, MoodPalette> = {
  dusk: {
    zenith: "#171245",
    horizon: "#6a3a86",
    nebulaA: "#a04bc0",
    nebulaB: "#ffc08a",
    nebulaC: "#4a4fd0",
    fog: "#473070",
    water: "#3b2a72",
    skyLight: "#c9a0ff",
    groundLight: "#43265e",
    ambientIntensity: 0.78,
    horizonWarmth: 0.85,
  },
  night: {
    zenith: "#0b0f3a",
    horizon: "#3a2470",
    nebulaA: "#7a3fd0",
    nebulaB: "#bca6f5",
    nebulaC: "#3557c8",
    fog: "#2b2563",
    water: "#26286e",
    skyLight: "#a99cff",
    groundLight: "#2a2160",
    ambientIntensity: 0.7,
    horizonWarmth: 0,
  },
  deepNight: {
    zenith: "#05072a",
    horizon: "#241a58",
    nebulaA: "#5e2fb0",
    nebulaB: "#9f88e8",
    nebulaC: "#2440ad",
    fog: "#1d1a4f",
    water: "#171a55",
    skyLight: "#8c7fe8",
    groundLight: "#1b1550",
    ambientIntensity: 0.58,
    horizonWarmth: 0,
  },
  dawn: {
    zenith: "#122055",
    horizon: "#7d4a8c",
    nebulaA: "#b55fc4",
    nebulaB: "#ffb6c9",
    nebulaC: "#4a6ad8",
    fog: "#4a3573",
    water: "#34336f",
    skyLight: "#d8b0ff",
    groundLight: "#3d2a60",
    ambientIntensity: 0.82,
    horizonWarmth: 1,
  },
  day: {
    zenith: "#13246b",
    horizon: "#5a49b0",
    nebulaA: "#8e63e0",
    nebulaB: "#cfdcff",
    nebulaC: "#4a74e0",
    fog: "#3a3a85",
    water: "#333a90",
    skyLight: "#c0cbff",
    groundLight: "#2f2f78",
    ambientIntensity: 0.9,
    horizonWarmth: 0.2,
  },
};

export interface SeasonPalette {
  /** Blossom colours for the flower beds. */
  flowers: readonly string[];
  /** Foliage colours. */
  leaves: readonly string[];
  /** Flower-spike colour (lavender in spring, reeds in autumn, and so on). */
  spike: string;
  spikeEmissive: string;
  /** Hanging cascade in the top corners. */
  cascadeDeep: string;
  cascadePale: string;
  cascadeEmissive: string;
  /** Falling drift: petals, leaves, or snow. */
  driftColors: readonly string[];
  /** Lily pad tints. */
  pads: readonly string[];
  /** Far-shore foliage tint multiplier (r, g, b). */
  shore: readonly [number, number, number];
}

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    flowers: ["#ff9ad5", "#f26cc6", "#c48cff", "#fff4fb", "#ffb8e8", "#a679ff", "#ff7fb8"],
    leaves: ["#24564f", "#2a4d63", "#1f4a5a", "#2f6058"],
    spike: "#a879ff",
    spikeEmissive: "#8a4dff",
    cascadeDeep: "#9d5cff",
    cascadePale: "#f6e6ff",
    cascadeEmissive: "#a46cff",
    driftColors: ["#c79bff", "#e9c6ff", "#ff9ad5", "#b07dff"],
    pads: ["#245a50", "#1f4c5c", "#2e6656"],
    shore: [24, 30, 70],
  },
  summer: {
    flowers: ["#ff6fae", "#ff9ecb", "#7ad7ff", "#fff6e8", "#5ec8e8", "#ffd166", "#ff87d1"],
    leaves: ["#1d6b4e", "#217a58", "#19624a", "#2b8a62"],
    spike: "#58c7e8",
    spikeEmissive: "#3aa6e0",
    cascadeDeep: "#4fb0d8",
    cascadePale: "#eafcff",
    cascadeEmissive: "#56c8f0",
    driftColors: ["#9ae8ff", "#ffc2e4", "#eafcff", "#7ad7ff"],
    pads: ["#1f7a52", "#19695e", "#2a8a60"],
    shore: [20, 42, 66],
  },
  autumn: {
    flowers: ["#ffb45c", "#ff8a4c", "#ffd98a", "#fff0d0", "#e8705c", "#d98cff", "#ffa0b8"],
    leaves: ["#7a4a2a", "#8c5a2e", "#6a3f28", "#9c6a38"],
    spike: "#e8c070",
    spikeEmissive: "#d8993f",
    cascadeDeep: "#d86a3a",
    cascadePale: "#ffe4b8",
    cascadeEmissive: "#e8903f",
    driftColors: ["#ff9a4c", "#e8704c", "#ffcf8a", "#c96a3a"],
    pads: ["#6a5230", "#7a5a38", "#5a4a2e"],
    shore: [48, 34, 58],
  },
  winter: {
    flowers: ["#ffffff", "#e8f4ff", "#ffd8e8", "#f0e8ff", "#cfe4ff", "#ffc0d8", "#ffffff"],
    leaves: ["#2a3c55", "#33475e", "#243448", "#3d5168"],
    spike: "#dceaff",
    spikeEmissive: "#9fc4f0",
    cascadeDeep: "#7f9fd8",
    cascadePale: "#ffffff",
    cascadeEmissive: "#a8c8f0",
    driftColors: ["#ffffff", "#eaf4ff", "#dcecff", "#ffffff"],
    pads: ["#3a4a5e", "#32455a", "#45566a"],
    shore: [26, 32, 62],
  },
};
