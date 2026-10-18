"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Object3D,
  SphereGeometry,
  type InstancedMesh,
  type Points,
} from "three";
import { PALETTE } from "@/lib/palette";
import { glowTexture } from "./glowTexture";

interface Lantern {
  x: number;
  z: number;
  s: number;
  phase: number;
}

function hash(n: number) {
  const x = Math.sin(n * 45.164) * 28541.311;
  return x - Math.floor(x);
}

/** Hand-placed across the foreground and midground on both sides, clear of the moon's reflection path. */
const LANTERNS: Lantern[] = (
  [
    [-4.2, 7.5, 0.95],
    [-7.8, 4.2, 0.8],
    [-10.5, 8.8, 1.0],
    [-3.6, 1.5, 0.7],
    [-13.5, -1.0, 0.85],
    [-6.2, -3.5, 0.65],
    [-9.4, -12, 0.75],
    [-15.5, -18, 0.9],
    [-4.8, -16, 0.6],
    [4.6, 6.8, 0.9],
    [8.2, 3.6, 0.85],
    [11.2, 8.4, 0.95],
    [3.8, 0.8, 0.7],
    [13.8, -1.6, 0.8],
    [6.4, -4.2, 0.65],
    [10.2, -13, 0.75],
    [16, -19, 0.85],
    [5.2, -17, 0.6],
  ] as const
).map(([x, z, s], i) => ({ x, z, s, phase: hash(i + 120) * Math.PI * 2 }));

const PETALS = 8;
const PETAL_TILT = 0.75;

function placeLanterns(
  p: InstancedMesh | null,
  c: InstancedMesh | null,
  glowGeo: BufferGeometry,
  dummy: Object3D,
  t: number,
) {
  if (!p || !c) return;
  const glowPos = glowGeo.attributes.position as BufferAttribute;
  LANTERNS.forEach((l, i) => {
    const y = 0.06 + Math.sin(t * 0.6 + l.phase) * 0.03;
    const drift = t * 0.04 + l.phase;
    for (let k = 0; k < PETALS; k++) {
      const ring = k % 2;
      dummy.position.set(l.x, y, l.z);
      dummy.rotation.set(0, (k / PETALS) * Math.PI * 2 + drift + ring * 0.4, 0);
      dummy.rotateX(-PETAL_TILT * (ring ? 1.25 : 0.8));
      dummy.scale.setScalar(l.s * (ring ? 0.8 : 1));
      dummy.updateMatrix();
      p.setMatrixAt(i * PETALS + k, dummy.matrix);
    }
    dummy.position.set(l.x, y + 0.08 * l.s, l.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(l.s);
    dummy.updateMatrix();
    c.setMatrixAt(i, dummy.matrix);
    glowPos.setXYZ(i, l.x, y + 0.12 * l.s, l.z);
  });
  p.instanceMatrix.needsUpdate = true;
  c.instanceMatrix.needsUpdate = true;
  glowPos.needsUpdate = true;
}

/** Floating lotus lanterns: one instanced mesh for petals, one for cores, one point cloud for glows. */
export function LotusLanterns({ reducedMotion }: { reducedMotion: boolean }) {
  const petals = useRef<InstancedMesh>(null);
  const cores = useRef<InstancedMesh>(null);
  const glows = useRef<Points>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const petalGeo = useMemo(() => {
    const g = new SphereGeometry(1, 12, 8);
    g.scale(0.11, 0.03, 0.26);
    g.translate(0, 0, 0.2);
    return g;
  }, []);
  const coreGeo = useMemo(() => new SphereGeometry(0.075, 16, 12), []);
  const glowGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(LANTERNS.length * 3), 3));
    return g;
  }, []);
  useEffect(
    () => () => {
      petalGeo.dispose();
      coreGeo.dispose();
      glowGeo.dispose();
    },
    [petalGeo, coreGeo, glowGeo],
  );

  useLayoutEffect(() => {
    const p = petals.current;
    if (p) {
      const pale = new Color(PALETTE.moonlight);
      const blush = new Color("#e9c9e6");
      for (let i = 0; i < LANTERNS.length * PETALS; i++) p.setColorAt(i, i % 2 ? blush : pale);
      if (p.instanceColor) p.instanceColor.needsUpdate = true;
    }
    placeLanterns(petals.current, cores.current, glowGeo, dummy, 0);
  }, [glowGeo, dummy]);

  useFrame((state) => {
    if (!reducedMotion) placeLanterns(petals.current, cores.current, glowGeo, dummy, state.clock.elapsedTime);
  });

  return (
    <group>
      <instancedMesh ref={petals} args={[petalGeo, undefined, LANTERNS.length * PETALS]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.45} emissive={PALETTE.lavender} emissiveIntensity={0.2} />
      </instancedMesh>
      <instancedMesh ref={cores} args={[coreGeo, undefined, LANTERNS.length]} frustumCulled={false}>
        <meshBasicMaterial color="#fff1d6" toneMapped={false} />
      </instancedMesh>
      <points ref={glows} geometry={glowGeo} frustumCulled={false}>
        <pointsMaterial
          map={glowTexture()}
          color="#ffe6c4"
          size={1.4}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
