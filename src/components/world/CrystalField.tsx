"use client";

import { PALETTE } from "@/lib/palette";
import { Crystal, type CrystalProps } from "./Crystal";

type Placement = Omit<CrystalProps, "reducedMotion">;

/** Hand-placed for composition: framing the moon from the sides, never crossing it. */
const PLACEMENTS: Placement[] = [
  { position: [-17, 8.5, -24], scale: 1.5, tilt: 0.25, phase: 0.2, points: 5 },
  { position: [-12.5, 12, -34], scale: 0.85, tilt: -0.2, phase: 1.4, tint: PALETTE.paleBlue, points: 3 },
  { position: [16.5, 9.2, -26], scale: 1.35, tilt: -0.3, phase: 3.1, points: 5 },
  { position: [12, 12.8, -36], scale: 0.8, tilt: 0.15, phase: 4.0, tint: PALETTE.paleBlue, points: 3 },
  { position: [-23, 4.8, -14], scale: 1.0, tilt: 0.1, phase: 0.9, points: 4 },
  { position: [23.5, 5.2, -16], scale: 0.95, tilt: -0.12, phase: 2.7, points: 4 },
  { position: [-4.2, 9.5, -40], scale: 0.5, tilt: 0.4, phase: 5.3, tint: PALETTE.paleBlue, points: 2 },
  { position: [4.6, 10.2, -42], scale: 0.45, tilt: -0.35, phase: 6.1, points: 2 },
];

export function CrystalField({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {PLACEMENTS.map((p, i) => (
        <Crystal key={i} {...p} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
