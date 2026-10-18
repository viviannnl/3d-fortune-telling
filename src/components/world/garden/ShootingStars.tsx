"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, Mesh, SRGBColorSpace, Vector3, type MeshBasicMaterial } from "three";
import { useCharms } from "@/stores/charms";

/** Horizontal streak: bright head fading to a long tail. */
function streakTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 16;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.85, "rgba(220,215,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 6, 256, 4);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(160, 7, 96, 2);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

interface Flight {
  start: Vector3;
  dir: Vector3;
  t0: number;
  duration: number;
}

const POOL = 14;

/** Occasional meteors across the upper sky; a shower when every charm has been found. */
export function ShootingStars({ reducedMotion }: { reducedMotion: boolean }) {
  const tex = useMemo(() => streakTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const meshes = useRef<(Mesh | null)[]>([]);
  const flights = useRef<(Flight | null)[]>(Array.from({ length: POOL }, () => null));
  const next = useRef(4);
  const celebrated = useRef(0);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    const launch = (delay = 0) => {
      const i = flights.current.findIndex((f) => f === null);
      if (i < 0) return;
      const start = new Vector3((Math.random() - 0.5) * 260, 70 + Math.random() * 70, -170 - Math.random() * 40);
      const dir = new Vector3(Math.random() > 0.5 ? -1 : 1, -0.42 - Math.random() * 0.2, 0).normalize();
      flights.current[i] = { start, dir, t0: t + delay, duration: 1.1 + Math.random() * 0.6 };
    };
    if (t > next.current) {
      launch();
      next.current = t + 7 + Math.random() * 8;
    }
    const seq = useCharms.getState().celebrateSeq;
    if (seq > celebrated.current) {
      celebrated.current = seq;
      for (let k = 0; k < 12; k++) launch(k * 0.35);
    }
    flights.current.forEach((f, i) => {
      const m = meshes.current[i];
      if (!m) return;
      if (!f || t < f.t0) {
        m.visible = false;
        return;
      }
      const u = (t - f.t0) / f.duration;
      if (u >= 1) {
        flights.current[i] = null;
        m.visible = false;
        return;
      }
      m.visible = true;
      m.position.copy(f.start).addScaledVector(f.dir, u * 140);
      m.rotation.z = Math.atan2(f.dir.y, f.dir.x);
      (m.material as MeshBasicMaterial).opacity = Math.sin(u * Math.PI);
    });
  });

  return (
    <group>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          visible={false}
          scale={[38, 2.4, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}
