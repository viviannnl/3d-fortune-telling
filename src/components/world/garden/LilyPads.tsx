"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CircleGeometry, Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from "three";
import { useSkyLook } from "../skyContext";
import { rippleLiftAt } from "./ripplePool";
import { applyInstances, rng, type Instance } from "./scatter";

/** Notched lily pads scattered on the water near the terrace, leaving the moon's path clear. */
export function LilyPads() {
  const { season } = useSkyLook();
  const geometry = useMemo(() => {
    const g = new CircleGeometry(1, 24, 0.25, Math.PI * 2 - 0.5);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const items = useMemo(() => {
    const r = rng(23);
    const out: Instance[] = [];
    while (out.length < 90) {
      const x = (r() - 0.5) * 30;
      const z = 3.5 - r() * 22;
      if (Math.abs(x) < 2.6 + (3.5 - z) * 0.05) continue; // keep the reflection path open
      const tone = r();
      out.push({
        position: [x, 0.025 + r() * 0.01, z],
        rotation: [0, r() * 6.3, 0],
        scale: 0.35 + r() * 0.5,
        color: season.pads[tone > 0.66 ? 0 : tone > 0.33 ? 1 : 2],
      });
    }
    return out;
  }, [season]);
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => applyInstances(ref.current, items), [items]);

  // Pads rise and tilt as a ripple passes under them.
  const scratch = useMemo(
    () => ({ m: new Matrix4(), q: new Quaternion(), e: new Euler(), p: new Vector3(), s: new Vector3() }),
    [],
  );
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const now = state.clock.elapsedTime;
    items.forEach((it, i) => {
      const [x, y, z] = it.position;
      const lift = rippleLiftAt(x, z, now);
      const tiltX = rippleLiftAt(x, z + 0.4, now) - rippleLiftAt(x, z - 0.4, now);
      const tiltZ = rippleLiftAt(x + 0.4, z, now) - rippleLiftAt(x - 0.4, z, now);
      scratch.p.set(x, y + lift, z);
      scratch.q.setFromEuler(scratch.e.set(tiltX * 2.2, (it.rotation ?? [0, 0, 0])[1], -tiltZ * 2.2));
      scratch.s.setScalar(typeof it.scale === "number" ? it.scale : 1);
      scratch.m.compose(scratch.p, scratch.q, scratch.s);
      mesh.setMatrixAt(i, scratch.m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} renderOrder={2}>
      <meshStandardMaterial roughness={0.45} metalness={0.1} emissive="#0f3a36" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
