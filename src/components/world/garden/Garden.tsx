"use client";

import { bezierXZ } from "./scatter";
import { CrystalOrb } from "./CrystalOrb";
import { Flora, type Clump } from "./Flora";
import { LilyPads } from "./LilyPads";
import { Ripples } from "./Ripples";
import { WishLanterns } from "./WishLanterns";
import { EDGE, Terrace, TERRACE_Y, URNS } from "./Terrace";
import { Wisteria } from "./Wisteria";
import { Motes } from "../Motes";
import { useQuality } from "../quality";

const Y = TERRACE_Y;
const URN_TOP = Y + 1.18;

/** Flower beds on the terrace: overflowing urns, corner masses, and pockets along the balustrades. */
const CLUMPS: Clump[] = [
  ...URNS.map(([x, z]): Clump => ({
    center: [x, URN_TOP, z],
    radius: 0.72,
    lavender: 45,
    flowers: 55,
    leaves: 90,
    size: 1.05,
  })),
  { center: [-10.6, Y, 9.2], radius: 2.8, lavender: 150, flowers: 90, leaves: 190, size: 1.35 },
  { center: [10.6, Y, 9.2], radius: 2.8, lavender: 150, flowers: 90, leaves: 190, size: 1.35 },
  { center: [-6.2, Y, 11.2], radius: 1.8, lavender: 80, flowers: 50, leaves: 110, size: 1.2 },
  { center: [6.2, Y, 11.2], radius: 1.8, lavender: 80, flowers: 50, leaves: 110, size: 1.2 },
  { center: [-3.5, Y, 5.4], radius: 0.8, lavender: 30, flowers: 20, leaves: 40 },
  { center: [3.5, Y, 5.4], radius: 0.8, lavender: 30, flowers: 20, leaves: 40 },
  // Pockets just inside each balustrade.
  ...[0.08, 0.15, 0.22, 0.29, 0.71, 0.78, 0.85, 0.92].map((t): Clump => {
    const [x, z] = bezierXZ(EDGE.a, EDGE.b, EDGE.c, t);
    return { center: [x, Y, z + 1.05], radius: 0.55, lavender: 22, flowers: 14, leaves: 30 };
  }),
];

const FIREFLY_AREA = { halfX: 13, baseY: 0.3, zNear: 12, zFar: -4 };

/** The foreground garden the viewer stands in. */
export function Garden({ reducedMotion }: { reducedMotion: boolean }) {
  const quality = useQuality();
  return (
    <group>
      <Terrace reducedMotion={reducedMotion} />
      <Flora clumps={CLUMPS} seed={3} />
      <Wisteria reducedMotion={reducedMotion} />
      <LilyPads />
      <CrystalOrb position={[3.9, Y, 7.6]} reducedMotion={reducedMotion} />
      {/* Warm pools of lantern light over each side's flower beds (skipped on the low tier: lights are costly per pixel) */}
      {quality === "high" &&
        [-1, 1].map((side) => (
          <pointLight
            key={side}
            position={[side * 7.4, Y + 2.4, 8.2]}
            color="#ffc977"
            intensity={8}
            distance={11}
            decay={1.5}
          />
        ))}
      <Motes reducedMotion={reducedMotion} count={70} area={FIREFLY_AREA} color="#ffd47a" seed={2} followPointer />
      <Ripples reducedMotion={reducedMotion} />
      <WishLanterns reducedMotion={reducedMotion} />
    </group>
  );
}
