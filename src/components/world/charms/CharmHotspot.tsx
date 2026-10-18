"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { AdditiveBlending, type Sprite } from "three";
import { playSound } from "@/lib/audio/engine";
import { useCharms, type CharmId } from "@/stores/charms";
import { useExperience } from "@/stores/experience";
import { glowTexture } from "../glowTexture";
import type { Vec3 } from "../layout";

interface CharmHotspotProps {
  id: CharmId;
  position: Vec3;
  radius: number;
  /** Where the inviting twinkle sits, relative to `position`. */
  hint?: Vec3;
  /** Twinkle size relative to the radius. */
  hintScale?: number;
  color?: string;
  reducedMotion: boolean;
}

/**
 * An invisible, clickable charm with a faint breathing twinkle as a hint.
 * Clicking it reveals a blessing (HTML) and a sparkle burst (3D).
 */
export function CharmHotspot({
  id,
  position,
  radius,
  hint,
  hintScale = 0.55,
  color = "#efe4ff",
  reducedMotion,
}: CharmHotspotProps) {
  const sprite = useRef<Sprite>(null);
  const hovered = useRef(false);
  const phase = useRef(id.length * 1.37);

  useFrame((state, delta) => {
    const sp = sprite.current;
    if (!sp) return;
    const inSanctuary = useExperience.getState().view === "sanctuary";
    const found = useCharms.getState().found.includes(id);
    const t = state.clock.elapsedTime;
    // Undiscovered charms breathe a little brighter, inviting a click.
    const base = inSanctuary ? (found ? 0.16 : 0.3) : 0;
    const pulse =
      inSanctuary && !reducedMotion ? (Math.sin(t * 1.4 + phase.current) * 0.5 + 0.5) * (found ? 0.08 : 0.3) : 0;
    const target = base + pulse + (hovered.current ? 0.55 : 0);
    const m = sp.material;
    m.opacity += (target - m.opacity) * Math.min(1, delta * 6);
    sp.scale.setScalar(radius * hintScale * (hovered.current ? 1.35 : 1));
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (useExperience.getState().view !== "sanctuary") return;
    e.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (!hovered.current) return;
    hovered.current = false;
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (useExperience.getState().view !== "sanctuary") return;
    e.stopPropagation();
    useCharms
      .getState()
      .touch(id, [e.point.x, e.point.y, e.point.z], { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }, color);
    playSound("blessing");
  };

  return (
    <group position={position}>
      <mesh visible={false} onPointerOver={over} onPointerOut={out} onClick={click}>
        <sphereGeometry args={[radius, 10, 8]} />
        <meshBasicMaterial />
      </mesh>
      <sprite ref={sprite} position={hint ?? [0, 0, 0]} renderOrder={4}>
        <spriteMaterial
          map={glowTexture()}
          color={color}
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0}
          fog={false}
        />
      </sprite>
    </group>
  );
}
