"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import {
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  Vector2,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { playSound } from "@/lib/audio/engine";
import { emitRipple } from "./garden/ripplePool";
import { useQuality } from "./quality";
import { useSkyLook } from "./skyContext";

/**
 * Tileable ripple normal map from many randomly oriented integer-frequency waves.
 * Enough directions that no single stripe pattern dominates (no assets needed).
 */
function createRippleNormals(size = 256): DataTexture {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const waves = Array.from({ length: 48 }, () => {
    let kx = 0;
    let ky = 0;
    while (kx === 0 && ky === 0) {
      kx = Math.round((rnd() - 0.5) * 36);
      ky = Math.round((rnd() - 0.5) * 36);
    }
    const k = Math.hypot(kx, ky);
    return { kx, ky, a: 1 / Math.pow(k, 1.15), p: rnd() * Math.PI * 2 };
  });
  const data = new Uint8Array(size * size * 4);
  const tau = Math.PI * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let dx = 0;
      let dy = 0;
      for (const w of waves) {
        const c = Math.cos((tau * (w.kx * x + w.ky * y)) / size + w.p) * w.a;
        dx += c * w.kx;
        dy += c * w.ky;
      }
      const nx = -dx * 0.09;
      const ny = -dy * 0.09;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.repeat.set(9, 5);
  tex.needsUpdate = true;
  return tex;
}

export function WaterSurface({ reducedMotion, resolution = 512 }: { reducedMotion: boolean; resolution?: number }) {
  const { mood } = useSkyLook();
  // The low tier skips the real-time reflection pass, which re-renders the whole scene.
  const low = useQuality() === "low";
  const normals = useMemo(() => createRippleNormals(), []);
  useEffect(() => () => normals.dispose(), [normals]);
  const normalScale = useMemo(() => new Vector2(0.17, 0.17), []);

  const mesh = useRef<Mesh>(null);
  const clock = useRef(0);

  useFrame((state, delta) => {
    clock.current = state.clock.elapsedTime;
    const map = (mesh.current?.material as MeshStandardMaterial | undefined)?.normalMap;
    if (reducedMotion || !map) return;
    map.offset.x += delta * 0.004;
    map.offset.y -= delta * 0.009;
  });

  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, -40]}
      receiveShadow={false}
      onClick={(e) => {
        e.stopPropagation();
        emitRipple(e.point.x, e.point.z, clock.current);
        playSound("ripple");
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <planeGeometry args={[420, 240]} />
      {low ? (
        <meshStandardMaterial
          color={mood.water}
          metalness={0.6}
          roughness={0.4}
          normalMap={normals}
          normalScale={normalScale}
        />
      ) : (
        <MeshReflectorMaterial
          resolution={resolution}
          blur={[180, 40]}
          mixBlur={0.7}
          mixStrength={3.0}
          mixContrast={1.0}
          mirror={0.92}
          depthScale={0}
          color={mood.water}
          metalness={0.5}
          roughness={0.58}
          normalMap={normals}
          normalScale={normalScale}
          distortionMap={normals}
          distortion={0.25}
          envMapIntensity={0.06}
        />
      )}
    </mesh>
  );
}
