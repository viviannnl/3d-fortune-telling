"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  IcosahedronGeometry,
  type InstancedMesh,
  type ShaderMaterial,
} from "three";
import { glowTexture } from "../glowTexture";
import { useSkyLook } from "../skyContext";
import { applyInstances, rng, type Instance } from "./scatter";

const SHORE_Z = -64;

const fallVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fallFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
float h(float n) { return fract(sin(n * 91.7) * 43758.5); }
void main() {
  // Vertical streaks scrolling down at slightly different speeds.
  float col = floor(vUv.x * 28.0);
  float speed = 0.35 + h(col) * 0.4;
  float streak = fract(vUv.y * 3.0 + uTime * speed + h(col + 7.0));
  float s = smoothstep(0.0, 0.4, streak) * (1.0 - smoothstep(0.6, 1.0, streak));
  float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
  float fadeTop = smoothstep(1.0, 0.85, vUv.y);
  gl_FragColor = vec4(uColor, (0.25 + 0.55 * s) * edge * fadeTop * 0.6);
}
`;

function Waterfall({
  x,
  height,
  width,
  reducedMotion,
}: {
  x: number;
  height: number;
  width: number;
  reducedMotion: boolean;
}) {
  const mat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new Color("#cfe0fb") } }), []);
  useFrame((state) => {
    if (mat.current && !reducedMotion) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <group position={[x, 0, SHORE_Z + 0.5]}>
      {/* Cliff behind the fall */}
      <mesh position={[0, height / 2 - 0.5, -1.2]} scale={[width * 1.6, height / 2 + 0.5, 2]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1e1a36" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={fallVertex}
          fragmentShader={fallFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <sprite position={[0, 0.6, 0.5]} scale={[width * 3, 2.5, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#c5ddf8"
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.4}
        />
      </sprite>
    </group>
  );
}

/** The far shore: a dark landmass with cypress and round-crowned trees, scattered warm lights, and two waterfalls. */
export function FarShore({ reducedMotion }: { reducedMotion: boolean }) {
  const { season } = useSkyLook();
  const cone = useMemo(() => new ConeGeometry(1, 1, 7), []);
  const crown = useMemo(() => new IcosahedronGeometry(1, 1), []);
  useEffect(
    () => () => {
      cone.dispose();
      crown.dispose();
    },
    [cone, crown],
  );
  const shore = season.shore;
  const { cypress, round, lights } = useMemo(() => {
    const r = rng(101);
    const cypress: Instance[] = [];
    const round: Instance[] = [];
    const lightPos: number[] = [];
    for (let i = 0; i < 150; i++) {
      const x = (r() - 0.5) * 170;
      if (Math.abs(x) < 9) continue; // keep the moon's horizon clear
      const z = SHORE_Z - r() * 10;
      const tone = 0.85 + r() * 0.3;
      const color = `rgb(${Math.round(shore[0] * tone)}, ${Math.round(shore[1] * tone)}, ${Math.round(shore[2] * tone)})`;
      if (r() > 0.45) {
        const h = 3 + r() * 6;
        cypress.push({ position: [x, h / 2 + 0.6, z], scale: [0.55 + r() * 0.4, h, 0.55 + r() * 0.4], color });
      } else {
        const s = 1 + r() * 1.8;
        round.push({ position: [x, s * 0.8 + 0.6, z], scale: [s * 1.2, s, s * 1.1], color });
      }
      if (r() > 0.72) lightPos.push(x + (r() - 0.5) * 2, 0.8 + r() * 2.2, z + 1);
    }
    const lights = new BufferGeometry();
    lights.setAttribute("position", new BufferAttribute(new Float32Array(lightPos), 3));
    return { cypress, round, lights };
  }, [shore]);
  useEffect(() => () => lights.dispose(), [lights]);
  const cyRef = useRef<InstancedMesh>(null);
  const roRef = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    applyInstances(cyRef.current, cypress);
    applyInstances(roRef.current, round);
  }, [cypress, round]);

  return (
    <group>
      <mesh position={[0, 0.3, SHORE_Z - 4]}>
        <boxGeometry args={[260, 1.4, 10]} />
        <meshStandardMaterial color="#1c1832" roughness={0.95} />
      </mesh>
      <instancedMesh ref={cyRef} args={[cone, undefined, cypress.length]}>
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={roRef} args={[crown, undefined, round.length]}>
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      <points geometry={lights}>
        <pointsMaterial
          map={glowTexture()}
          color="#ffcf7a"
          size={1.6}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <Waterfall x={-30} height={9} width={2.6} reducedMotion={reducedMotion} />
      <Waterfall x={34} height={11} width={3} reducedMotion={reducedMotion} />
    </group>
  );
}
