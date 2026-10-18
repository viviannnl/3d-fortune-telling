"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from "three";
import { glowTexture } from "../glowTexture";
import { rng } from "./scatter";

const COUNT = 14;

/** A single wing: a soft rounded quad hinged at x=0, textured with a glow so it reads as luminous. */
function wingGeometry() {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute([0, -0.5, 0, 1, -0.5, 0, 1, 0.5, 0, 0, 0.5, 0], 3));
  g.setAttribute("uv", new Float32BufferAttribute([0.5, 0, 1, 0, 1, 1, 0.5, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

/** Glowing butterflies wandering over the flower beds; wings flap via per-instance transforms. */
export function Butterflies({ reducedMotion }: { reducedMotion: boolean }) {
  const left = useRef<InstancedMesh>(null);
  const right = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => wingGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const flock = useMemo(() => {
    const r = rng(808);
    return Array.from({ length: COUNT }, () => {
      const side = r() > 0.5 ? 1 : -1;
      return {
        cx: side * (5 + r() * 6),
        cz: 6 + r() * 5,
        cy: 1.2 + r() * 1.6,
        rx: 1 + r() * 1.6,
        rz: 0.6 + r() * 1.2,
        speed: 0.25 + r() * 0.3,
        phase: r() * 10,
        flap: 9 + r() * 5,
        size: 0.13 + r() * 0.08,
        color: ["#7fd8ff", "#ffb3f0", "#c9a8ff", "#9ff0e0"][Math.floor(r() * 4)],
      };
    });
  }, []);
  useEffect(() => {
    const c = new Color();
    flock.forEach((b, i) => {
      left.current?.setColorAt(i, c.set(b.color));
      right.current?.setColorAt(i, c.set(b.color));
    });
    if (left.current?.instanceColor) left.current.instanceColor.needsUpdate = true;
    if (right.current?.instanceColor) right.current.instanceColor.needsUpdate = true;
  }, [flock]);

  const s = useMemo(
    () => ({
      m: new Matrix4(),
      w: new Matrix4(),
      q: new Quaternion(),
      e: new Euler(),
      p: new Vector3(),
      sc: new Vector3(),
    }),
    [],
  );
  useFrame((state) => {
    const L = left.current;
    const R = right.current;
    if (!L || !R) return;
    const t = reducedMotion ? 2 : state.clock.elapsedTime;
    flock.forEach((b, i) => {
      const a = t * b.speed + b.phase;
      s.p.set(b.cx + Math.cos(a) * b.rx, b.cy + Math.sin(a * 2.3) * 0.35, b.cz + Math.sin(a) * b.rz);
      const heading = Math.atan2(Math.cos(a) * b.rz, -Math.sin(a) * b.rx);
      const flap = reducedMotion ? 0.4 : Math.sin(t * b.flap + b.phase) * 0.9;
      s.sc.setScalar(b.size);
      for (const [mesh, sign] of [
        [L, 1],
        [R, -1],
      ] as const) {
        s.q.setFromEuler(s.e.set(0, heading + (sign < 0 ? Math.PI : 0), sign * flap, "YXZ"));
        s.m.compose(s.p, s.q, s.sc);
        mesh.setMatrixAt(i, s.m);
      }
    });
    L.instanceMatrix.needsUpdate = true;
    R.instanceMatrix.needsUpdate = true;
  });

  const material = (
    <meshBasicMaterial
      map={glowTexture()}
      transparent
      blending={AdditiveBlending}
      depthWrite={false}
      side={DoubleSide}
      toneMapped={false}
    />
  );
  return (
    <group>
      <instancedMesh ref={left} args={[geometry, undefined, COUNT]} frustumCulled={false}>
        {material}
      </instancedMesh>
      <instancedMesh ref={right} args={[geometry, undefined, COUNT]} frustumCulled={false}>
        {material}
      </instancedMesh>
    </group>
  );
}
