"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Vector3, type ShaderMaterial } from "three";
import { useCharms, type Burst } from "@/stores/charms";
import { glowTexture } from "../glowTexture";
import { rng } from "../garden/scatter";

const COUNT = 90;
const LIFE = 1.9;

const vertexShader = /* glsl */ `
attribute vec3 aDir;
attribute float aSeed;
uniform float uAge;
uniform float uScale;
uniform float uStill;
uniform float uK;
varying float vA;
void main() {
  float t = uAge / ${LIFE.toFixed(2)};
  float speed = 1.4 + aSeed * 2.6;
  // Ease-out burst with a gentle sag, like falling glitter.
  // uK scales spread and size with distance so far charms (the moon) burst as visibly as near ones.
  vec3 p = position + uK * (1.0 - uStill) * (aDir * speed * (1.0 - pow(1.0 - t, 3.0)) + vec3(0.0, -0.9 * t * t, 0.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (1.0 - t) * (0.6 + 0.4 * sin(uAge * 18.0 + aSeed * 40.0));
  gl_PointSize = (0.18 + aSeed * 0.22) * uK * uScale * (1.0 - t * 0.5) / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
varying float vA;
void main() {
  vec4 tex = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(uColor, tex.a * vA);
}
`;

function OneBurst({ burst, reducedMotion }: { burst: Burst; reducedMotion: boolean }) {
  const mat = useRef<ShaderMaterial>(null);
  const born = useRef<number | null>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const dir = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    const random = rng(burst.seq * 7919 + 1);
    for (let i = 0; i < COUNT; i++) {
      pos.set(burst.position, i * 3);
      const u = random() * 2 - 1;
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      dir.set([Math.cos(a) * r, u * 0.8 + 0.25, Math.sin(a) * r], i * 3);
      seed[i] = random();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aDir", new BufferAttribute(dir, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, [burst.position, burst.seq]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uAge: { value: 0 },
      uScale: { value: 1 },
      // Reduced motion: the glitter glows and fades in place instead of flying out.
      uStill: { value: reducedMotion ? 1 : 0 },
      uK: { value: 1 },
      uMap: { value: glowTexture() },
      uColor: { value: new Color(burst.color) },
    }),
    [burst.color, reducedMotion],
  );

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    if (born.current === null) {
      born.current = state.clock.elapsedTime;
      m.uniforms.uK.value = Math.max(1, state.camera.position.distanceTo(new Vector3(...burst.position)) / 9);
    }
    const age = state.clock.elapsedTime - born.current;
    m.uniforms.uAge.value = Math.min(age, LIFE);
    m.uniforms.uScale.value = state.viewport.dpr * (state.size.height / 2);
    if (age >= LIFE) useCharms.getState().clearBurst(burst.seq);
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={5}>
      <shaderMaterial
        ref={mat}
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

/** Renders a sparkle burst for each recent charm touch; each removes itself when done. */
export function SparkleBursts({ reducedMotion }: { reducedMotion: boolean }) {
  const bursts = useCharms((s) => s.bursts);
  return (
    <group>
      {bursts.map((b) => (
        <OneBurst key={b.seq} burst={b} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
