"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  AdditiveBlending,
  ExtrudeGeometry,
  LatheGeometry,
  MathUtils,
  Path,
  Shape,
  Vector2,
  type Group,
  type MeshPhysicalMaterial,
} from "three";
import { glowTexture } from "@/components/world/glowTexture";
import { ELEMENTS, type ElementId } from "@/features/destiny/symbols";
import { elementVisual } from "@/features/destiny/visualMapping";
import type { ChartResult } from "@/features/destiny/types";
import { MUTED_GOLD } from "@/components/world/materials";
import { registerAnchor } from "@/components/world/labelRegistry";
import { playElementTone } from "@/lib/audio/engine";
import { useDestiny } from "@/stores/destiny";
import { ELEMENT_COLOR } from "./elementStyle";

/** A shallow arc in front of the sphere, left → right in generating-cycle order (木→火→土→金→水). */
const POSITIONS: Record<ElementId, [number, number, number]> = {
  wood: [-2.85, 0.1, 0.25],
  fire: [-1.8, -0.45, 1.2],
  earth: [0, -0.7, 1.45],
  metal: [1.8, -0.45, 1.2],
  water: [2.85, 0.1, 0.25],
};

const STAGGER = 0.32;

/** Per-element surface response: jade, ember, sandstone, polished silver, glass water. */
function ElementMaterial({ element }: { element: ElementId }) {
  const color = ELEMENT_COLOR[element];
  const finish = {
    wood: {
      metalness: 0.05,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      sheen: 0.6,
      sheenColor: "#d8f2e2",
    },
    fire: { metalness: 0, roughness: 0.35, clearcoat: 0.4 },
    earth: { metalness: 0.08, roughness: 0.78 },
    metal: { metalness: 1, roughness: 0.16 },
    water: { metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 },
  }[element];
  return <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent {...finish} />;
}

let coinGeometry: ExtrudeGeometry | null = null;
/** Ancient round coin with a square hole (圆形方孔). */
function coin(): ExtrudeGeometry {
  if (coinGeometry) return coinGeometry;
  const s = new Shape();
  s.absarc(0, 0, 0.34, 0, Math.PI * 2, false);
  const hole = new Path();
  const h = 0.09;
  hole.moveTo(-h, -h);
  hole.lineTo(-h, h);
  hole.lineTo(h, h);
  hole.lineTo(h, -h);
  hole.lineTo(-h, -h);
  s.holes.push(hole);
  coinGeometry = new ExtrudeGeometry(s, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 48,
  });
  coinGeometry.center();
  return coinGeometry;
}

let dropGeometry: LatheGeometry | null = null;
/** Teardrop: round belly rising to a soft point. */
function droplet(): LatheGeometry {
  if (dropGeometry) return dropGeometry;
  const pts: Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const y = -0.28 + t * 0.66;
    const r = t < 0.55 ? Math.sin((t / 0.55) * (Math.PI / 2)) * 0.25 : 0.25 * Math.pow(1 - (t - 0.55) / 0.45, 1.6);
    pts.push(new Vector2(Math.max(r, 0.0001), y));
  }
  dropGeometry = new LatheGeometry(pts, 40);
  return dropGeometry;
}

function ElementGeometry({ element, mat }: { element: ElementId; mat: ReactNode }) {
  switch (element) {
    case "wood":
      // Jade bamboo: three segmented stalks with node rings and two leaves.
      return (
        <group position={[0, -0.45, 0]}>
          {(
            [
              [0, 0, 1.0, 0.07],
              [-0.16, 0.06, 0.72, 0.055],
              [0.15, -0.05, 0.84, 0.05],
            ] as const
          ).map(([x, z, h, r], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[r * 0.92, r, h, 12]} />
                {mat}
              </mesh>
              {[0.3, 0.6, 0.9]
                .filter((f) => f * 1.0 < h)
                .map((f) => (
                  <mesh key={f} position={[0, f, 0]}>
                    <torusGeometry args={[r * 1.02, r * 0.18, 6, 16]} />
                    {mat}
                  </mesh>
                ))}
            </group>
          ))}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.12, 0.74, 0]}
              rotation={[0, 0, side * -1.0]}
              scale={[0.05, 0.22, 0.012]}
            >
              <sphereGeometry args={[1, 12, 8]} />
              {mat}
            </mesh>
          ))}
        </group>
      );
    case "fire":
      // Ember flame: an outer faceted flame with a brighter twisted core.
      return (
        <group>
          <mesh scale={[0.28, 0.58, 0.28]}>
            <octahedronGeometry args={[1, 1]} />
            {mat}
          </mesh>
          <mesh scale={[0.15, 0.36, 0.15]} position={[0, -0.06, 0]} rotation={[0, Math.PI / 4, 0]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#ffd9b8" toneMapped={false} />
          </mesh>
          <sprite scale={1.1}>
            <spriteMaterial
              map={glowTexture()}
              color="#f2a48e"
              blending={AdditiveBlending}
              depthWrite={false}
              transparent
              opacity={0.45}
            />
          </sprite>
        </group>
      );
    case "earth":
      // Sandstone plinth in two chamfered steps with a champagne band.
      return (
        <group position={[0, -0.18, 0]}>
          <RoundedBox args={[0.6, 0.22, 0.6]} radius={0.04} smoothness={3}>
            {mat}
          </RoundedBox>
          <RoundedBox args={[0.4, 0.2, 0.4]} radius={0.035} smoothness={3} position={[0, 0.2, 0]}>
            {mat}
          </RoundedBox>
          <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
            <torusGeometry args={[0.425, 0.01, 4, 4]} />
            <meshStandardMaterial {...MUTED_GOLD} />
          </mesh>
        </group>
      );
    case "metal":
      // An ancient silver coin turning on its axis.
      return <mesh geometry={coin()}>{mat}</mesh>;
    case "water":
      // A glass droplet over two faint ripple rings.
      return (
        <group>
          <mesh geometry={droplet()}>{mat}</mesh>
          {[0.32, 0.46].map((r) => (
            <mesh key={r} position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.006, 4, 64]} />
              <meshBasicMaterial color={ELEMENT_COLOR.water} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      );
  }
}

