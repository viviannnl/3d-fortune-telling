"use client";

import { useEffect, useMemo } from "react";
import { IcosahedronGeometry, LatheGeometry, Vector2 } from "three";
import { ANTIQUE_SILVER, CHAMPAGNE, OBSIDIAN } from "./materials";

interface FloatingIslandProps {
  radius: number;
  depth: number;
  seed?: number;
  /** Simpler rock-only island for distant decoration. */
  plain?: boolean;
}

function hash(n: number) {
  const x = Math.sin(n * 91.345) * 47453.5453;
  return x - Math.floor(x);
}

/** Faceted, tapering rock mass hanging under a terrace. */
function rockGeometry(radius: number, depth: number, seed: number, detail: number) {
  const g = new IcosahedronGeometry(1, detail);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const key = Math.round((x * 13.1 + y * 7.7 + z * 3.3) * 100) + seed * 997;
    const jag = 1 + 0.26 * (hash(key) - 0.5);
    if (y > 0) {
      y = 0;
    } else {
      const taper = 1 - Math.pow(-y, 1.45) * 0.86;
      x *= taper * jag;
      z *= taper * jag;
      y *= depth * (0.85 + 0.35 * hash(key + 1));
    }
    pos.setXYZ(i, x * radius, y, z * radius);
  }
  g.computeVertexNormals();
  return g;
}

/** Terrace edge with a beveled lip and an under-moulding. */
function terraceGeometry(r: number) {
  const profile: [number, number][] = [
    [0, 0.02],
    [r * 0.985, 0.02],
    [r, 0.0],
    [r, -0.16],
    [r * 0.97, -0.22],
    [r * 0.93, -0.24],
    [r * 0.93, -0.36],
    [r * 0.88, -0.42],
    [0, -0.42],
  ];
  return new LatheGeometry(
    profile.map(([x, y]) => new Vector2(x, y)),
    72,
  );
}

/**
 * A floating island: obsidian terrace with silver and champagne inlays over a
 * faceted rock mass with two smaller hanging outcrops.
 */
export function FloatingIsland({ radius, depth, seed = 1, plain = false }: FloatingIslandProps) {
  const geometries = useMemo(() => {
    const main = rockGeometry(radius * 0.92, depth, seed, plain ? 2 : 3);
    main.translate(0, -0.36, 0);
    const lumpA = rockGeometry(radius * 0.34, depth * 0.55, seed + 11, 2);
    lumpA.translate(radius * 0.42, -depth * 0.55, radius * 0.18);
    const lumpB = rockGeometry(radius * 0.26, depth * 0.45, seed + 23, 2);
    lumpB.translate(-radius * 0.38, -depth * 0.62, -radius * 0.2);
    return { main, lumpA, lumpB, terrace: terraceGeometry(radius) };
  }, [radius, depth, seed, plain]);

  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  return (
    <group>
      <mesh geometry={geometries.terrace}>
        <meshPhysicalMaterial {...OBSIDIAN} />
      </mesh>
      {!plain && (
        <>
          {/* Inlays: outer silver lip, inner champagne line, faint inner circle */}
          <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, 0.028, 6, 128]} />
            <meshStandardMaterial {...ANTIQUE_SILVER} />
          </mesh>
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 0.9, radius * 0.905, 128]} />
            <meshStandardMaterial {...CHAMPAGNE} />
          </mesh>
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 0.995, 0.012, 4, 128]} />
            <meshStandardMaterial {...CHAMPAGNE} />
          </mesh>
        </>
      )}
      <mesh geometry={geometries.main}>
        <meshStandardMaterial color="#2a2245" roughness={0.85} metalness={0.1} flatShading />
      </mesh>
      {!plain && (
        <>
          <mesh geometry={geometries.lumpA}>
            <meshStandardMaterial color="#251e3f" roughness={0.85} metalness={0.1} flatShading />
          </mesh>
          <mesh geometry={geometries.lumpB}>
            <meshStandardMaterial color="#251e3f" roughness={0.85} metalness={0.1} flatShading />
          </mesh>
        </>
      )}
    </group>
  );
}
