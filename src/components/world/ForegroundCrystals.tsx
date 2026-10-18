"use client";

import { PALETTE } from "@/lib/palette";
import { Crystal } from "./Crystal";
import { TERRACE_Y } from "./garden/Terrace";

/**
 * Large crystal formations on the terrace corners and one drifting overhead,
 * partly cropped by the frame so the sanctuary reads as a place you stand in.
 */
export function ForegroundCrystals({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      <Crystal
        position={[-8.2, TERRACE_Y, 7.4]}
        scale={1.9}
        tilt={0.18}
        phase={13.9}
        points={6}
        floating={false}
        bright
        reducedMotion={reducedMotion}
      />
      <Crystal
        position={[-4.9, TERRACE_Y, 10.4]}
        scale={0.8}
        tilt={-0.3}
        phase={12.7}
        points={3}
        floating={false}
        bright
        reducedMotion={reducedMotion}
      />
      <Crystal
        position={[8.4, TERRACE_Y, 7.6]}
        scale={1.6}
        tilt={-0.22}
        phase={15.1}
        points={5}
        floating={false}
        bright
        tint={PALETTE.paleBlue}
        reducedMotion={reducedMotion}
      />
      <Crystal position={[-6.8, 7.6, 5]} scale={0.8} tilt={0.5} phase={14.4} points={3} reducedMotion={reducedMotion} />
    </group>
  );
}
