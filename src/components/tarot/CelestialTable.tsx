"use client";

import type { Vec3 } from "@/components/world/layout";
import { ANTIQUE_SILVER, CHAMPAGNE, OBSIDIAN } from "@/components/world/materials";
import { starChartTexture, TickRing, useLathe } from "@/components/world/ornament";

const TABLE_RADIUS = 1.5;
export const TABLE_TOP_Y = 1.02;

/** Pedestal with a foot, knop, and capital mouldings. [radius, height] */
const PEDESTAL: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.62, 0],
  [0.62, 0.06],
  [0.5, 0.1],
  [0.42, 0.14],
  [0.24, 0.24],
  [0.18, 0.42],
  [0.26, 0.5],
  [0.26, 0.56],
  [0.17, 0.62],
  [0.16, 0.78],
  [0.34, 0.86],
  [0.52, 0.9],
  [0.52, 0.92],
  [0, 0.92],
];

/** Table top: a slab with a beveled lip and an under-moulding. */
const TOP: readonly (readonly [number, number])[] = [
  [0, 0],
  [TABLE_RADIUS - 0.02, 0],
  [TABLE_RADIUS, -0.02],
  [TABLE_RADIUS, -0.08],
  [TABLE_RADIUS - 0.06, -0.12],
  [TABLE_RADIUS - 0.22, -0.14],
  [0, -0.14],
];

/** Ritual table: moulded pedestal, obsidian slab, engraved star-chart inlay, silver rim and ticks. */
export function CelestialTable({ position }: { position: Vec3 }) {
  const pedestal = useLathe(PEDESTAL, 40);
  const top = useLathe(TOP, 96);

  return (
    <group position={position}>
      <mesh geometry={pedestal}>
        <meshPhysicalMaterial {...OBSIDIAN} />
      </mesh>
      {[0.53, 0.88].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[y < 0.6 ? 0.265 : 0.36, 0.012, 6, 48]} />
          <meshStandardMaterial {...CHAMPAGNE} />
        </mesh>
      ))}
      <mesh geometry={top} position={[0, TABLE_TOP_Y - 0.004, 0]}>
        <meshPhysicalMaterial {...OBSIDIAN} />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y - 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TABLE_RADIUS - 0.06, 128]} />
        <meshStandardMaterial
          map={starChartTexture()}
          emissiveMap={starChartTexture()}
          emissive="#ffffff"
          emissiveIntensity={0.28}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TABLE_RADIUS, 0.022, 8, 160]} />
        <meshStandardMaterial {...ANTIQUE_SILVER} />
      </mesh>
      <group position={[0, TABLE_TOP_Y - 0.06, 0]}>
        <TickRing
          radius={TABLE_RADIUS + 0.005}
          count={72}
          majorEvery={6}
          length={0.035}
          width={0.01}
          orientation="axial"
          color="#d9c79c"
          emissive={0.15}
        />
      </group>
    </group>
  );
}
