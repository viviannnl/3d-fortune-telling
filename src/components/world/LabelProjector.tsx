"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { labelEntries } from "./labelRegistry";

export function LabelProjector() {
  const v = useRef(new Vector3());

  useFrame(({ camera, size }) => {
    for (const [, { el, anchor, lift }] of labelEntries()) {
      if (!el) continue;
      if (!anchor) {
        el.style.visibility = "hidden";
        continue;
      }
      anchor.getWorldPosition(v.current);
      v.current.y += lift;
      const p = v.current.project(camera);
      const visible = p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2;
      el.style.visibility = visible ? "visible" : "hidden";
      el.style.transform = `translate3d(${((p.x + 1) / 2) * size.width}px, ${((1 - p.y) / 2) * size.height}px, 0) translate(-50%, -50%)`;
    }
  });

  return null;
}
