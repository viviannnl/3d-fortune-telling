"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE } from "@/lib/palette";
import { FloatingIsland } from "./FloatingIsland";
import type { Vec3 } from "./layout";

interface Spire {
  position: Vec3;
  scale: number;
  seed: number;
  kind: "spire" | "dome";
  phase: number;
}

const SPIRES: Spire[] = [
  { position: [-40, 12, -88], scale: 1.9, seed: 3, kind: "spire", phase: 0.4 },
  { position: [-64, 9, -84], scale: 2.3, seed: 5, kind: "dome", phase: 1.3 },
  { position: [38, 14, -90], scale: 1.6, seed: 7, kind: "dome", phase: 2.1 },
  { position: [66, 10, -86], scale: 2.5, seed: 9, kind: "spire", phase: 3.3 },
  { position: [-26, 21, -84], scale: 1.1, seed: 11, kind: "spire", phase: 4.5 },
  { position: [26, 23, -86], scale: 0.9, seed: 13, kind: "spire", phase: 5.1 },
];

const silhouette = { color: "#2a2147", roughness: 0.9, metalness: 0.1 } as const;

function Ornament({ kind }: { kind: Spire["kind"] }) {
  if (kind === "spire") {
    return (
      <group position={[0, 0.2, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.12, 0.35, 3, 6]} />
          <meshStandardMaterial {...silhouette} />
        </mesh>
        <mesh position={[0, 3.3, 0]}>
          <octahedronGeometry args={[0.35]} />
          <meshStandardMaterial color={PALETTE.lavender} emissive={PALETTE.lavender} emissiveIntensity={0.6} />
        </mesh>
      </group>
    );
  }
  // Small domed observatory with a softly lit band of windows.
  return (
    <group position={[0, 0.15, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.75, 0.85, 0.9, 16]} />
        <meshStandardMaterial {...silhouette} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.75, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a3060" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <torusGeometry args={[0.81, 0.04, 6, 32]} />
        <meshBasicMaterial color={PALETTE.lavender} toneMapped={false} />
      </mesh>
    </group>
  );
}

function DistantIsland({ spire, reducedMotion }: { spire: Spire; reducedMotion: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.y = spire.position[1] + Math.sin(state.clock.elapsedTime * 0.12 + spire.phase) * 0.6;
  });
  return (
    <group ref={ref} position={spire.position} scale={spire.scale}>
      <FloatingIsland radius={1.6} depth={3.2} seed={spire.seed} plain />
      <Ornament kind={spire.kind} />
    </group>
  );
}

/** Far-off floating islands with simple architecture; fog sinks them into the sky. */
export function DistantStructures({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {SPIRES.map((s, i) => (
        <DistantIsland key={i} spire={s} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
