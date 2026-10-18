"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, SRGBColorSpace, type Sprite } from "three";

/** Four-point flare: a soft core with long thin spikes. */
function flareTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    const mid = size / 2;
    const core = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.35);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, size, size);
    for (const [w, h] of [
      [size, 3],
      [3, size],
    ]) {
      const g = ctx.createLinearGradient(mid - w / 2, mid - h / 2, mid + w / 2, mid + h / 2);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(mid - w / 2, mid - h / 2, w, h);
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const STARS: { pos: [number, number, number]; size: number; phase: number }[] = [
  { pos: [-60, 120, -200], size: 14, phase: 0.2 },
  { pos: [-130, 80, -220], size: 10, phase: 1.4 },
  { pos: [40, 140, -230], size: 12, phase: 2.6 },
  { pos: [120, 100, -210], size: 16, phase: 3.9 },
  { pos: [-20, 60, -240], size: 8, phase: 4.4 },
  { pos: [85, 60, -230], size: 9, phase: 5.2 },
  { pos: [-95, 140, -190], size: 11, phase: 0.9 },
];

/** A handful of brighter flared stars to give the sky focal sparkle without clutter. */
export function SparkleStars({ reducedMotion }: { reducedMotion: boolean }) {
  const tex = useMemo(() => flareTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const refs = useRef<(Sprite | null)[]>([]);
  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((sp, i) => {
      if (!sp) return;
      const k = 0.8 + Math.sin(t * 0.7 + STARS[i].phase) * 0.2;
      sp.scale.setScalar(STARS[i].size * k);
    });
  });
  return (
    <group>
      {STARS.map((s, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={s.pos}
          scale={s.size}
        >
          <spriteMaterial
            map={tex}
            color="#e9e2ff"
            blending={AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.9}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  );
}
