"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, type Group, type MeshStandardMaterial, type SpriteMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { glowTexture } from "@/components/world/glowTexture";
import { ANTIQUE_SILVER, CHAMPAGNE, SILVER } from "@/components/world/materials";
import { TickRing } from "@/components/world/ornament";

interface ArmillarySphereProps {
  radius?: number;
  /** 0..1 attention signal (hover, active chart) that speeds rotation and brightens the core. */
  energy: RefObject<number>;
  reducedMotion: boolean;
  /** Tint of the luminous core (the Day Master's element once a chart exists). */
  coreColor?: string;
}

const OBLIQUITY = (23.44 * Math.PI) / 180;

/** A flat metal band (open cylinder) — reads as a machined ring rather than a tube. */
interface MetalFinish {
  color: string;
  metalness: number;
  roughness: number;
}

function Band({ radius, height, material }: { radius: number; height: number; material: MetalFinish }) {
  return (
    <mesh>
      <cylinderGeometry args={[radius, radius, height, 128, 1, true]} />
      <meshStandardMaterial {...material} side={DoubleSide} />
    </mesh>
  );
}

/**
 * Armillary-inspired instrument: an engraved meridian band, a horizon band marked
 * with the 24 solar terms, a rotating equator/ecliptic assembly with studs,
 * small orbiting bodies, and a breathing luminous core.
 */
export function ArmillarySphere({
  radius = 1,
  energy,
  reducedMotion,
  coreColor = PALETTE.lavender,
}: ArmillarySphereProps) {
  const rotor = useRef<Group>(null);
  const ecliptic = useRef<Group>(null);
  const orbits = useRef<Group[]>([]);
  const core = useRef<MeshStandardMaterial>(null);
  const halo = useRef<SpriteMaterial>(null);

  useFrame((state, delta) => {
    const e = energy.current ?? 0;
    const t = state.clock.elapsedTime;
    if (!reducedMotion) {
      if (rotor.current) rotor.current.rotation.y += delta * (0.06 + e * 0.3);
      if (ecliptic.current) ecliptic.current.rotation.y -= delta * (0.04 + e * 0.16);
      orbits.current.forEach((o, i) => {
        if (o) o.rotation.y += delta * (0.25 - i * 0.06) * (1 + e);
      });
    }
    const breath = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.12;
    if (core.current) core.current.emissiveIntensity = 0.7 + e * 0.8 + breath;
    if (halo.current) halo.current.opacity = 0.35 + e * 0.35 + breath * 0.5;
  });

  const r = radius;
  return (
    <group scale={r}>
      {/* Meridian: vertical engraved champagne band */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Band radius={1.14} height={0.08} material={CHAMPAGNE} />
        <TickRing radius={1.14} count={72} majorEvery={6} length={0.05} width={0.01} color="#3a3150" emissive={0} />
      </group>
      {/* Horizon: wide silver band with the 24 solar-term marks */}
      <Band radius={1.22} height={0.11} material={ANTIQUE_SILVER} />
      <TickRing
        radius={1.225}
        count={24}
        majorEvery={6}
        length={0.06}
        width={0.014}
        orientation="axial"
        color="#e9dcb4"
        emissive={0.35}
      />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.22, 0, Math.sin(a) * 1.22]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial {...CHAMPAGNE} />
          </mesh>
        );
      })}

      <group ref={rotor} rotation={[0, 0, OBLIQUITY * 0.5]}>
        {/* Celestial equator and a colure */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.98, 0.016, 8, 128]} />
          <meshStandardMaterial {...SILVER} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.96, 0.011, 8, 128]} />
          <meshStandardMaterial {...SILVER} />
        </mesh>
        {/* Ecliptic: tilted gold band with twelve studs */}
        <group ref={ecliptic} rotation={[OBLIQUITY, 0, 0]}>
          <Band radius={0.9} height={0.055} material={CHAMPAGNE} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.905, 0, Math.sin(a) * 0.905]}>
                <sphereGeometry args={[0.022, 8, 6]} />
                <meshStandardMaterial color={PALETTE.moonlight} emissive={PALETTE.moonlight} emissiveIntensity={0.5} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* Small orbiting bodies on faint tracks */}
      {[
        { r: 0.5, tilt: 0.4, size: 0.04, color: PALETTE.moonlight },
        { r: 0.66, tilt: -0.6, size: 0.033, color: PALETTE.paleBlue },
        { r: 0.78, tilt: 1.1, size: 0.028, color: "#e6aaa4" },
      ].map((o, i) => (
        <group key={i} rotation={[o.tilt, 0, o.tilt * 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[o.r, 0.003, 4, 96]} />
            <meshBasicMaterial color={PALETTE.lavender} transparent opacity={0.35} />
          </mesh>
          <group
            ref={(g) => {
              if (g) orbits.current[i] = g;
            }}
            rotation={[0, i * 2.1, 0]}
          >
            <mesh position={[o.r, 0, 0]}>
              <sphereGeometry args={[o.size, 16, 12]} />
              <meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={0.6} roughness={0.3} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Luminous core */}
      <mesh>
        <sphereGeometry args={[0.17, 32, 24]} />
        <meshStandardMaterial
          ref={core}
          color={PALETTE.moonlight}
          emissive={coreColor}
          emissiveIntensity={0.7}
          roughness={0.2}
        />
      </mesh>
      <sprite scale={0.9}>
        <spriteMaterial
          ref={halo}
          map={glowTexture()}
          color={coreColor}
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.35}
        />
      </sprite>
    </group>
  );
}
