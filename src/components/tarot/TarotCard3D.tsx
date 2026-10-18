"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Euler,
  MathUtils,
  PlaneGeometry,
  Quaternion,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";
import { getCard } from "@/features/tarot/cards";
import type { Orientation } from "@/features/tarot/types";
import { PALETTE } from "@/lib/palette";
import { CHAMPAGNE } from "@/components/world/materials";
import { cardBodyGeometry } from "./cardGeometry";
import { CARD_ASPECT, CARD_BACK_ASSET, createFallbackFace, useCardTexture } from "./cardTextures";
import { FAN_CARD_WIDTH, type CardTarget } from "./spreadLayout";

const W = FAN_CARD_WIDTH;
const H = W / CARD_ASPECT;

let shared: { plane: PlaneGeometry; glow: PlaneGeometry; corners: CanvasTexture } | null = null;
/** Geometry and the rounded-corner mask are shared by every card for the page's lifetime. */
function sharedAssets() {
  if (!shared) {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 120, 200);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.roundRect(1, 1, 118, 198, 9);
      ctx.fill();
    }
    shared = {
      plane: new PlaneGeometry(W, H),
      glow: new PlaneGeometry(W * 1.09, H * 1.06),
      corners: new CanvasTexture(canvas),
    };
  }
  return shared;
}

const ROMAN = [
  "0",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
];

function CardFace({ cardId, orientation }: { cardId: string; orientation: Orientation }) {
  const card = getCard(cardId);
  const face = useCardTexture(card?.asset ?? "");
  const fallback = useMemo(
    () => (face.status === "failed" ? createFallbackFace(ROMAN[card?.number ?? 0] ?? "", card?.name.en ?? "") : null),
    [face.status, card],
  );
  useEffect(() => () => fallback?.dispose(), [fallback]);
  const map = face.texture ?? fallback;
  const { plane, corners } = sharedAssets();

  return (
    <mesh geometry={plane} rotation={[0, 0, orientation === "reversed" ? Math.PI : 0]} position={[0, 0, 0.0015]}>
      {map ? (
        <meshStandardMaterial
          key="face"
          map={map}
          emissiveMap={map}
          emissive="#ffffff"
          emissiveIntensity={0.38}
          alphaMap={corners}
          alphaTest={0.5}
          roughness={0.55}
          metalness={0.05}
        />
      ) : (
        <meshStandardMaterial key="loading" color={PALETTE.deepViolet} alphaMap={corners} alphaTest={0.5} />
      )}
    </mesh>
  );
}

export interface TarotCard3DProps {
  deckIndex: number;
  cardId: string;
  orientation: Orientation;
  target: CardTarget;
  /** Spawn pose, so new cards emerge from the deck instead of popping in. */
  origin: CardTarget;
  hovered: boolean;
  showFace: boolean;
  enabled: boolean;
  reducedMotion: boolean;
  onHover: (deckIndex: number | null) => void;
  onSelect: (deckIndex: number) => void;
}

const MOVE_LAMBDA = 5;
const FLIP_LAMBDA = 6;

export function TarotCard3D(props: TarotCard3DProps) {
  const {
    deckIndex,
    cardId,
    orientation,
    target,
    origin,
    hovered,
    showFace,
    enabled,
    reducedMotion,
    onHover,
    onSelect,
  } = props;
  const outer = useRef<Group>(null);
  const flip = useRef<Group>(null);
  const glow = useRef<MeshBasicMaterial>(null);
  const backMat = useRef<MeshStandardMaterial>(null);
  const scratch = useMemo(() => ({ q: new Quaternion(), e: new Euler() }), []);
  const back = useCardTexture(CARD_BACK_ASSET);
  const { plane, glow: glowGeo, corners } = sharedAssets();

  useFrame((_, delta) => {
    const g = outer.current;
    const f = flip.current;
    if (!g || !f) return;
    const dt = Math.min(delta, 0.1);
    const move = reducedMotion ? 30 : MOVE_LAMBDA;
    g.position.x = MathUtils.damp(g.position.x, target.position[0], move, dt);
    g.position.y = MathUtils.damp(g.position.y, target.position[1], move, dt);
    g.position.z = MathUtils.damp(g.position.z, target.position[2], move, dt);
    g.quaternion.slerp(scratch.q.setFromEuler(scratch.e.set(...target.rotation)), 1 - Math.exp(-move * dt));
    g.scale.setScalar(MathUtils.damp(g.scale.x, target.scale, move, dt));
    f.rotation.y = reducedMotion ? target.flip : MathUtils.damp(f.rotation.y, target.flip, FLIP_LAMBDA, dt);

    if (glow.current) {
      const want = hovered && target.interactive && enabled ? 0.75 : 0;
      glow.current.opacity = MathUtils.damp(glow.current.opacity, want, 10, dt);
    }
    if (backMat.current) {
      backMat.current.opacity = MathUtils.damp(backMat.current.opacity, target.presence, 3, dt);
    }
  });

  const interactive = enabled && target.interactive;
  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    onHover(deckIndex);
  };
  const out = () => {
    if (hovered) onHover(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelect(deckIndex);
  };

  return (
    <group
      ref={outer}
      position={origin.position}
      rotation={origin.rotation}
      scale={origin.scale}
      onPointerOver={over}
      onPointerOut={out}
      onClick={click}
    >
      <group ref={flip} rotation={[0, origin.flip, 0]}>
        {/* Lavender edge highlight, visible around the card from either side */}
        <mesh geometry={glowGeo} position={[0, 0, 0]}>
          <meshBasicMaterial
            ref={glow}
            color={PALETTE.lavender}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Card body: real thickness with champagne-gold gilded edges */}
        <mesh geometry={cardBodyGeometry(W, H, 0.0024)}>
          <meshStandardMaterial {...CHAMPAGNE} />
        </mesh>
        {showFace && <CardFace cardId={cardId} orientation={orientation} />}
        <mesh geometry={plane} rotation={[0, Math.PI, 0]} position={[0, 0, -0.0015]}>
          {back.texture ? (
            <meshStandardMaterial
              key="back"
              ref={backMat}
              map={back.texture}
              emissiveMap={back.texture}
              emissive="#ffffff"
              emissiveIntensity={0.3}
              alphaMap={corners}
              alphaTest={0.5}
              transparent
              roughness={0.5}
            />
          ) : (
            <meshStandardMaterial
              key="plain"
              ref={backMat}
              color={PALETTE.amethyst}
              alphaMap={corners}
              alphaTest={0.5}
              transparent
            />
          )}
        </mesh>
      </group>
    </group>
  );
}
