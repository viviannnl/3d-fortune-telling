"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type ShaderMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { useExperience } from "@/stores/experience";
import { introProgress } from "@/stores/intro";

const COUNT = 520;

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const vertexShader = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uScale;
uniform float uReveal;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Each glint flashes briefly and irregularly, like moonlight catching wavelets.
  float t = uTime * (0.7 + aSeed * 1.6) + aSeed * 90.0;
  vA = pow(max(sin(t), 0.0), 12.0) * (0.4 + 0.6 * fract(aSeed * 13.7));
  // The entrance: the path lights from the moon toward the viewer, a bright front leading it.
  float near = clamp(((modelMatrix * vec4(position, 1.0)).z + 90.0) / 100.0, 0.0, 1.0);
  float th = 0.4 + 0.28 * near;
  float front = smoothstep(th, th + 0.02, uReveal) * (1.0 - smoothstep(th + 0.02, th + 0.09, uReveal));
  vA = max(vA * smoothstep(th, th + 0.05, uReveal), front * (0.5 + 0.5 * fract(aSeed * 5.1)));
  gl_PointSize = (0.05 + aSeed * 0.07) * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uDim;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor, a * vA * (1.0 - 0.5 * uDim));
}
`;

/** Sparkles on the water along the moon's reflection path, widening toward the viewer. */
export function MoonGlints({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const z = 10 - Math.pow(hash(i), 0.7) * 85; // denser near the viewer
      const width = 1 + (z + 75) * 0.045; // the reflection path widens toward the viewer
      const x = (hash(i + 300) - 0.5) * 2 * width * (0.4 + 0.6 * hash(i + 600));
      pos.set([x, 0.03, z], i * 3);
      seed[i] = hash(i + 900);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 1 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uColor: { value: new Color(PALETTE.moonlight) },
    }),
    [],
  );

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    // Reduced motion: glints hold still at a soft constant level instead of flashing.
    m.uniforms.uTime.value = reducedMotion ? 1.3 : state.clock.elapsedTime;
    m.uniforms.uScale.value = state.viewport.dpr * (state.size.height / 2);
    m.uniforms.uReveal.value = introProgress();
    m.uniforms.uDim.value += (useExperience.getState().dim - m.uniforms.uDim.value) * Math.min(1, delta * 2);
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
