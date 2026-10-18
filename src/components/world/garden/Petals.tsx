"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Euler, Matrix4, Quaternion, SphereGeometry, Vector3, type InstancedMesh } from "three";
import { useSkyLook } from "../skyContext";
import { applyInstances, rng } from "./scatter";

const COUNT = 70;

/** Wisteria petals drifting down from the top corners with a slow tumble and sway. */
export function Petals({ reducedMotion }: { reducedMotion: boolean }) {
  const { season } = useSkyLook();
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new SphereGeometry(1, 6, 4);
    g.scale(0.06, 0.012, 0.04);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const drift = season.driftColors;
  const seeds = useMemo(() => {
    const r = rng(303);
    return Array.from({ length: COUNT }, () => {
      const side = r() > 0.5 ? 1 : -1;
      return {
        x: side * (4 + r() * 7),
        z: 4 + r() * 7,
        speed: 0.25 + r() * 0.3,
        phase: r() * 100,
        sway: 0.4 + r() * 0.8,
        color: drift[Math.floor(r() * drift.length)],
      };
    });
  }, [drift]);
  useEffect(() => {
    applyInstances(
      ref.current,
      seeds.map((s) => ({ position: [s.x, 5, s.z], color: s.color })),
    );
  }, [seeds]);

  const scratch = useMemo(
    () => ({ m: new Matrix4(), q: new Quaternion(), e: new Euler(), p: new Vector3(), s: new Vector3(1, 1, 1) }),
    [],
  );
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh || reducedMotion) return;
    const t = state.clock.elapsedTime;
    seeds.forEach((sd, i) => {
      // Fall 9.5 → 0.6 then wrap, so the drift is continuous.
      const life = (t * sd.speed + sd.phase) % 9;
      const y = 9.5 - life;
      scratch.p.set(sd.x + Math.sin(t * 0.7 + sd.phase) * sd.sway, y, sd.z + Math.cos(t * 0.5 + sd.phase) * 0.3);
      scratch.q.setFromEuler(scratch.e.set(t * 1.3 + sd.phase, t * 0.8, t * 1.1 + sd.phase));
      scratch.m.compose(scratch.p, scratch.q, scratch.s);
      mesh.setMatrixAt(i, scratch.m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, COUNT]} frustumCulled={false}>
      <meshStandardMaterial
        side={DoubleSide}
        roughness={0.6}
        emissive={season.cascadeEmissive}
        emissiveIntensity={0.45}
      />
    </instancedMesh>
  );
}
