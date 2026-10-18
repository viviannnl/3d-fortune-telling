"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { CylinderGeometry, Matrix4, SphereGeometry, type BufferGeometry, type InstancedMesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useQuality } from "../quality";
import { applyInstances, rng, type Instance } from "./scatter";

export interface Clump {
  center: [number, number, number];
  radius: number;
  lavender?: number;
  flowers?: number;
  leaves?: number;
  /** Overall plant scale. */
  size?: number;
}

const FLOWER_COLORS = ["#ff9ad5", "#f26cc6", "#c48cff", "#fff4fb", "#ffb8e8", "#a679ff", "#ff7fb8"];
const LEAF_COLORS = ["#24564f", "#2a4d63", "#1f4a5a", "#2f6058"];

let shared: { petals: BufferGeometry; spike: BufferGeometry; stem: BufferGeometry; leaf: BufferGeometry } | null = null;
function geometries() {
  if (shared) return shared;
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) {
    const g = new SphereGeometry(1, 8, 6);
    g.applyMatrix4(new Matrix4().makeScale(0.42, 0.1, 0.85));
    g.applyMatrix4(new Matrix4().makeTranslation(0, 0, 0.6));
    g.applyMatrix4(new Matrix4().makeRotationX(-0.45));
    g.applyMatrix4(new Matrix4().makeRotationY((k / 6) * Math.PI * 2));
    parts.push(g);
  }
  const centre = new SphereGeometry(0.28, 8, 6);
  centre.applyMatrix4(new Matrix4().makeTranslation(0, 0.12, 0));
  parts.push(centre);
  const petals = mergeGeometries(parts) ?? parts[0];
  parts.forEach((g) => g !== petals && g.dispose());

  // Lavender: whorls of tiny florets up the top of the stem, tapering to the tip.
  const florets: BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const a = i * 2.39996;
    const r = 0.022 * (1 - t * 0.6);
    const f = new SphereGeometry(0.017 * (1 - t * 0.4), 5, 4);
    f.applyMatrix4(new Matrix4().makeTranslation(Math.cos(a) * r, 0.47 + t * 0.26, Math.sin(a) * r));
    florets.push(f);
  }
  const spike = mergeGeometries(florets) ?? florets[0];
  florets.forEach((g) => g !== spike && g.dispose());
  const stem = new CylinderGeometry(0.007, 0.01, 0.5, 4);
  stem.applyMatrix4(new Matrix4().makeTranslation(0, 0.25, 0));
  const leaf = new SphereGeometry(1, 6, 5);
  leaf.applyMatrix4(new Matrix4().makeScale(0.05, 0.3, 0.012));
  leaf.applyMatrix4(new Matrix4().makeTranslation(0, 0.26, 0));
  shared = { petals, spike, stem, leaf };
  return shared;
}

function scatter(clumps: readonly Clump[], seed: number, density: number) {
  const r = rng(seed);
  const lavender: Instance[] = [];
  const flowers: Instance[] = [];
  const leaves: Instance[] = [];
  const at = (c: Clump): [number, number, number] => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * c.radius;
    return [c.center[0] + Math.cos(a) * d, c.center[1], c.center[2] + Math.sin(a) * d];
  };
  for (const c of clumps) {
    const k = c.size ?? 1;
    for (let i = 0; i < Math.round((c.lavender ?? 0) * density); i++) {
      lavender.push({
        position: at(c),
        rotation: [(r() - 0.5) * 0.35, r() * 6.3, (r() - 0.5) * 0.35],
        scale: k * (0.8 + r() * 0.7),
      });
    }
    for (let i = 0; i < Math.round((c.flowers ?? 0) * density); i++) {
      const [x, y, z] = at(c);
      flowers.push({
        position: [x, y + k * (0.18 + r() * 0.35), z],
        rotation: [(r() - 0.5) * 0.9, r() * 6.3, (r() - 0.5) * 0.9],
        scale: k * (0.09 + r() * 0.1),
        color: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)],
      });
    }
    for (let i = 0; i < Math.round((c.leaves ?? 0) * density); i++) {
      leaves.push({
        position: at(c),
        rotation: [(r() - 0.5) * 1.6, r() * 6.3, (r() - 0.5) * 1.6],
        scale: k * (0.7 + r() * 0.8),
        color: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
      });
    }
  }
  return { lavender, flowers, leaves };
}

/**
 * Instanced flower beds: lavender spikes, six-petal blossoms, and leafy mass beneath.
 * Geometry is shared module-wide for the page lifetime; four draw calls per bed.
 */
export function Flora({ clumps, seed = 1 }: { clumps: readonly Clump[]; seed?: number }) {
  const g = geometries();
  const density = useQuality() === "high" ? 1 : 0.4;
  const items = useMemo(() => scatter(clumps, seed, density), [clumps, seed, density]);
  const spikes = useRef<InstancedMesh>(null);
  const stems = useRef<InstancedMesh>(null);
  const blossoms = useRef<InstancedMesh>(null);
  const leaves = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    applyInstances(spikes.current, items.lavender);
    applyInstances(stems.current, items.lavender);
    applyInstances(blossoms.current, items.flowers);
    applyInstances(leaves.current, items.leaves);
  }, [items]);

  return (
    <group>
      <instancedMesh ref={leaves} args={[g.leaf, undefined, Math.max(1, items.leaves.length)]}>
        <meshStandardMaterial roughness={0.65} metalness={0} emissive="#103a3a" emissiveIntensity={0.45} />
      </instancedMesh>
      <instancedMesh ref={stems} args={[g.stem, undefined, Math.max(1, items.lavender.length)]}>
        <meshStandardMaterial color="#3b6a5e" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={spikes} args={[g.spike, undefined, Math.max(1, items.lavender.length)]}>
        <meshStandardMaterial color="#a879ff" emissive="#8a4dff" emissiveIntensity={0.75} roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={blossoms} args={[g.petals, undefined, Math.max(1, items.flowers.length)]}>
        <meshStandardMaterial roughness={0.5} emissive="#e98be0" emissiveIntensity={0.35} />
      </instancedMesh>
    </group>
  );
}
