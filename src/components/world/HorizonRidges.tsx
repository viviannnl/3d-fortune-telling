"use client";

import { useEffect, useMemo } from "react";
import { Shape, ShapeGeometry } from "three";

interface Ridge {
  z: number;
  base: number;
  amp: number;
  color: string;
  seed: number;
}

/** Far → near. Low at the centre so the moon rises clear of them. */
const RIDGES: Ridge[] = [
  { z: -150, base: 2, amp: 16, color: "#2b2560", seed: 1 },
  { z: -118, base: 0.5, amp: 11, color: "#221d4e", seed: 2 },
  { z: -92, base: -0.5, amp: 7, color: "#1a173f", seed: 3 },
];

function height(x: number, r: Ridge) {
  const side = Math.min(1, Math.pow(Math.abs(x) / 110, 1.4) + 0.12);
  const n =
    Math.sin(x * 0.045 + r.seed * 3.1) * 0.5 +
    Math.sin(x * 0.11 + r.seed * 7.7) * 0.3 +
    Math.sin(x * 0.27 + r.seed * 1.3) * 0.12 +
    Math.sin(x * 0.61 + r.seed * 5.9) * 0.05;
  return r.base + r.amp * side * (0.65 + n * 0.5);
}

function ridgeGeometry(r: Ridge) {
  const shape = new Shape();
  const half = 340;
  shape.moveTo(-half, -6);
  for (let x = -half; x <= half; x += 3) shape.lineTo(x, height(x, r));
  shape.lineTo(half, -6);
  shape.closePath();
  return new ShapeGeometry(shape);
}

/** Layered mountain silhouettes on the horizon for depth; the moon rises above their low middle. */
export function HorizonRidges() {
  const geometries = useMemo(() => RIDGES.map(ridgeGeometry), []);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  return (
    <group>
      {RIDGES.map((r, i) => (
        <mesh key={r.seed} geometry={geometries[i]} position={[0, 0, r.z]}>
          <meshBasicMaterial color={r.color} fog={false} />
        </mesh>
      ))}
    </group>
  );
}
