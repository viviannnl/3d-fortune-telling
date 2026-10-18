"use client";

import { useMemo } from "react";
import { BackSide, Color, Vector3 } from "three";
import { PALETTE } from "@/lib/palette";
import { MOON } from "./layout";
import { useQuality } from "./quality";
import { SIMPLEX_3D } from "./shaders/noise";

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${SIMPLEX_3D}
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uNebulaA;
uniform vec3 uNebulaB;
uniform vec3 uNebulaC;
uniform vec3 uMoonDir;
varying vec3 vDir;

void main() {
  vec3 dir = normalize(vDir);
  float h = clamp(dir.y, -0.2, 1.0);
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.42, h));

  // Domain-warped nebula clouds in two hues, strongest a little above the horizon,
  // with darker dust lanes so the sky isn't one flat violet.
  float band = exp(-pow((dir.y - 0.3 + 0.1 * dir.x) * 2.6, 2.0));
  vec3 q = dir * 2.2 + vec3(4.0, 0.0, 1.0);
  #if LOW_QUALITY
  vec3 warp = vec3(0.0); // software rasterizers: skip the domain warp (3 extra fbm per pixel)
  #else
  vec3 warp = vec3(fbm(q), fbm(q + 5.2), fbm(q + 9.1));
  #endif
  float n = fbm(q + warp * 1.6);
  float clouds = smoothstep(0.0, 0.8, n) * band;
  float blueSide = smoothstep(-0.4, 0.6, dir.x);
  col = mix(col, mix(uNebulaA, uNebulaC, blueSide * 0.7), clouds * 0.5);
  col = mix(col, uNebulaB, smoothstep(0.45, 0.95, fbm(dir * 5.0 - 2.0 + warp)) * band * 0.12);
  float dust = smoothstep(0.1, 0.6, fbm(dir * 3.6 + warp * 2.0 + 13.0)) * band;
  col *= 1.0 - dust * 0.35;

  // Broad, soft moon glow in the atmosphere.
  float m = max(dot(dir, uMoonDir), 0.0);
  col += uNebulaB * (pow(m, 24.0) * 0.2 + pow(m, 6.0) * 0.02);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function SkyDome() {
  const low = useQuality() === "low";
  const uniforms = useMemo(
    () => ({
      uZenith: { value: new Color("#0b0f3a") },
      uHorizon: { value: new Color("#3a2470") },
      uNebulaA: { value: new Color("#7a3fd0") },
      uNebulaB: { value: new Color(PALETTE.lavender) },
      uNebulaC: { value: new Color("#3557c8") },
      uMoonDir: { value: new Vector3(...MOON.position).normalize() },
    }),
    [],
  );

  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        defines={{ LOW_QUALITY: low ? 1 : 0 }}
        side={BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
