"use client";

import { ExtrudeGeometry, Shape } from "three";

/** Shared per size and thickness for the page's lifetime (a handful of entries at most). */
const cache = new Map<string, ExtrudeGeometry>();

/** Rounded-rectangle card body with real thickness, so edges read as a physical card. */
export function cardBodyGeometry(w: number, h: number, thickness = 0.0028): ExtrudeGeometry {
  const key = `${w}:${h}:${thickness}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = w * 0.075;
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geo = new ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, -thickness / 2);
  cache.set(key, geo);
  return geo;
}
