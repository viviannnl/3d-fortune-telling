"use client";

import { DoubleSide } from "three";
import { CHAMPAGNE } from "@/components/world/materials";
import { PALETTE } from "@/lib/palette";
import { cardBodyGeometry } from "./cardGeometry";
import { CARD_ASPECT, CARD_BACK_ASSET, useCardTexture } from "./cardTextures";

/** A display card: deck back on both faces, champagne-gold edges with real thickness. */
export function CardBackPlane({ width }: { width: number }) {
  const back = useCardTexture(CARD_BACK_ASSET);
  const h = width / CARD_ASPECT;
  return (
    <group>
      <mesh geometry={cardBodyGeometry(width, h, Math.max(0.0028, width * 0.012))}>
        <meshStandardMaterial {...CHAMPAGNE} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[0, 0, side * Math.max(0.0016, width * 0.0065)]}
          rotation={[0, side < 0 ? Math.PI : 0, 0]}
        >
          <planeGeometry args={[width * 0.985, h * 0.99]} />
          {back.texture ? (
            <meshStandardMaterial
              key="art"
              map={back.texture}
              emissiveMap={back.texture}
              emissive="#ffffff"
              emissiveIntensity={0.42}
              roughness={0.45}
              metalness={0.1}
              side={DoubleSide}
            />
          ) : (
            <meshStandardMaterial
              key="plain"
              color={PALETTE.amethyst}
              roughness={0.4}
              metalness={0.2}
              side={DoubleSide}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}
