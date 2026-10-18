"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type Sprite, type SpriteMaterial } from "three";
import { useCharms, type CharmId } from "@/stores/charms";
import type { Vec3 } from "./layout";
import { glowTexture } from "./glowTexture";
import { ANTIQUE_SILVER, CHAMPAGNE, FROSTED } from "./materials";
import { useLathe } from "./ornament";

const POST: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.14, 0],
  [0.14, 0.05],
  [0.08, 0.1],
  [0.045, 0.16],
  [0.04, 1.0],
  [0.07, 1.05],
  [0.07, 1.08],
  [0, 1.08],
];

/** A standing lantern: moulded silver post, hexagonal frosted-glass body, champagne caps, warm glow. */
export function Lantern({
  position,
  color = "#ffd28a",
  phase = 0,
  charm,
  reducedMotion,
}: {
  position: Vec3;
  color?: string;
  phase?: number;
  /** If this lantern is a charm, it flares briefly when touched. */
  charm?: CharmId;
  reducedMotion: boolean;
}) {
  const post = useLathe(POST, 20);
  const glow = useRef<SpriteMaterial>(null);
  const sprite = useRef<Sprite>(null);
  useFrame((state) => {
    const g = glow.current;
    if (!g) return;
    const touched = charm ? useCharms.getState().touched[charm] : undefined;
    const since = touched === undefined ? Infinity : performance.now() - touched;
    const flare = since < 1600 ? 1 - since / 1600 : 0;
    // A slow, barely perceptible breath, plus a flare when the charm is touched.
    const breath = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.9 + phase) * 0.08;
    g.opacity = 0.5 + breath + flare * 0.5;
    sprite.current?.scale.setScalar(1.5 * (1 + flare * 1.2));
  });
  return (
    <group position={position}>
      <mesh geometry={post}>
        <meshStandardMaterial {...ANTIQUE_SILVER} />
      </mesh>
      <group position={[0, 1.27, 0]}>
        <mesh>
          <cylinderGeometry args={[0.13, 0.13, 0.3, 6]} />
          <meshStandardMaterial {...FROSTED} emissive={color} emissiveIntensity={1.3} />
        </mesh>
        {[0.17, -0.17].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[y > 0 ? 0.05 : 0.16, y > 0 ? 0.17 : 0.11, 0.05, 6]} />
            <meshStandardMaterial {...CHAMPAGNE} />
          </mesh>
        ))}
        <mesh position={[0, 0.24, 0]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial {...CHAMPAGNE} />
        </mesh>
        <sprite ref={sprite} scale={1.5}>
          <spriteMaterial
            ref={glow}
            map={glowTexture()}
            color={color}
            blending={AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.5}
          />
        </sprite>
      </group>
    </group>
  );
}
