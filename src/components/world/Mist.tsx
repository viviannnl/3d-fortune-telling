"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type ShaderMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { SIMPLEX_3D } from "./shaders/noise";

const vertexShader = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const fragmentShader = /* glsl */ `
${SIMPLEX_3D}
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uCamera;
varying vec3 vWorld;
void main() {
  float n = fbm(vec3(vWorld.xz * 0.045, uTime * 0.03)) * 0.5 + 0.5;
  float dist = length(vWorld.xz - uCamera.xz);
  // Thin near the viewer, thicker toward the horizon, never covering the foreground fully.
  float depth = smoothstep(8.0, 70.0, dist) * (1.0 - smoothstep(120.0, 190.0, dist));
  float alpha = smoothstep(0.4, 0.9, n) * depth * 0.16;
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
}
`;

/** A low, drifting mist layer just above the water. */
export function Mist({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color(PALETTE.amethyst) },
      uCamera: { value: { x: 0, y: 0, z: 0 } },
    }),
    [],
  );
  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    if (!reducedMotion) m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uCamera.value = state.camera.position;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.45, -50]} renderOrder={1}>
      <planeGeometry args={[420, 240, 1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
