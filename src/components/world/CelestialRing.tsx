"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BoxGeometry, MeshBasicMaterial, Object3D, type Group, type InstancedMesh } from "three";
import { PALETTE } from "@/lib/palette";
import { MOON } from "./layout";
import { glowTexture } from "./glowTexture";

const RADIUS = 34;
const TICKS = 144;

/**
 * Distant celestial architecture: a vast engraved ring encircling the moon,
 * with a few lantern nodes. Unlit and fog-free so it reads as far sky structure.
 */
export function CelestialRing({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const ticks = useRef<InstancedMesh>(null);
  const tickGeo = useMemo(() => new BoxGeometry(0.12, 1, 0.12), []);
  const tickMat = useMemo(
    () => new MeshBasicMaterial({ color: "#7d73ad", transparent: true, opacity: 0.55, fog: false, depthWrite: false }),
    [],
  );
  useEffect(
    () => () => {
      tickGeo.dispose();
      tickMat.dispose();
    },
    [tickGeo, tickMat],
  );

  useEffect(() => {
    const m = ticks.current;
    if (!m) return;
    const d = new Object3D();
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * Math.PI * 2;
      const major = i % 12 === 0;
      d.position.set(Math.cos(a) * RADIUS, Math.sin(a) * RADIUS, 0);
      d.rotation.set(0, 0, a + Math.PI / 2);
      d.scale.set(1, major ? 2.6 : i % 3 === 0 ? 1.4 : 0.8, 1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    if (group.current && !reducedMotion) group.current.rotation.z += delta * 0.004;
  });

  const [mx, my, mz] = MOON.position;
  return (
    <group position={[mx, my, mz - 12]} rotation={[-0.52, 0.18, 0]}>
      <group ref={group}>
        <mesh>
          <torusGeometry args={[RADIUS, 0.09, 6, 256]} />
          <meshBasicMaterial color="#8a80bb" transparent opacity={0.6} fog={false} depthWrite={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[RADIUS - 1.6, 0.04, 6, 256]} />
          <meshBasicMaterial color="#6c62a0" transparent opacity={0.5} fog={false} depthWrite={false} />
        </mesh>
        <instancedMesh ref={ticks} args={[tickGeo, tickMat, TICKS]} frustumCulled={false} />
        {[0, 1, 2, 3].map((i) => {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          return (
            <sprite key={i} position={[Math.cos(a) * RADIUS, Math.sin(a) * RADIUS, 0]} scale={3.2}>
              <spriteMaterial
                map={glowTexture()}
                color={PALETTE.paleBlue}
                blending={AdditiveBlending}
                depthWrite={false}
                fog={false}
                opacity={0.8}
              />
            </sprite>
          );
        })}
      </group>
    </group>
  );
}
