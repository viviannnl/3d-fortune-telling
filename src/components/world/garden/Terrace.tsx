"use client";

import { useEffect, useMemo } from "react";
import {
  CanvasTexture,
  CatmullRomCurve3,
  ExtrudeGeometry,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import { Lantern } from "../Lantern";
import { CHAMPAGNE } from "../materials";
import { useLathe } from "../ornament";
import { bezierXZ, rng } from "./scatter";

/** Front edge of the terrace (XZ): it curves out toward the water at the centre. */
export const EDGE: { a: [number, number]; b: [number, number]; c: [number, number] } = {
  a: [-14, 6.2],
  b: [0, 0.6],
  c: [14, 6.2],
};
export const TERRACE_Y = 0.45;

/** Moonlit flagstones with grout lines and a scatter of fallen petals. */
function pavingTexture(): CanvasTexture {
  const size = 1024;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  const r = rng(41);
  if (ctx) {
    ctx.fillStyle = "#3d3658";
    ctx.fillRect(0, 0, size, size);
    const rows = 7;
    const h = size / rows;
    for (let row = 0; row < rows; row++) {
      let x = -r() * 120;
      while (x < size) {
        const w = 110 + r() * 150;
        const tone = 92 + r() * 34;
        ctx.fillStyle = `rgb(${tone * 0.86}, ${tone * 0.8}, ${tone * 1.08})`;
        ctx.fillRect(x + 4, row * h + 4, w - 8, h - 8);
        // Subtle wear inside each stone.
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`;
          ctx.beginPath();
          ctx.arc(x + r() * w, row * h + r() * h, 6 + r() * 26, 0, Math.PI * 2);
          ctx.fill();
        }
        x += w;
      }
    }
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = r() > 0.5 ? "rgba(233,190,230,0.75)" : "rgba(196,170,245,0.7)";
      ctx.beginPath();
      ctx.ellipse(r() * size, r() * size, 5 + r() * 5, 3 + r() * 3, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(0.16, 0.16);
  tex.anisotropy = 8;
  return tex;
}

/** Vase-shaped baluster. [radius, height] */
const BALUSTER: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.09, 0],
  [0.09, 0.06],
  [0.05, 0.12],
  [0.11, 0.3],
  [0.05, 0.5],
  [0.04, 0.58],
  [0.08, 0.64],
  [0.08, 0.7],
  [0, 0.7],
];

/** Stone urn for flowers. [radius, height] */
const URN: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.42, 0],
  [0.42, 0.1],
  [0.24, 0.2],
  [0.2, 0.4],
  [0.5, 0.65],
  [0.72, 0.95],
  [0.8, 1.15],
  [0.86, 1.22],
  [0.8, 1.26],
  [0.7, 1.24],
  [0, 1.2],
];

function edgePoint(t: number, inset = 0): [number, number] {
  const [x, z] = bezierXZ(EDGE.a, EDGE.b, EDGE.c, t);
  return [x, z + inset];
}

function Balustrade({ from, to }: { from: number; to: number }) {
  const baluster = useLathe(BALUSTER, 12);
  const { rail, posts, balusters } = useMemo(() => {
    const pts: Vector3[] = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const [x, z] = edgePoint(from + ((to - from) * i) / steps, 0.35);
      pts.push(new Vector3(x, TERRACE_Y + 0.74, z));
    }
    const rail = new TubeGeometry(new CatmullRomCurve3(pts), 64, 0.07, 6, false);
    const count = 26;
    const balusters = Array.from({ length: count }, (_, i) =>
      edgePoint(from + ((to - from) * (i + 0.5)) / count, 0.35),
    );
    const posts = [from, (from + to) / 2, to].map((t) => edgePoint(t, 0.35));
    return { rail, posts, balusters };
  }, [from, to]);
  useEffect(() => () => rail.dispose(), [rail]);

  return (
    <group>
      <mesh geometry={rail}>
        <meshStandardMaterial color="#a69cc6" roughness={0.6} metalness={0.1} />
      </mesh>
      {balusters.map(([x, z], i) => (
        <mesh key={i} geometry={baluster} position={[x, TERRACE_Y, z]}>
          <meshStandardMaterial color="#9a90bd" roughness={0.65} metalness={0.05} />
        </mesh>
      ))}
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, TERRACE_Y, z]}>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.28, 0.84, 0.28]} />
            <meshStandardMaterial color="#a69cc6" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.87, 0]}>
            <boxGeometry args={[0.36, 0.06, 0.36]} />
            <meshStandardMaterial {...CHAMPAGNE} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The viewer's vantage: a curved moonstone terrace with steps into the water, balustrades, urns and lanterns. */
export function Terrace({ reducedMotion }: { reducedMotion: boolean }) {
  const paving = useMemo(() => pavingTexture(), []);
  const urn = useLathe(URN, 32);
  const { slab, coping, steps } = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(EDGE.a[0], -EDGE.a[1]);
    shape.quadraticCurveTo(EDGE.b[0], -EDGE.b[1], EDGE.c[0], -EDGE.c[1]);
    shape.lineTo(EDGE.c[0], -22);
    shape.lineTo(EDGE.a[0], -22);
    shape.closePath();
    const slab = new ExtrudeGeometry(shape, {
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.06,
      bevelSegments: 2,
      curveSegments: 48,
    });
    slab.rotateX(-Math.PI / 2);
    slab.translate(0, TERRACE_Y - 0.6, 0);
    const edgePts: Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const [x, z] = edgePoint(i / 48);
      edgePts.push(new Vector3(x, TERRACE_Y + 0.02, z));
    }
    const coping = new TubeGeometry(new CatmullRomCurve3(edgePts), 128, 0.09, 6, false);
    // Two semicircular steps descending from the centre of the edge into the water.
    const [, centreZ] = edgePoint(0.5);
    const steps = [0, 1].map((i) => {
      const r = 2.4 + i * 0.75;
      const s = new Shape();
      s.absarc(0, 0, r, 0, Math.PI, false);
      s.lineTo(r, 0);
      const g = new ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 40 });
      g.rotateX(-Math.PI / 2);
      g.translate(0, TERRACE_Y - 0.22 - i * 0.2, centreZ + 0.2);
      return g;
    });
    return { slab, coping, steps };
  }, []);
  useEffect(
    () => () => {
      paving.dispose();
      slab.dispose();
      coping.dispose();
      steps.forEach((g) => g.dispose());
    },
    [paving, slab, coping, steps],
  );

  // The two front-of-terrace flower urns, also used by the flora layout.
  return (
    <group>
      <mesh geometry={slab}>
        <meshStandardMaterial map={paving} color="#ffffff" roughness={0.78} metalness={0.05} />
      </mesh>
      <mesh geometry={coping}>
        <meshStandardMaterial color="#b4abd3" roughness={0.55} />
      </mesh>
      {steps.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial map={paving} color="#d8d2ea" roughness={0.8} />
        </mesh>
      ))}
      <Balustrade from={0.04} to={0.33} />
      <Balustrade from={0.67} to={0.96} />
      {URNS.map(([x, z], i) => (
        <mesh key={i} geometry={urn} position={[x, TERRACE_Y, z]}>
          <meshStandardMaterial color="#a197c4" roughness={0.6} metalness={0.08} />
        </mesh>
      ))}
      {LANTERN_POSTS.map((t, i) => {
        const [x, z] = edgePoint(t, 0.35);
        return (
          <group key={i} position={[x, TERRACE_Y + 0.9, z]} scale={0.7}>
            <Lantern
              position={[0, 0, 0]}
              phase={i * 1.3}
              charm={i === 0 ? "lantern-left" : "lantern-right"}
              reducedMotion={reducedMotion}
            />
          </group>
        );
      })}
    </group>
  );
}

export const URNS: readonly [number, number][] = [
  [-6.6, 7.6],
  [6.6, 7.6],
];
const LANTERN_POSTS = [0.33, 0.67];

/** World position of each terrace lantern's glass (for charm hit areas). */
export function terraceLanternPosition(i: 0 | 1): [number, number, number] {
  const [x, z] = edgePoint(LANTERN_POSTS[i], 0.35);
  return [x, TERRACE_Y + 0.9 + 1.27 * 0.7, z];
}
