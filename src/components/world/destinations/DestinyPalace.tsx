"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group, type PointLight } from "three";
import { PALETTE } from "@/lib/palette";
import { DestinyCenterpiece } from "@/components/destiny/DestinyCenterpiece";
import { useExperience } from "@/stores/experience";
import { Crystal } from "../Crystal";
import { FloatingIsland } from "../FloatingIsland";
import { Lantern } from "../Lantern";
import { ANTIQUE_SILVER, CHAMPAGNE, OBSIDIAN } from "../materials";
import { TickRing, useLathe } from "../ornament";
import { useDestinationSignals } from "./DestinationContext";

/** Octagonal tiers: [radius, height, y]. */
const TIERS = [
  [2.75, 0.2, 0.1],
  [2.2, 0.2, 0.3],
  [1.6, 0.2, 0.5],
] as const;

/** Instrument pedestal: stepped foot, swelling knop, slender shaft, cup. [radius, height] */
const PEDESTAL: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.62, 0],
  [0.62, 0.08],
  [0.52, 0.12],
  [0.52, 0.18],
  [0.38, 0.24],
  [0.26, 0.36],
  [0.3, 0.5],
  [0.3, 0.58],
  [0.16, 0.7],
  [0.12, 1.2],
  [0.16, 1.26],
  [0.16, 1.32],
  [0.24, 1.42],
  [0.3, 1.46],
  [0, 1.46],
];

const LANTERN_ANGLES = [0, 1, 2, 3].map((i) => Math.PI / 4 + (i * Math.PI) / 2);

/** Destiny Palace: an octagonal obsidian observatory platform carrying the celestial instrument. */
export function DestinyPalace({ reducedMotion }: { reducedMotion: boolean }) {
  const { glow } = useDestinationSignals();
  const light = useRef<PointLight>(null);
  const halo = useRef<Group>(null);
  const inside = useExperience((s) => s.view === "destiny");
  const pedestal = useLathe(PEDESTAL, 40);

  useFrame((_, delta) => {
    const g = glow.current ?? 0;
    if (light.current) light.current.intensity = 5 + g * 12;
    const h = halo.current;
    if (!h) return;
    if (!reducedMotion) h.rotation.y += delta * (0.03 + g * 0.12);
    // The mansion ring frames the palace from afar, and recedes when you're inside with the chart.
    const target = inside ? 0.001 : 1;
    h.scale.setScalar(MathUtils.damp(h.scale.x, target, reducedMotion ? 30 : 3, delta));
    h.visible = h.scale.x > 0.01;
  });

  const top = TIERS[2][2] + TIERS[2][1] / 2;

  return (
    <group>
      <FloatingIsland radius={3.8} depth={2.8} seed={4} />

      {/* Octagonal obsidian tiers with silver edge trim */}
      {TIERS.map(([r, h, y]) => (
        <group key={r} rotation={[0, Math.PI / 8, 0]}>
          <mesh position={[0, y, 0]}>
            <cylinderGeometry args={[r, r + 0.05, h, 8]} />
            <meshPhysicalMaterial {...OBSIDIAN} />
          </mesh>
          <mesh position={[0, y + h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.018, 4, 8]} />
            <meshStandardMaterial {...ANTIQUE_SILVER} />
          </mesh>
        </group>
      ))}
      {/* The 24 solar terms marked around the upper tier */}
      <group position={[0, top + 0.002, 0]}>
        <TickRing radius={1.38} count={24} majorEvery={6} length={0.14} width={0.016} color="#d9c79c" emissive={0.3} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.36, 1.375, 96]} />
          <meshStandardMaterial {...CHAMPAGNE} />
        </mesh>
      </group>

      {/* Instrument pedestal, trim, and the half-ring cradle holding the sphere */}
      <mesh geometry={pedestal} position={[0, top, 0]}>
        <meshStandardMaterial {...ANTIQUE_SILVER} />
      </mesh>
      {[0.18, 0.58, 1.32].map((y) => (
        <mesh key={y} position={[0, top + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[y < 0.3 ? 0.53 : y < 1 ? 0.31 : 0.17, 0.014, 6, 48]} />
          <meshStandardMaterial {...CHAMPAGNE} />
        </mesh>
      ))}
      <mesh position={[0, 3.4, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[1.32, 0.035, 8, 64, Math.PI]} />
        <meshStandardMaterial {...CHAMPAGNE} />
      </mesh>

      {/* Suspended halo with 28 lunar-mansion marks (seen from the sanctuary) */}
      <group ref={halo} position={[0, 5.1, -0.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.025, 8, 160]} />
          <meshStandardMaterial {...CHAMPAGNE} />
        </mesh>
        <group position={[0, -0.06, 0]}>
          <TickRing
            radius={2.3}
            count={28}
            length={0.1}
            width={0.025}
            orientation="axial"
            color="#d9c79c"
            emissive={0.2}
          />
        </group>
      </group>

      <DestinyCenterpiece reducedMotion={reducedMotion} />

      {LANTERN_ANGLES.map((a, i) => (
        <Lantern
          key={a}
          position={[Math.cos(a) * 2.45, 0.2, Math.sin(a) * 2.45]}
          color={PALETTE.paleBlue}
          phase={i * 1.7}
          reducedMotion={reducedMotion}
        />
      ))}

      {(
        [
          [-3.1, 0, 1.3, 0.4, 2.2, 4],
          [3.2, 0, 1.0, 0.36, 3.6, 3],
          [-2.8, 0, -2.5, 0.3, 4.9, 3],
          [2.9, 0, -2.5, 0.42, 6.3, 5],
        ] as const
      ).map(([x, y, z, s, p, n], i) => (
        <Crystal
          key={i}
          position={[x, y, z]}
          scale={s}
          phase={p}
          points={n}
          floating={false}
          tint={PALETTE.paleBlue}
          reducedMotion={reducedMotion}
        />
      ))}
      <Crystal
        position={[-0.8, -1.7, 0.5]}
        scale={0.8}
        phase={9.2}
        points={4}
        floating={false}
        hanging
        bright
        tint={PALETTE.paleBlue}
        reducedMotion={reducedMotion}
      />

      <pointLight
        ref={light}
        position={[0, 4.6, 1.6]}
        color={PALETTE.paleBlue}
        intensity={5}
        distance={9}
        decay={1.6}
      />
    </group>
  );
}
