"use client";

import { CanvasTexture, SRGBColorSpace } from "three";

let shared: CanvasTexture | null = null;

/** Soft radial falloff used for glows, motes, and halos. Shared for the page's lifetime. */
export function glowTexture(): CanvasTexture {
  if (shared) return shared;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.45)");
    g.addColorStop(0.55, "rgba(255,255,255,0.1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  shared = new CanvasTexture(canvas);
  shared.colorSpace = SRGBColorSpace;
  return shared;
}
