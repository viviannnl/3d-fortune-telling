"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { introProgress, ramp } from "@/stores/intro";

/** Raises its children from `depth` below into place across the entrance window [from, to]. */
export function IntroRise({
  depth,
  from,
  to,
  children,
}: {
  depth: number;
  from: number;
  to: number;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    // Ease out: quick from the horizon, slowing as it settles.
    const t = ramp(introProgress(), from, to);
    g.position.y = -depth * (1 - t) ** 2;
  });
  return <group ref={group}>{children}</group>;
}
