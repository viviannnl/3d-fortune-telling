"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Object3D, SphereGeometry, type InstancedMesh, type Points } from "three";
import { BufferAttribute, BufferGeometry } from "three";
import { registerAnchor } from "../labelRegistry";
import { glowTexture } from "../glowTexture";
import { useWishes } from "@/stores/wishes";
import type { Wish } from "@/features/wishes/wish";
import { rippleLiftAt } from "./ripplePool";
import { rng } from "./scatter";

const PETALS = 8;
const PETAL_TILT = 0.75;
/** Seconds a lantern takes to drift from the steps to the far water. */
const JOURNEY = 150;

interface Lane {
  lane: number;
  speed: number;
  phase: number;
  size: number;
}

interface PlaceArgs {
  petals: InstancedMesh | null;
  cores: InstancedMesh | null;
  glowGeo: BufferGeometry;
  dummy: Object3D;
  anchors: (Object3D | null)[];
  wishes: readonly Wish[];
  lanes: readonly Lane[];
  spawned: Map<string, number>;
  now: number;
  reducedMotion: boolean;
}

function placeLanterns({
  petals,
  cores,
  glowGeo,
  dummy,
  anchors,
  wishes,
  lanes,
  spawned,
  now,
  reducedMotion,
}: PlaceArgs) {
  if (!petals || !cores) return;
  const glowPos = glowGeo.attributes.position as BufferAttribute;
  wishes.forEach((w, i) => {
    const { lane, speed, phase, size } = lanes[i];
    const start = spawned.get(w.id) ?? 0;
    // Progress 0 at the steps to 1 far out; it stops at the horizon.
    const progress = Math.min(1, start + (reducedMotion ? 0 : (now * speed) / JOURNEY));
    // Starts just off the terrace steps and drifts to the far water.
    const z = 0.2 - progress * 52;
    const x = lane * (0.2 + progress * 1.7) + Math.sin(now * 0.2 + phase) * 0.3;
    const bob = reducedMotion ? 0 : Math.sin(now * 0.7 + phase) * 0.025;
    const y = 0.06 + bob + rippleLiftAt(x, z, now);
    const fade = 1 - Math.max(0, (progress - 0.85) / 0.15);

    for (let k = 0; k < PETALS; k++) {
      const ring = k % 2;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, (k / PETALS) * Math.PI * 2 + now * 0.05 + phase, 0);
      dummy.rotateX(-PETAL_TILT * (ring ? 1.2 : 0.85));
      dummy.scale.setScalar(size * (ring ? 0.82 : 1) * fade);
      dummy.updateMatrix();
      petals.setMatrixAt(i * PETALS + k, dummy.matrix);
    }
    dummy.position.set(x, y + 0.075 * size, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(size * fade);
    dummy.updateMatrix();
    cores.setMatrixAt(i, dummy.matrix);
    glowPos.setXYZ(i, x, y + 0.12 * size, z);
    // Keep the hover label anchored to the drifting lantern.
    anchors[i]?.position.set(x, y + 0.45, z);
  });
  petals.count = wishes.length * PETALS;
  cores.count = wishes.length;
  petals.instanceMatrix.needsUpdate = true;
  cores.instanceMatrix.needsUpdate = true;
  glowPos.needsUpdate = true;
  petals.computeBoundingSphere();
  cores.computeBoundingSphere();
}

/**
 * Lanterns carrying the viewer's wishes, drifting out across the water.
 * Each wish gets a deterministic lane and speed from its id, so returning
 * later shows the same fleet further out rather than a reshuffled one.
 */
export function WishLanterns({ reducedMotion }: { reducedMotion: boolean }) {
  const wishes = useWishes((s) => s.wishes);
  const releaseSeq = useWishes((s) => s.releaseSeq);
  const petals = useRef<InstancedMesh>(null);
  const cores = useRef<InstancedMesh>(null);
  const glows = useRef<Points>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const spawned = useRef(new Map<string, number>());
  const anchors = useRef<(Object3D | null)[]>([]);

  const petalGeo = useMemo(() => {
    const g = new SphereGeometry(1, 10, 6);
    g.scale(0.1, 0.028, 0.24);
    g.translate(0, 0, 0.18);
    return g;
  }, []);
  const coreGeo = useMemo(() => new SphereGeometry(0.07, 14, 10), []);
  const glowGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(Math.max(1, wishes.length) * 3), 3));
    return g;
  }, [wishes.length]);
  useEffect(
    () => () => {
      petalGeo.dispose();
      coreGeo.dispose();
      glowGeo.dispose();
    },
    [petalGeo, coreGeo, glowGeo],
  );

  // A lantern released in this session starts at the steps; ones restored from
  // storage start already partway out, so the water is never suddenly crowded.
  useEffect(() => {
    const seen = spawned.current;
    wishes.forEach((w, i) => {
      if (!seen.has(w.id))
        seen.set(
          w.id,
          i === wishes.length - 1 && releaseSeq > 0 ? 0 : 0.25 + 0.6 * ((wishes.length - i) / wishes.length),
        );
    });
    for (const id of [...seen.keys()]) if (!wishes.some((w) => w.id === id)) seen.delete(id);
  }, [wishes, releaseSeq]);

  const lanes = useMemo(
    () =>
      wishes.map((w) => {
        const seed = [...w.id].reduce((a, c) => a + c.charCodeAt(0), 0);
        const r = rng(seed + 1);
        return { lane: (r() - 0.5) * 16, speed: 0.7 + r() * 0.6, phase: r() * 6.28, size: 1.1 + r() * 0.4 };
      }),
    [wishes],
  );

  useFrame((state) => {
    placeLanterns({
      petals: petals.current,
      cores: cores.current,
      glowGeo,
      dummy,
      anchors: anchors.current,
      wishes,
      lanes,
      spawned: spawned.current,
      now: state.clock.elapsedTime,
      reducedMotion,
    });
  });

  // Release the hover label when the fleet changes.
  useEffect(() => {
    const id = useWishes.getState().hoveredId;
    if (id && !wishes.some((w) => w.id === id)) useWishes.getState().setHovered(null);
  }, [wishes]);

  if (wishes.length === 0) return null;

  return (
    <group>
      <instancedMesh ref={petals} args={[petalGeo, undefined, wishes.length * PETALS]} frustumCulled={false}>
        <meshStandardMaterial color="#fff0dc" roughness={0.45} emissive="#ffb86b" emissiveIntensity={0.5} />
      </instancedMesh>
      <instancedMesh
        ref={cores}
        args={[coreGeo, undefined, wishes.length]}
        frustumCulled={false}
        onPointerMove={(e) => {
          e.stopPropagation();
          const id = e.instanceId !== undefined ? wishes[e.instanceId]?.id : undefined;
          if (id) {
            useWishes.getState().setHovered(id);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          useWishes.getState().setHovered(null);
          document.body.style.cursor = "";
        }}
      >
        <meshBasicMaterial color="#fff4d6" toneMapped={false} />
      </instancedMesh>
      <points ref={glows} geometry={glowGeo} frustumCulled={false}>
        <pointsMaterial
          map={glowTexture()}
          color="#ffd48a"
          size={2.1}
          sizeAttenuation
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      {wishes.map((w, i) => (
        <object3D
          key={w.id}
          ref={(o) => {
            anchors.current[i] = o;
            registerAnchor(`wish:${w.id}`, o);
            return () => registerAnchor(`wish:${w.id}`, null);
          }}
        />
      ))}
    </group>
  );
}
