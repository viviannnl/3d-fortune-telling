"use client";

import { useState } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import type { Mesh } from "three";
import type { RenderQuality } from "@/lib/webgl";
import { CelestialRing } from "./CelestialRing";
import { QualityContext } from "./quality";
import { FarShore } from "./garden/FarShore";
import { Garden } from "./garden/Garden";
import { Butterflies } from "./garden/Butterflies";
import { Petals } from "./garden/Petals";
import { ShootingStars } from "./garden/ShootingStars";
import { Charms } from "./charms/Charms";
import { SparkleStars } from "./garden/SparkleStars";
import { ForegroundCrystals } from "./ForegroundCrystals";
import { MoonGlints } from "./MoonGlints";
import { PALETTE } from "@/lib/palette";
import { CameraRig } from "./CameraRig";
import { CrystalField } from "./CrystalField";
import { DistantStructures } from "./DistantStructures";
import { Effects } from "./Effects";
import { DestinationHotspot } from "./destinations/DestinationHotspot";
import { DestinyPalace } from "./destinations/DestinyPalace";
import { TarotGarden } from "./destinations/TarotGarden";
import { DESTINATION_ANCHORS, LABEL_HEIGHT, MOON } from "./layout";
import { LabelProjector } from "./LabelProjector";
import { Moon } from "./Moon";
import { SkyDome } from "./SkyDome";
import { StarField } from "./StarField";
import { WaterSurface } from "./WaterSurface";
import { HorizonRidges } from "./HorizonRidges";
import { LotusLanterns } from "./LotusLanterns";
import { Mist } from "./Mist";
import { Motes } from "./Motes";

interface WorldSceneProps {
  reducedMotion: boolean;
  quality: RenderQuality;
}

/** The celestial sanctuary: sky, moon, water, crystals, distant islands, and two destinations. */
export function WorldScene({ reducedMotion, quality }: WorldSceneProps) {
  // Set once when the moon mounts; feeds the light-shaft effect.
  const [moon, setMoon] = useState<Mesh | null>(null);
  return (
    <QualityContext.Provider value={quality}>
      <color attach="background" args={[PALETTE.midnight]} />
      <fog attach="fog" args={["#2b2563", 34, 160]} />

      {/* Procedural studio for pearlescent/crystal reflections — no HDR download. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="circle" intensity={2.2} color={PALETTE.moonlight} position={[0, 8, -20]} scale={8} />
        <Lightformer
          form="rect"
          intensity={0.8}
          color={PALETTE.lavender}
          position={[-12, 3, 4]}
          scale={[10, 4, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          color={PALETTE.paleBlue}
          position={[12, 4, 6]}
          scale={[10, 4, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={0.4}
          color={PALETTE.amethyst}
          position={[0, -6, 0]}
          rotation-x={Math.PI / 2}
          scale={14}
        />
      </Environment>

      <hemisphereLight args={["#a99cff", "#2a2160", 0.7]} />
      {/* Moon key: high and behind, so tops and back edges catch the light. */}
      <directionalLight color={PALETTE.moonlight} position={[0, 40, -70]} intensity={1.5} />
      {/* Rim lights from behind each side separate silhouettes from the sky. */}
      <directionalLight color={PALETTE.lavender} position={[-30, 12, -40]} intensity={1.1} />
      <directionalLight color={PALETTE.paleBlue} position={[30, 12, -40]} intensity={1.0} />
      {/* Soft cool fill from the viewer's side. */}
      <directionalLight color={PALETTE.paleBlue} position={[4, 10, 24]} intensity={0.45} />

      <CameraRig reducedMotion={reducedMotion} />
      <LabelProjector />
      <SkyDome />
      <StarField reducedMotion={reducedMotion} />
      <Moon position={MOON.position} radius={MOON.radius} onMesh={setMoon} />
      <CelestialRing reducedMotion={reducedMotion} />
      <DistantStructures reducedMotion={reducedMotion} />
      <CrystalField reducedMotion={reducedMotion} />
      <HorizonRidges />
      <WaterSurface reducedMotion={reducedMotion} resolution={quality === "high" ? 512 : 256} />
      <MoonGlints reducedMotion={reducedMotion} />
      {quality === "high" && <Mist reducedMotion={reducedMotion} />}
      <ForegroundCrystals reducedMotion={reducedMotion} />
      <FarShore reducedMotion={reducedMotion} />
      <SparkleStars reducedMotion={reducedMotion} />
      <Garden reducedMotion={reducedMotion} />
      <Petals reducedMotion={reducedMotion} />
      <Butterflies reducedMotion={reducedMotion} />
      <ShootingStars reducedMotion={reducedMotion} />
      <Charms reducedMotion={reducedMotion} />
      <LotusLanterns reducedMotion={reducedMotion} />
      <Motes reducedMotion={reducedMotion} />

      <DestinationHotspot
        id="tarot"
        position={DESTINATION_ANCHORS.tarot}
        labelHeight={LABEL_HEIGHT.tarot}
        radius={3.4}
        reducedMotion={reducedMotion}
      >
        <TarotGarden reducedMotion={reducedMotion} />
      </DestinationHotspot>
      <DestinationHotspot
        id="destiny"
        position={DESTINATION_ANCHORS.destiny}
        labelHeight={LABEL_HEIGHT.destiny}
        radius={3.6}
        reducedMotion={reducedMotion}
      >
        <DestinyPalace reducedMotion={reducedMotion} />
      </DestinationHotspot>

      <Effects moon={quality === "high" ? moon : null} multisampling={quality === "high" ? 4 : 0} />
    </QualityContext.Provider>
  );
}
