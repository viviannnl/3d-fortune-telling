"use client";

import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  GodRays,
  HueSaturation,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import type { Mesh } from "three";

/**
 * Restrained light shafts from the moon, bloom on only the brightest values
 * (moon, lantern cores, selected glows), and a soft vignette.
 */
export function Effects({ moon, multisampling }: { moon: Mesh | null; multisampling: number }) {
  return (
    <EffectComposer multisampling={multisampling}>
      {moon ? (
        <GodRays
          sun={moon}
          blendFunction={BlendFunction.SCREEN}
          samples={40}
          density={0.85}
          decay={0.9}
          weight={0.08}
          exposure={0.22}
          clampMax={0.55}
          kernelSize={KernelSize.SMALL}
          blur
        />
      ) : (
        <></>
      )}
      <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.85} luminanceSmoothing={0.15} radius={0.55} />
      {/* Gentle grade: richer colour and a touch more contrast so the night reads vivid, not grey. */}
      <HueSaturation saturation={0.22} />
      <BrightnessContrast brightness={0.03} contrast={0.1} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}
