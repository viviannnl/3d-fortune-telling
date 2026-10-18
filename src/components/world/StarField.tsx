"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Points, type ShaderMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { useExperience } from "@/stores/experience";

interface StarLayer {
  count: number;
  radius: number;
  size: number;
  twinkle: number;
}

/** Far → near. Few bright stars, many faint ones, so the moon stays the focal point. */
const LAYERS: StarLayer[] = [
  { count: 2600, radius: 330, size: 1.1, twinkle: 0.25 },
  { count: 900, radius: 260, size: 1.8, twinkle: 0.45 },
  { count: 140, radius: 200, size: 3.0, twinkle: 0.7 },
];

const vertexShader = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSize;
uniform float uTwinkle;
uniform float uPixelRatio;
varying float vAlpha;
varying float vSeed;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.7) + aSeed * 40.0));
  vAlpha = (0.35 + 0.65 * fract(aSeed * 7.31)) * tw;
  vSeed = aSeed;
  gl_PointSize = uSize * uPixelRatio * (0.6 + fract(aSeed * 3.7));
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uDim;
varying float vAlpha;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uColorA, uColorB, step(0.82, fract(vSeed * 13.0)));
  gl_FragColor = vec4(col, a * vAlpha * (1.0 - 0.55 * uDim));
}
`;

/** Deterministic pseudo-random so the sky is identical on every load. */
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildLayer(layer: StarLayer, layerIndex: number): BufferGeometry {
  const positions = new Float32Array(layer.count * 3);
  const seeds = new Float32Array(layer.count);
  for (let i = 0; i < layer.count; i++) {
    const s = layerIndex * 10_000 + i;
    // Upper hemisphere bias; the water mirrors what's above.
    const y = 0.02 + 0.98 * Math.pow(rand(s + 0.1), 0.85);
    const theta = rand(s + 0.2) * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    const dist = layer.radius * (0.85 + 0.15 * rand(s + 0.3));
    positions.set([Math.cos(theta) * r * dist, y * dist, Math.sin(theta) * r * dist], i * 3);
    seeds[i] = rand(s + 0.4);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
}

function StarLayerPoints({ layer, index, reducedMotion }: { layer: StarLayer; index: number; reducedMotion: boolean }) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => buildLayer(layer, index), [layer, index]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: layer.size },
      uTwinkle: { value: reducedMotion ? 0 : layer.twinkle },
      uPixelRatio: { value: 1 },
      uDim: { value: 0 },
      uColorA: { value: new Color(PALETTE.moonlight) },
      uColorB: { value: new Color(PALETTE.paleBlue) },
    }),
    [layer, reducedMotion],
  );

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uPixelRatio.value = state.viewport.dpr;
    const dim = useExperience.getState().dim;
    m.uniforms.uDim.value += (dim - m.uniforms.uDim.value) * Math.min(1, delta * 2);
    if (!reducedMotion && points.current) points.current.rotation.y += delta * 0.0025 * (index + 1);
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </points>
  );
}

export function StarField({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {LAYERS.map((layer, i) => (
        <StarLayerPoints key={i} layer={layer} index={i} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
