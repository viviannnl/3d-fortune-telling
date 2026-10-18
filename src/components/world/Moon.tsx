"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Euler,
  SRGBColorSpace,
  Vector3,
  type Mesh,
  type SpriteMaterial,
} from "three";
import { glowTexture } from "./glowTexture";
import { PALETTE } from "@/lib/palette";
import { useExperience } from "@/stores/experience";
import { SIMPLEX_3D } from "./shaders/noise";
import type { Vec3 } from "./layout";

interface MoonProps {
  position: Vec3;
  radius: number;
  scale?: number;
  /** Synodic age, 0 at new moon and 0.5 at full. Omit for a fully lit disc. */
  phaseAge?: number;
  /** Lit fraction, used to dim the halo near a new moon. */
  illumination?: number;
  /** Receives the moon mesh (once) so post-processing can cast light shafts from it. */
  onMesh?: (mesh: Mesh | null) => void;
}

/** Radial falloff used for the halo sprite; built once per Moon. */
function createHaloTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.3, "rgba(255,255,255,0.16)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const vertexShader = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalView;
void main() {
  vObj = position;
  vNormalView = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${SIMPLEX_3D}
uniform vec3 uLight;
uniform vec3 uShadow;
uniform vec3 uRim;
uniform float uRadius;
/** Direction of the sun in the moon's own space; drives the phase terminator. */
uniform vec3 uSunDir;
/** 0 = no phase (fully lit disc), 1 = full phase shading. */
uniform float uPhaseStrength;
varying vec3 vObj;
varying vec3 vNormalView;
void main() {
  vec3 p = normalize(vObj);
  // Maria: large soft darker regions.
  float maria = smoothstep(-0.05, 0.45, fbm(p * 1.6 + vec3(2.1, 0.4, 5.3)));
  // Fine regolith texture.
  float grain = fbm(p * 9.0) * 0.5 + 0.5;
  // Sparse craters: bright rims around soft dips.
  float c = snoise(p * 5.5 + 11.0);
  float crater = smoothstep(0.62, 0.7, c) - smoothstep(0.7, 0.85, c) * 0.6;
  vec3 col = mix(uLight, uShadow, maria * 0.55);
  col *= 0.9 + grain * 0.14;
  col += crater * 0.05;
  // Gentle limb darkening with a cool lavender rim.
  float facing = clamp(vNormalView.z, 0.0, 1.0);
  col *= mix(0.72, 1.0, pow(facing, 0.5));
  col = mix(col, uRim, pow(1.0 - facing, 3.0) * 0.45);

  // Phase: the lit hemisphere faces the sun. The unlit side keeps only a trace
  // of earthshine so a crescent reads as a crescent instead of a grey ball,
  // and the terminator softens as it approaches the limb.
  float sun = dot(p, normalize(uSunDir));
  float lit = smoothstep(-0.12, 0.1, sun);
  float shade = mix(1.0, mix(0.012, 1.0, lit), uPhaseStrength);
  col *= shade;
  // Fade the dark limb out entirely rather than silhouetting it against the sky.
  float alpha = mix(1.0, clamp(0.03 + lit * 1.15, 0.0, 1.0), uPhaseStrength);

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`;

export function Moon({ position, radius, scale = 1, phaseAge, illumination = 1, onMesh }: MoonProps) {
  const halo = useMemo(() => createHaloTexture(), []);
  useEffect(() => () => halo.dispose(), [halo]);
  const haloMaterial = useRef<SpriteMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uLight: { value: new Color(PALETTE.moonlight).multiplyScalar(1.12) },
      uShadow: { value: new Color("#9d90c4") },
      uRim: { value: new Color(PALETTE.lavender) },
      uRadius: { value: radius },
      // The sun direction sweeps around as the synodic month advances: at new
      // moon it points away from the viewer, at full moon straight at them.
      // The mesh is rotated for surface detail, so aim in that same local frame.
      uSunDir: {
        value: new Vector3(
          Math.sin((phaseAge ?? 0.5) * Math.PI * 2),
          0,
          -Math.cos((phaseAge ?? 0.5) * Math.PI * 2),
        ).applyEuler(new Euler(-0.1, 0.6, -0.3)),
      },
      uPhaseStrength: { value: phaseAge === undefined ? 0 : 1 },
    }),
    [radius, phaseAge],
  );

  useFrame((_, delta) => {
    const m = haloMaterial.current;
    if (!m) return;
    // A thin crescent lights the sky far less than a full moon.
    const target = 0.55 * (0.35 + 0.65 * illumination) * (1 - 0.5 * useExperience.getState().dim);
    m.opacity += (target - m.opacity) * Math.min(1, delta * 2);
  });

  return (
    <group position={position} scale={scale}>
      <sprite scale={radius * 5} renderOrder={-5}>
        <spriteMaterial
          ref={haloMaterial}
          map={halo}
          color={PALETTE.lavender}
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.55}
          fog={false}
        />
      </sprite>
      {/* Wide, faint corona that bleeds the moonlight into the sky */}
      <sprite scale={radius * 11} renderOrder={-6}>
        <spriteMaterial
          map={glowTexture()}
          color={PALETTE.paleBlue}
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.16}
          fog={false}
        />
      </sprite>
      <mesh ref={onMesh} rotation={[0.3, -0.6, 0.1]}>
        <sphereGeometry args={[radius, 96, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
