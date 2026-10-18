import type { View } from "@/stores/experience";

export type Vec3 = readonly [number, number, number];

/** World placement of the moon; the sky glow and water reflection key off it. */
export const MOON = { position: [0, 16, -95] as Vec3, radius: 15 };

/** Island tops float above the water. */
export const DESTINATION_ANCHORS = {
  tarot: [-8.6, 3.0, -6] as Vec3,
  destiny: [8.8, 3.3, -8] as Vec3,
};

/** Height of each destination's name tag above its anchor. */
export const LABEL_HEIGHT = { tarot: 4.7, destiny: 5.8 };

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  /** Max parallax offset in world units at the screen edge. */
  parallax: number;
}

export const CAMERA_POSES: Record<View, CameraPose> = {
  sanctuary: { position: [0, 4.2, 16], target: [0, 5.6, -12], parallax: 1.1 },
  tarot: { position: [-8.6, 6.3, -1.25], target: [-8.6, 4.5, -5.3], parallax: 0.15 },
  destiny: { position: [8.8, 7.2, -1.6], target: [8.8, 6.2, -8], parallax: 0.2 },
};
