"use client";

import { useMemo, useRef } from "react";
import { useCharms } from "@/stores/charms";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type ShaderMaterial, type SpriteMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { glowTexture } from "../glowTexture";
import type { Vec3 } from "../layout";
import { CHAMPAGNE } from "../materials";
import { useLathe } from "../ornament";
import { SIMPLEX_3D } from "../shaders/noise";

const STAND: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.3, 0],
  [0.3, 0.05],
  [0.12, 0.12],
  [0.07, 0.35],
  [0.12, 0.42],
  [0.26, 0.52],
  [0.22, 0.56],
  [0, 0.5],
];

const vertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormalV;
void main() {
  vPos = position;
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragment = /* glsl */ `
${SIMPLEX_3D}
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uBright;
varying vec3 vPos;
varying vec3 vNormalV;
void main() {
  vec3 p = normalize(vPos) * 1.6;
  float swirl = fbm(p + vec3(uTime * 0.08, uTime * 0.05, 0.0) + fbm(p * 1.7 - uTime * 0.04));
  float fres = pow(1.0 - clamp(vNormalV.z, 0.0, 1.0), 2.0);
  vec3 col = mix(uDeep, uBright, smoothstep(-0.25, 0.6, swirl)) * 1.35;
  col += fres * uBright * 1.1;
  gl_FragColor = vec4(col, 0.92);
  #include <colorspace_fragment>
}
`;

/** A scrying orb on a champagne stand: swirling inner nebula, fresnel rim, soft glow. */
export function CrystalOrb({ position, reducedMotion }: { position: Vec3; reducedMotion: boolean }) {
  const stand = useLathe(STAND, 24);
  const mat = useRef<ShaderMaterial>(null);
  const glow = useRef<SpriteMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new Color("#5b3aa8") },
      uBright: { value: new Color(PALETTE.lavender) },
    }),
    [],
  );
  const spin = useRef(0);
  useFrame((state, delta) => {
    const touched = useCharms.getState().touched.orb;
    const since = touched === undefined ? Infinity : performance.now() - touched;
    const flare = since < 2000 ? 1 - since / 2000 : 0;
    if (glow.current)
      glow.current.opacity = 0.55 + (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.08) + flare * 0.45;
    if (reducedMotion) return;
    // The nebula inside swirls faster for a moment when the orb is touched.
    spin.current += delta * (1 + flare * 8);
    if (mat.current) mat.current.uniforms.uTime.value = spin.current;
  });
  return (
    <group position={position}>
      <mesh geometry={stand}>
        <meshStandardMaterial {...CHAMPAGNE} />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <sphereGeometry args={[0.34, 48, 32]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} transparent />
      </mesh>
      <sprite position={[0, 0.88, 0]} scale={2.0}>
        <spriteMaterial
          ref={glow}
          map={glowTexture()}
          color={PALETTE.lavender}
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.55}
        />
      </sprite>
    </group>
  );
}
