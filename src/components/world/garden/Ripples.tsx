"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { ripples, RIPPLE_LIFE, RIPPLE_SPEED } from "./ripplePool";

const WATER_Y = 0.04;

/** Expanding rings of light where the water has been touched. */
export function Ripples({ reducedMotion }: { reducedMotion: boolean }) {
  const inner = useRef<(Mesh | null)[]>([]);
  const outer = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    ripples().forEach((r, i) => {
      const a = inner.current[i];
      const b = outer.current[i];
      if (!a || !b) return;
      const age = now - r.born;
      if (!r.active || age < 0 || age > RIPPLE_LIFE) {
        a.visible = false;
        b.visible = false;
        return;
      }
      const fade = 1 - age / RIPPLE_LIFE;
      // Reduced motion: a single still ring that fades instead of expanding.
      const radius = reducedMotion ? 1.6 : age * RIPPLE_SPEED;
      a.visible = true;
      b.visible = true;
      a.position.set(r.x, WATER_Y, r.z);
      b.position.set(r.x, WATER_Y, r.z);
      a.scale.setScalar(Math.max(0.05, radius));
      b.scale.setScalar(Math.max(0.05, radius * 0.62));
      (a.material as MeshBasicMaterial).opacity = fade * 0.75;
      (b.material as MeshBasicMaterial).opacity = fade * fade * 0.5;
    });
  });

  return (
    <group>
      {ripples().map((_, i) => (
        <group key={i}>
          <mesh
            ref={(m) => {
              inner.current[i] = m;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            renderOrder={3}
          >
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial
              color={PALETTE.moonlight}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              outer.current[i] = m;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            renderOrder={3}
          >
            <ringGeometry args={[0.8, 1, 48]} />
            <meshBasicMaterial
              color={PALETTE.paleBlue}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
