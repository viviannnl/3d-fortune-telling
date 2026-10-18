"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CanvasTexture,
  LatheGeometry,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Vector2,
  type InstancedMesh,
} from "three";
import { PALETTE } from "@/lib/palette";

/**
 * Builds a lathe from [radius, height] pairs; used for beveled pedestals, plinths and columns.
 * Pass a module-level constant profile so the geometry is created once.
 */
export function useLathe(profile: readonly (readonly [number, number])[], segments = 48) {
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        profile.map(([r, y]) => new Vector2(r, y)),
        segments,
      ),
    [profile, segments],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

interface TickRingProps {
  radius: number;
  count: number;
  /** Every Nth tick is longer. */
  majorEvery?: number;
  length?: number;
  width?: number;
  /** "radial": ticks point outward in the ring plane; "axial": ticks stand perpendicular (engraved on a band face). */
  orientation?: "radial" | "axial";
  color?: string;
  emissive?: number;
}

/** Instanced engraved marks around a ring — degrees, solar terms, lunar mansions. One draw call. */
export function TickRing({
  radius,
  count,
  majorEvery = 0,
  length = 0.08,
  width = 0.012,
  orientation = "radial",
  color = "#d8cfa8",
  emissive = 0.25,
}: TickRingProps) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        metalness: 0.85,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: emissive,
      }),
    [color, emissive],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const major = majorEvery > 0 && i % majorEvery === 0;
      const len = length * (major ? 1.9 : 1);
      if (orientation === "radial") {
        d.position.set(Math.cos(a) * (radius + len / 2), 0, Math.sin(a) * (radius + len / 2));
        d.rotation.set(0, -a, 0);
        d.scale.set(len, width * 1.4, width * (major ? 1.6 : 1));
      } else {
        d.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
        d.rotation.set(0, -a, 0);
        d.scale.set(width * 1.2, len, width * (major ? 1.6 : 1));
      }
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count, radius, majorEvery, length, width, orientation]);
  return <instancedMesh ref={ref} args={[geometry, material, count]} />;
}

let starChart: CanvasTexture | null = null;
/**
 * Engraved celestial chart for the tarot table top: concentric rings, 28 mansion
 * divisions, a twelvefold ring, constellation linework, and a central star.
 */
export function starChartTexture(): CanvasTexture {
  if (starChart) return starChart;
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    const cx = size / 2;
    const bg = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    bg.addColorStop(0, "#2d2350");
    bg.addColorStop(0.7, "#1d1836");
    bg.addColorStop(1, "#141127");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    const silver = "rgba(214, 206, 236, 0.75)";
    const faint = "rgba(188, 166, 245, 0.35)";
    const ring = (r: number, w: number, s = silver) => {
      ctx.strokeStyle = s;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.stroke();
    };
    [500, 488, 430, 300, 292, 150].forEach((r, i) => ring(r, i % 2 ? 1.5 : 3));
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      ctx.strokeStyle = faint;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 300, cx + Math.sin(a) * 300);
      ctx.lineTo(cx + Math.cos(a) * 430, cx + Math.sin(a) * 430);
      ctx.stroke();
    }
    for (let i = 0; i < 360; i += 2) {
      const a = (i / 360) * Math.PI * 2;
      const l = i % 30 === 0 ? 22 : i % 10 === 0 ? 14 : 7;
      ctx.strokeStyle = silver;
      ctx.lineWidth = i % 30 === 0 ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 488, cx + Math.sin(a) * 488);
      ctx.lineTo(cx + Math.cos(a) * (488 - l), cx + Math.sin(a) * (488 - l));
      ctx.stroke();
    }
    // Constellation-like linework between deterministic stars.
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 9; k++) {
      const a0 = rnd() * Math.PI * 2;
      const r0 = 170 + rnd() * 110;
      let px = cx + Math.cos(a0) * r0;
      let py = cx + Math.sin(a0) * r0;
      ctx.strokeStyle = faint;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let j = 0; j < 3 + Math.floor(rnd() * 3); j++) {
        px += (rnd() - 0.5) * 70;
        py += (rnd() - 0.5) * 70;
        ctx.lineTo(px, py);
        ctx.fillStyle = PALETTE.moonlight;
        ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
      }
      ctx.stroke();
    }
    // Central eight-point star.
    ctx.fillStyle = "rgba(231, 221, 251, 0.5)";
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 120 : 26;
      ctx.lineTo(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  starChart = new CanvasTexture(c);
  starChart.colorSpace = SRGBColorSpace;
  starChart.anisotropy = 8;
  return starChart;
}
