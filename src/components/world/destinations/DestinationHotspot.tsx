"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { PALETTE } from "@/lib/palette";
import { playSound } from "@/lib/audio/engine";
import { useExperience, type DestinationId } from "@/stores/experience";
import type { Vec3 } from "../layout";
import { DestinationContext } from "./DestinationContext";
import { registerAnchor } from "../labelRegistry";

interface DestinationHotspotProps {
  id: DestinationId;
  position: Vec3;
  labelHeight: number;
  /** Radius of the invisible hit volume and the entry pulse. */
  radius: number;
  reducedMotion: boolean;
  children: ReactNode;
}

const PULSE_SECONDS = 1.4;

/**
 * Wraps a destination's 3D object with hover/click behaviour, a damped glow
 * signal for its children, and an entry pulse ring.
 */
export function DestinationHotspot({
  id,
  position,
  labelHeight,
  radius,
  reducedMotion,
  children,
}: DestinationHotspotProps) {
  const lift = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  const glow = useRef(0);
  const pulseStart = useRef<number | null>(null);
  const signals = useMemo(() => ({ glow }), []);

  const hovered = useExperience((s) => s.hovered === id);
  const inSanctuary = useExperience((s) => s.view === "sanctuary");
  const isHere = useExperience((s) => s.view === id);
  const enterSeq = useExperience((s) => (s.lastEnter?.id === id ? s.lastEnter.seq : 0));

  useEffect(() => {
    if (enterSeq > 0) pulseStart.current = -1; // resolved to clock time on next frame
  }, [enterSeq]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    const target = hovered ? 1 : isHere ? 0.6 : 0;
    glow.current = MathUtils.damp(glow.current, target, 4, delta);
    if (lift.current) {
      const y = reducedMotion ? 0 : glow.current * 0.25 * (isHere ? 0 : 1);
      lift.current.position.y = y;
    }

    const ring = pulse.current;
    if (!ring) return;
    if (pulseStart.current === -1) pulseStart.current = state.clock.elapsedTime;
    const start = pulseStart.current;
    const t = start === null ? 1 : (state.clock.elapsedTime - start) / PULSE_SECONDS;
    if (t >= 1) {
      ring.visible = false;
      pulseStart.current = null;
      return;
    }
    ring.visible = true;
    const eased = 1 - Math.pow(1 - t, 3);
    // Reduced motion: the ring fades in place instead of expanding.
    ring.scale.setScalar(radius * (reducedMotion ? 1.2 : 0.4 + eased * 1.6));
    (ring.material as MeshBasicMaterial).opacity = 0.55 * (1 - t);
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!inSanctuary) return;
    e.stopPropagation();
    if (useExperience.getState().hovered !== id) playSound("hover");
    useExperience.getState().setHovered(id);
  };
  const onOut = () => {
    if (useExperience.getState().hovered === id) useExperience.getState().setHovered(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!inSanctuary) return;
    e.stopPropagation();
    if (useExperience.getState().enter(id)) playSound("enter");
  };

  return (
    <group position={position}>
      {/* Name-tag anchor, projected into the HTML overlay. */}
      <object3D position={[0, labelHeight, 0]} ref={(o) => registerAnchor(`destination:${id}`, o)} />
      <DestinationContext.Provider value={signals}>
        <group ref={lift}>{children}</group>
      </DestinationContext.Provider>

      {/* Generous invisible hit volume so the whole destination is easy to target. */}
      <mesh
        position={[0, labelHeight * 0.45, 0]}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
        visible={false}
      >
        <cylinderGeometry args={[radius, radius * 0.8, labelHeight * 1.2, 16]} />
        <meshBasicMaterial />
      </mesh>

      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} visible={false}>
        <ringGeometry args={[0.96, 1, 96]} />
        <meshBasicMaterial color={PALETTE.lavender} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