interface ElementObjectProps {
  element: ElementId;
  count: number;
  dayMaster: ElementId;
  revealAt: React.RefObject<number>;
  index: number;
  interactive: boolean;
  reducedMotion: boolean;
}

function ElementObject({ element, count, dayMaster, revealAt, index, interactive, reducedMotion }: ElementObjectProps) {
  const outer = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const hovered = useRef(false);
  const selected = useDestiny((s) => s.selection?.kind === "element" && s.selection.id === element);
  const visual = elementVisual(count, element, dayMaster);
  useEffect(
    () => () => {
      if (hovered.current) document.body.style.cursor = "";
    },
    [],
  );

  useFrame((state, delta) => {
    const g = outer.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const start = revealAt.current + (reducedMotion ? 0 : index * STAGGER);
    const appeared = t >= start;
    const target = appeared ? visual.scale * (hovered.current || selected ? 1.12 : 1) : 0.0001;
    g.scale.setScalar(MathUtils.damp(g.scale.x, target, reducedMotion ? 30 : 5, dt));
    const [x, y, z] = POSITIONS[element];
    const rise = appeared ? 0 : -0.8;
    g.position.set(
      x,
      MathUtils.damp(g.position.y, y + rise + (reducedMotion ? 0 : Math.sin(t * 0.7 + index) * 0.05), 4, dt),
      z,
    );
    if (spin.current && !reducedMotion) spin.current.rotation.y += dt * 0.4;
    if (ring.current) ring.current.rotation.z += dt * 0.6;

    g.traverse((o) => {
      const m = (o as { material?: MeshPhysicalMaterial }).material;
      if (!m || !("emissiveIntensity" in m)) return;
      const glow = visual.glow * (hovered.current || selected ? 1.8 : 1);
      m.emissiveIntensity = MathUtils.damp(m.emissiveIntensity, glow, 6, dt);
      m.opacity = visual.present ? 0.95 : 0.28;
      m.wireframe = !visual.present;
    });
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    hovered.current = false;
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    const { select, selection } = useDestiny.getState();
    const isSame = selection?.kind === "element" && selection.id === element;
    select(isSame ? null : { kind: "element", id: element });
    playElementTone(element);
  };

  return (
    <group
      ref={outer}
      position={POSITIONS[element]}
      scale={0.0001}
      onPointerOver={over}
      onPointerOut={out}
      onClick={click}
    >
      <object3D position={[0, -0.8, 0]} ref={(o) => registerAnchor(`element:${element}`, o, -0.05)} />
      <group ref={spin}>
        <ElementGeometry element={element} mat={<ElementMaterial element={element} />} />
      </group>
      {visual.isDayMaster && (
        <group ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.62, 0.012, 6, 96]} />
            <meshStandardMaterial {...MUTED_GOLD} emissive={MUTED_GOLD.color} emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}
      {/* Generous invisible hit target */}
      <mesh visible={false}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

export function FiveElements3D({
  chart,
  revealAt,
  interactive,
  reducedMotion,
}: {
  chart: ChartResult;
  revealAt: React.RefObject<number>;
  interactive: boolean;
  reducedMotion: boolean;
}) {
  return (
    <group>
      {ELEMENTS.map((el, i) => (
        <ElementObject
          key={el}
          element={el}
          index={i}
          count={chart.elementCounts[el]}
          dayMaster={chart.dayMaster.element}
          revealAt={revealAt}
          interactive={interactive}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
