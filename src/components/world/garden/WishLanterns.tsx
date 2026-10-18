"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Object3D, SphereGeometry, type InstancedMesh, type Points } from "three";
import { BufferAttribute, BufferGeometry } from "three";
import { registerAnchor } from "../labelRegistry";
import { glowTexture } from "../glowTexture";
import { useWishes } from "@/stores/wishes";
import type { Wish } from "@/features/wishes/wish";
import { emitRipple, rippleLiftAt } from "./ripplePool";
import { rng } from "./scatter";

const PETALS = 8;
const PETAL_TILT = 0.75;
/** Seconds a lantern takes to drift from the steps to its resting place. */
const JOURNEY = 150;
/** How far out lanterns come to rest; close enough to stay visible and hoverable. */
const REST_Z = -18;
/** Launch point: clear of the terrace and of the buttons overlaying the near water. */
const START_Z = -4;
/** Seconds a new lantern takes to unfold on the water. */
const UNFOLD = 1.2;

interface Spawn {
  /** Progress already made when this session first saw the lantern. */
  offset: number;
  /** Scene clock when it first appeared; set on the first frame it is placed. */
  bornAt: number | null;
}

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
  spawned: Map<string, Spawn>;
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
    const spawn = spawned.get(w.id);
    if (!spawn) return;
    // Measured from when this lantern appeared, not from when the scene started.
    if (spawn.bornAt === null) {
      spawn.bornAt = now;
      // A fresh release touches the water, so the eye finds it.
      if (spawn.offset === 0 && !reducedMotion) emitRipple(lane * 0.7, START_Z, now);
    }
    const age = now - spawn.bornAt;
    // Progress 0 at the steps to 1 at its resting place, where it stays.
    const progress = Math.min(1, spawn.offset + (reducedMotion ? 0 : (age * speed) / JOURNEY));
    const z = START_Z + progress * (REST_Z - START_Z);
    const x = lane * (0.7 + progress * 0.9) + Math.sin(now * 0.2 + phase) * 0.3;
    const bob = reducedMotion ? 0 : Math.sin(now * 0.7 + phase) * 0.025;
    const y = 0.06 + bob + rippleLiftAt(x, z, now);
    // Unfolds from nothing when released; never fades away afterwards.
    const t = reducedMotion ? 1 : Math.min(1, age / UNFOLD);
    const fade = spawn.offset > 0 ? 1 : 1 - (1 - t) ** 3;

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
  const spawned = useRef(new Map<string, Spawn>());
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
      if (!seen.has(w.id)) {
        const fresh = i === wishes.length - 1 && releaseSeq > 0;
        // Older wishes rest further out; the newest restored one sits nearest.
        seen.set(w.id, { offset: fresh ? 0 : 0.35 + 0.5 * ((wishes.length - 1 - i) / wishes.length), bornAt: null });
      }
    });
    for (const id of [...seen.keys()]) if (!wishes.some((w) => w.id === id)) seen.delete(id);
  }, [wishes, releaseSeq]);

  const lanes = useMemo(
    () =>
      wishes.map((w) => {
        const seed = [...w.id].reduce((a, c) => a + c.charCodeAt(0), 0);
        const r = rng(seed + 1);
        // Lanes keep to either side of centre, where the page's buttons sit over the water.
        const side = r() < 0.5 ? -1 : 1;
        return { lane: side * (3.5 + r() * 4), speed: 0.7 + r() * 0.6, phase: r() * 6.28, size: 2.2 + r() * 0.5 };
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
        <meshStandardMaterial color="#fff0dc" roughness={0.45} emissive="#ffb86b" emissiveIntensity={0.9} />
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
          size={4.2}
          sizeAttenuation
          transparent
          opacity={1}
          toneMapped={false}
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
