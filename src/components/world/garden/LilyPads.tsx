"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CircleGeometry, type InstancedMesh } from "three";
import { applyInstances, rng, type Instance } from "./scatter";

/** Notched lily pads scattered on the water near the terrace, leaving the moon's path clear. */
export function LilyPads() {
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
        color: tone > 0.66 ? "#245a50" : tone > 0.33 ? "#1f4c5c" : "#2e6656",
      });
    }
    return out;
  }, []);
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => applyInstances(ref.current, items), [items]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} renderOrder={2}>
      <meshStandardMaterial roughness={0.45} metalness={0.1} emissive="#0f3a36" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
