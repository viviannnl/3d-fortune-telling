"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  type Group,
  type MeshStandardMaterial,
  type PointLight,
  type ShaderMaterial,
} from "three";
import { PALETTE } from "@/lib/palette";
import { CardBackPlane } from "@/components/tarot/CardBackPlane";
import { CelestialTable } from "@/components/tarot/CelestialTable";
import { TarotSpread3D } from "@/components/tarot/TarotSpread3D";
import { useExperience } from "@/stores/experience";
import { Crystal } from "../Crystal";
import { Flora, type Clump } from "../garden/Flora";
import { FloatingIsland } from "../FloatingIsland";
import { Lantern } from "../Lantern";
import { ANTIQUE_SILVER, CHAMPAGNE, OBSIDIAN } from "../materials";
import { TickRing, useLathe } from "../ornament";
import { useDestinationSignals } from "./DestinationContext";

/** Flower beds around the garden's rim, clear of the table and the cards. */
const BEDS: Clump[] = [
  { center: [-2.7, 0, 1.0], radius: 0.7, lavender: 30, flowers: 26, leaves: 45 },
  { center: [2.7, 0, 1.0], radius: 0.7, lavender: 30, flowers: 26, leaves: 45 },
  { center: [-2.4, 0, -1.6], radius: 0.8, lavender: 34, flowers: 30, leaves: 50, size: 1.1 },
  { center: [2.4, 0, -1.6], radius: 0.8, lavender: 34, flowers: 30, leaves: 50, size: 1.1 },
  { center: [-1.4, 0, 2.9], radius: 0.5, lavender: 14, flowers: 16, leaves: 24 },
  { center: [1.4, 0, 2.9], radius: 0.5, lavender: 14, flowers: 16, leaves: 24 },
];

const GATE_R = 1.8;
const GATE_Y = 2.45;

/** Slender gate column: plinth, shaft with a ring collar, capital. [radius, height] */
const COLUMN: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.22, 0],
  [0.22, 0.1],
  [0.17, 0.16],
  [0.12, 0.22],
  [0.1, 1.5],
  [0.14, 1.56],
  [0.14, 1.62],
  [0.1, 1.68],
  [0.09, 2.3],
  [0.15, 2.38],
  [0.18, 2.44],
  [0, 2.44],
];

/** Low dais behind the table on which the moon gate stands. */
const DAIS: readonly (readonly [number, number])[] = [
  [0, 0.16],
  [1.1, 0.16],
  [1.14, 0.12],
  [1.14, 0.08],
  [1.32, 0.08],
  [1.36, 0.04],
  [1.36, 0],
  [0, 0],
];

const veilVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const veilFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.55, d) * (0.35 + 0.65 * smoothstep(0.2, 1.0, d)) * uStrength;
  gl_FragColor = vec4(uColor, a);
}
`;

function Crescent({ angle }: { angle: number }) {
  return (
    <group
      position={[Math.cos(angle) * (GATE_R + 0.2), Math.sin(angle) * (GATE_R + 0.2), 0]}
      rotation={[0, 0, angle - Math.PI / 2]}
    >
      <mesh rotation={[0, 0, Math.PI * 0.15]}>
        <torusGeometry args={[0.13, 0.026, 8, 24, Math.PI * 1.3]} />
        <meshStandardMaterial {...CHAMPAGNE} emissive={CHAMPAGNE.color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

/** Tarot Garden: a moon gate on a dais, three display cards, a star-chart table, lanterns and crystals. */
export function TarotGarden({ reducedMotion }: { reducedMotion: boolean }) {
  const { glow } = useDestinationSignals();
  const gate = useRef<MeshStandardMaterial>(null);
  const veil = useRef<ShaderMaterial>(null);
  const gateLight = useRef<PointLight>(null);
  const display = useRef<Group>(null);
  const inside = useExperience((s) => s.view === "tarot");
  const column = useLathe(COLUMN, 24);
  const dais = useLathe(DAIS, 64);
  const veilUniforms = useMemo(
    () => ({ uColor: { value: new Color(PALETTE.lavender) }, uStrength: { value: 0.25 } }),
    [],
  );

  useFrame((state, delta) => {
    const g = glow.current ?? 0;
    const t = state.clock.elapsedTime;
    const breath = reducedMotion ? 0 : Math.sin(t * 0.8) * 0.05;
    if (gate.current) gate.current.emissiveIntensity = 0.05 + g * 0.45;
    if (veil.current) veil.current.uniforms.uStrength.value = 0.22 + g * 0.35 + breath;
    if (gateLight.current) gateLight.current.intensity = 5 + g * 12;
    if (display.current && !reducedMotion) {
      display.current.rotation.y += delta * (0.18 + g * 0.4);
      display.current.position.y = Math.sin(t * 0.6) * 0.05; // relative to the gate centre
    }
  });

  return (
    <group>
      <FloatingIsland radius={3.6} depth={2.6} seed={2} />

      {/* Moon gate on its dais */}
      <group position={[0, 0, -1.7]}>
        <mesh geometry={dais}>
          <meshPhysicalMaterial {...OBSIDIAN} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} geometry={column} position={[side * (GATE_R + 0.15), 0.16, 0]}>
            <meshStandardMaterial {...ANTIQUE_SILVER} />
          </mesh>
        ))}
        <group position={[0, GATE_Y, 0]}>
          {/* Square-section outer ring, champagne inner ring, engraved ticks between */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[GATE_R, 0.085, 4, 160]} />
            <meshStandardMaterial ref={gate} {...ANTIQUE_SILVER} emissive={PALETTE.lavender} emissiveIntensity={0.05} />
          </mesh>
          <mesh>
            <torusGeometry args={[GATE_R - 0.2, 0.022, 8, 160]} />
            <meshStandardMaterial {...CHAMPAGNE} />
          </mesh>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <TickRing radius={GATE_R - 0.17} count={60} majorEvery={5} length={0.06} width={0.012} />
          </group>
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a) => (
            <Crescent key={a} angle={a + Math.PI / 4} />
          ))}
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[GATE_R - 0.22, 96]} />
            <shaderMaterial
              ref={veil}
              uniforms={veilUniforms}
              vertexShader={veilVertex}
              fragmentShader={veilFragment}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
          <Crystal
            position={[0, GATE_R - 0.05, 0]}
            scale={0.32}
            phase={3.3}
            points={3}
            floating={false}
            hanging
            bright
            reducedMotion={reducedMotion}
          />
          {/* Three display cards, fanned, slowly turning — they step aside during a reading */}
          {!inside && (
            <group ref={display}>
              {[-1, 0, 1].map((i) => (
                <group
                  key={i}
                  position={[i * 0.32, -Math.abs(i) * 0.06, -Math.abs(i) * 0.05]}
                  rotation={[0, i * -0.18, i * -0.12]}
                >
                  <CardBackPlane width={0.62} />
                </group>
              ))}
            </group>
          )}
        </group>
        <pointLight
          ref={gateLight}
          position={[0, GATE_Y, 0.8]}
          color={PALETTE.lavender}
          intensity={5}
          distance={6}
          decay={1.7}
        />
      </group>

      <Flora clumps={BEDS} seed={11} />
      <CelestialTable position={[0, 0, 0.6]} />
      <TarotSpread3D reducedMotion={reducedMotion} />

      <Lantern position={[-2.55, 0, 1.75]} phase={0.4} reducedMotion={reducedMotion} />
      <Lantern position={[2.55, 0, 1.75]} phase={2.1} reducedMotion={reducedMotion} />

      {/* Crystal clusters growing from the terrace, and a few hanging beneath the rock */}
      {(
        [
          [-2.9, 0, 0.2, 0.42, 0.4, 4],
          [-2.3, 0, -2.4, 0.36, 1.7, 3],
          [2.95, 0, 0.0, 0.48, 2.9, 5],
          [2.35, 0, -2.3, 0.3, 4.2, 3],
        ] as const
      ).map(([x, y, z, s, p, n], i) => (
        <Crystal
          key={i}
          position={[x, y, z]}
          scale={s}
          phase={p}
          points={n}
          floating={false}
          reducedMotion={reducedMotion}
        />
      ))}
      <Crystal
        position={[0.9, -1.6, 0.5]}
        scale={0.75}
        phase={7.3}
        points={4}
        floating={false}
        hanging
        bright
        reducedMotion={reducedMotion}
      />
      <Crystal
        position={[-1.2, -1.2, -0.9]}
        scale={0.5}
        phase={8.1}
        points={3}
        floating={false}
        hanging
        reducedMotion={reducedMotion}
      />

      <pointLight position={[0, 3.2, 1.6]} color="#ffe2bd" intensity={1.2} distance={5} decay={1.8} />
    </group>
  );
}
