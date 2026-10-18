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
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { BrightnessContrastEffect, VignetteEffect } from "postprocessing";
import type { Mesh } from "three";
import { introProgress, ramp } from "@/stores/intro";

const BRIGHTNESS = 0.03;
const VIGNETTE = 0.55;

/**
 * Restrained light shafts from the moon, bloom on only the brightest values
 * (moon, lantern cores, selected glows), and a soft vignette.
 */
export function Effects({ moon, multisampling }: { moon: Mesh | null; multisampling: number }) {
  const grade = useRef<BrightnessContrastEffect>(null);
  const vignette = useRef<VignetteEffect>(null);
  // The entrance: the night brightens from near-black as the moon comes up.
  useFrame(() => {
    const dark = 1 - ramp(introProgress(), 0.12, 0.75);
    if (grade.current) grade.current.brightness = BRIGHTNESS - 0.42 * dark;
    if (vignette.current) vignette.current.darkness = VIGNETTE + 0.35 * dark;
  });
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
      <BrightnessContrast ref={grade} brightness={BRIGHTNESS} contrast={0.1} />
      <Vignette ref={vignette} offset={0.3} darkness={VIGNETTE} />
    </EffectComposer>
  );
}
