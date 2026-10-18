"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  Color,
  Euler,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useQuality } from "../quality";
import { useSkyLook } from "../skyContext";
import { applyInstances, rng, type Instance } from "./scatter";

let raceme: BufferGeometry | null = null;
/** One hanging flower cluster: florets on a cone that tapers downward from y=0 to y=-1. */
function racemeGeometry() {
  if (raceme) return raceme;
  const r = rng(77);
  const parts: BufferGeometry[] = [];
  const deep = new Color("#9d5cff");
  const pale = new Color("#f6e6ff");
  const tmp = new Color();
  for (let i = 0; i < 64; i++) {
    const t = i / 63;
    const radius = 0.14 * (1 - t) + 0.02;
    const a = i * 2.39996; // golden angle
    const g = new SphereGeometry(0.042 * (1 - t * 0.45), 6, 4);
    g.applyMatrix4(new Matrix4().makeTranslation(Math.cos(a) * radius, -t + (r() - 0.5) * 0.03, Math.sin(a) * radius));
    // Deep violet at the top fading to pale near the tip, as wisteria does.
    tmp.copy(deep).lerp(pale, Math.pow(t, 1.3));
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) colors.set([tmp.r, tmp.g, tmp.b], k * 3);
    g.setAttribute("color", new BufferAttribute(colors, 3));
    parts.push(g);
  }
  raceme = mergeGeometries(parts) ?? parts[0];
  parts.forEach((g) => g !== raceme && g.dispose());
  return raceme;
}

let leafGeo: BufferGeometry | null = null;
function leaf() {
  if (!leafGeo) {
    leafGeo = new SphereGeometry(1, 6, 4);
    leafGeo.applyMatrix4(new Matrix4().makeScale(0.07, 0.2, 0.014));
    leafGeo.applyMatrix4(new Matrix4().makeTranslation(0, -0.2, 0));
  }
  return leafGeo;
}

interface Strand extends Instance {
  phase: number;
  length: number;
}

function strands(
  side: -1 | 1,
  seed: number,
  count: number,
  leafColors: readonly string[],
): { flowers: Strand[]; leaves: Instance[] } {
  const r = rng(seed);
  const flowers: Strand[] = [];
  const leaves: Instance[] = [];
  for (let i = 0; i < count; i++) {
    // Denser toward the outer edge of the frame, thinning toward the centre.
    const u = Math.pow(r(), 0.8);
    const x = side * (11.5 - u * 7.4);
    const z = 5.5 + r() * 5;
    const y = 9.3 + r() * 1.4 - (1 - u) * 0.8;
    const length = 1.3 + r() * 2.2 * (0.45 + u * 0.55);
    flowers.push({
      position: [x, y, z],
      rotation: [(r() - 0.5) * 0.15, r() * 6.3, (r() - 0.5) * 0.15],
      scale: [1, length, 1],
      color: "#ffffff",
      phase: r() * 6.3,
      length,
    });
    for (let k = 0; k < 2; k++) {
      leaves.push({
        position: [x + (r() - 0.5) * 0.5, y + 0.1 + r() * 0.3, z + (r() - 0.5) * 0.5],
        rotation: [(r() - 0.5) * 1.2, r() * 6.3, (r() - 0.5) * 1.2],
        scale: 0.8 + r() * 0.8,
        color: leafColors[Math.floor(r() * leafColors.length)],
      });
    }
  }
  return { flowers, leaves };
}

const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const p = new Vector3();
const s = new Vector3();

/** Wisteria cascading into the top corners of the frame, swaying very slightly. */
export function Wisteria({ reducedMotion }: { reducedMotion: boolean }) {
  const { season } = useSkyLook();
  const low = useQuality() === "low";
  const data = useMemo(() => {
    const n = low ? 32 : 72;
    const L = strands(-1, 5, n, season.leaves);
    const R = strands(1, 9, n, season.leaves);
    return { flowers: [...L.flowers, ...R.flowers], leaves: [...L.leaves, ...R.leaves] };
  }, [low, season]);
  const flowers = useRef<InstancedMesh>(null);
  const leaves = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    applyInstances(flowers.current, data.flowers);
    applyInstances(leaves.current, data.leaves);
  }, [data]);

  useFrame((state) => {
    const mesh = flowers.current;
    if (!mesh || reducedMotion || low) return;
    const t = state.clock.elapsedTime;
    data.flowers.forEach((f, i) => {
      const [rx, ry, rz] = f.rotation ?? [0, 0, 0];
      const sway = Math.sin(t * 0.55 + f.phase) * 0.035;
      q.setFromEuler(e.set(rx + sway, ry, rz + sway * 0.6));
      p.set(...f.position);
      s.set(1, f.length, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={leaves} args={[leaf(), undefined, data.leaves.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.7} emissive="#103a3a" emissiveIntensity={0.45} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[racemeGeometry(), undefined, data.flowers.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} emissive={season.cascadeEmissive} emissiveIntensity={0.95} />
      </instancedMesh>
    </group>
  );
}
