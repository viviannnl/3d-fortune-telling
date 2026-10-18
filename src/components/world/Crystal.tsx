"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, LatheGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector2, Vector3, type Group } from "three";
import { PALETTE } from "@/lib/palette";
import type { Vec3 } from "./layout";

/** Hexagonal prism with a pointed termination — the classic quartz/amethyst point. */
let shardGeometry: LatheGeometry | null = null;
function shard(): LatheGeometry {
  if (!shardGeometry) {
    shardGeometry = new LatheGeometry(
      [
        new Vector2(0, -0.05),
        new Vector2(0.26, 0),
        new Vector2(0.28, 0.72),
        new Vector2(0.04, 1.08),
        new Vector2(0, 1.1),
      ],
      6,
    );
  }
  return shardGeometry;
}

const vertexShader = /* glsl */ `
#include <fog_pars_vertex>
varying vec3 vViewPos;
varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const fragmentShader = /* glsl */ `
#include <fog_pars_fragment>
uniform vec3 uCore;
uniform vec3 uRim;
uniform vec3 uLightDir;
uniform float uGlow;
varying vec3 vViewPos;
varying vec3 vLocal;
void main() {
  // Flat facet normals from screen-space derivatives: crisp crystal faces.
  vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
  vec3 v = normalize(-vViewPos);
  float fres = pow(1.0 - abs(dot(n, v)), 2.2);
  float facet = pow(max(dot(n, normalize(uLightDir)), 0.0), 18.0);
  // Brighter toward the tip, as if light gathers inside the point.
  float tip = smoothstep(0.1, 1.1, vLocal.y);
  vec3 col = mix(uCore, uRim, fres * 0.85 + tip * 0.25);
  col += facet * 0.9 + uGlow * tip * 0.35;
  float alpha = clamp(0.42 + fres * 0.5 + facet, 0.0, 0.95);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

function crystalMaterial(core: string, rim: string) {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uCore: { value: new Color(core) },
        uRim: { value: new Color(rim) },
        uLightDir: { value: new Vector3(-0.3, 0.6, 0.75) },
        uGlow: { value: 0.6 },
      },
    ]),
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
}

const materials = new Map<string, ShaderMaterial>();
/** Materials are shared per tint for the page's lifetime (a handful at most). */
function material(tint: string, bright: boolean) {
  const key = `${tint}:${bright}`;
  let m = materials.get(key);
  if (!m) {
    const core = tint === PALETTE.paleBlue ? (bright ? "#6f9cff" : "#4f6fd8") : bright ? "#9a5cff" : "#6a3fc8";
    m = crystalMaterial(core, bright ? PALETTE.moonlight : tint);
    materials.set(key, m);
  }
  return m;
}

function hash(n: number) {
  const x = Math.sin(n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export interface CrystalProps {
  position: Vec3;
  scale?: number;
  tilt?: number;
  /** Idle motion phase so neighbouring crystals don't move in lockstep. Also seeds the cluster shape. */
  phase?: number;
  tint?: string;
  /** Number of points in the cluster. */
  points?: number;
  /** Floating clusters bob; grounded ones (on islands) stay put. */
  floating?: boolean;
  /** Hang beneath a surface (points downward). */
  hanging?: boolean;
  /** Lighter core, for crystals seen against dark water or rock. */
  bright?: boolean;
  reducedMotion: boolean;
}

/** A small cluster of crystal points growing from a shared base. */
export function Crystal({
  position,
  scale = 1,
  tilt = 0,
  phase = 0,
  tint = PALETTE.lavender,
  points = 4,
  floating = true,
  hanging = false,
  bright = false,
  reducedMotion,
}: CrystalProps) {
  const group = useRef<Group>(null);
  const shards = useMemo(
    () =>
      Array.from({ length: points }, (_, i) => {
        const s = phase * 10 + i;
        const main = i === 0;
        return {
          rot: [
            main ? 0 : (hash(s) - 0.5) * 1.3,
            hash(s + 1) * Math.PI * 2,
            main ? 0 : (hash(s + 2) - 0.5) * 1.3,
          ] as Vec3,
          scale: main
            ? ([1, 1.25, 1] as Vec3)
            : ([0.55 + hash(s + 3) * 0.3, 0.5 + hash(s + 4) * 0.45, 0.55 + hash(s + 3) * 0.3] as Vec3),
          offset: main ? ([0, 0, 0] as Vec3) : ([(hash(s + 5) - 0.5) * 0.35, 0, (hash(s + 6) - 0.5) * 0.35] as Vec3),
        };
      }),
    [points, phase],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g || reducedMotion || !floating) return;
    const t = state.clock.elapsedTime * 0.35 + phase;
    g.position.y = position[1] + Math.sin(t) * 0.22 * scale;
    g.rotation.y = phase + state.clock.elapsedTime * 0.06;
  });

  const geo = shard();
  const mat = material(tint, bright);
  return (
    <group ref={group} position={position} rotation={[hanging ? Math.PI : 0, phase, tilt]} scale={scale}>
      {shards.map((s, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={mat}
          position={s.offset}
          rotation={s.rot}
          scale={s.scale}
          renderOrder={2}
        />
      ))}
    </group>
  );
}
