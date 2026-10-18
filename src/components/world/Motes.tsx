"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Plane, Vector3, type ShaderMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { useExperience } from "@/stores/experience";
import { glowTexture } from "./glowTexture";

function hash(n: number) {
  const x = Math.sin(n * 91.7) * 15731.743;
  return x - Math.floor(x);
}

const vertexShader = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uAttract;
uniform float uPull;
varying float vAlpha;
void main() {
  vec3 p = position;
  // Slow rise with a gentle sideways sway; wraps within a 12-unit column.
  p.y = mod(p.y + uTime * (0.08 + aSeed * 0.1), 12.0) + 0.4;
  p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.6;
  p.z += cos(uTime * 0.17 + aSeed * 20.0) * 0.6;
  // Drawn toward the cursor with a soft gaussian falloff, so a few nearby
  // motes gather in the hand while the rest keep drifting.
  vec3 toCursor = uAttract - p;
  float d = length(toCursor);
  p += toCursor * uPull * exp(-(d * d) / 14.0) * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float fadeY = smoothstep(0.4, 1.6, p.y) * (1.0 - smoothstep(9.0, 12.4, p.y));
  vAlpha = fadeY * (0.35 + 0.65 * fract(aSeed * 7.13)) * (0.6 + 0.4 * sin(uTime * (0.8 + aSeed) + aSeed * 50.0));
  gl_PointSize = (0.14 + aSeed * 0.2) * uPixelRatio / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uDim;
varying float vAlpha;
void main() {
  vec4 tex = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(uColor, tex.a * vAlpha * (1.0 - 0.6 * uDim));
}
`;

interface MotesProps {
  reducedMotion: boolean;
  count?: number;
  /** Spawn volume: x half-width, base y, z range [near, far]. */
  area?: { halfX: number; baseY: number; zNear: number; zFar: number };
  color?: string;
  seed?: number;
  /** Fireflies gather gently toward the pointer. */
  followPointer?: boolean;
}

const DUST_AREA = { halfX: 30, baseY: 0, zNear: 8, zFar: -42 };

/** Celestial dust (default) or warm fireflies: sparse, slow motes drifting upward. */
export function Motes({
  reducedMotion,
  count = 260,
  area = DUST_AREA,
  color,
  seed = 0,
  followPointer = false,
}: MotesProps) {
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const k = i + seed * 10_000;
      pos.set(
        [
          (hash(k) - 0.5) * 2 * area.halfX,
          area.baseY + hash(k + 500) * 12,
          area.zNear + (area.zFar - area.zNear) * hash(k + 900),
        ],
        i * 3,
      );
      seeds[i] = hash(k + 1300);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return g;
  }, [count, area, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uDim: { value: 0 },
      uAttract: { value: new Vector3(0, -100, 0) },
      uPull: { value: 0 },
      uMap: { value: glowTexture() },
      uColor: { value: color ? new Color(color) : new Color(PALETTE.lavender).lerp(new Color("#ffe6c4"), 0.25) },
    }),
    [color],
  );

  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -(area.baseY + 1.1)), [area.baseY]);
  const hit = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    if (followPointer && !reducedMotion) {
      // Where the pointer meets the plane the fireflies hover in.
      state.raycaster.setFromCamera(state.pointer, state.camera);
      const found = state.raycaster.ray.intersectPlane(plane, hit);
      const target = found ? 1 : 0;
      m.uniforms.uPull.value += (target - m.uniforms.uPull.value) * Math.min(1, delta * 2.5);
      if (found) m.uniforms.uAttract.value.lerp(hit, Math.min(1, delta * 4));
    }
    if (!reducedMotion) m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uPixelRatio.value = state.viewport.dpr * (state.size.height / 2);
    m.uniforms.uDim.value += (useExperience.getState().dim - m.uniforms.uDim.value) * Math.min(1, delta * 2);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
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
