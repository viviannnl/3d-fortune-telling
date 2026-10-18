"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useExperience } from "@/stores/experience";
import { introProgress, ramp } from "@/stores/intro";
import { CAMERA_POSES } from "./layout";

const TRAVEL_LAMBDA = 1.3; // ≈ 2 s to settle between destinations
const PARALLAX_LAMBDA = 2.6;
/** The entrance starts a little behind the terrace gazing up at the sky, then glides in and lowers its gaze to the water. */
const INTRO_FROM = new Vector3(0, 5.2, 25);
const INTRO_LOOK = new Vector3(0, 24, -95);

/**
 * Controlled cinematic camera: eases between per-view poses and adds gentle
 * pointer parallax. All motion happens in useFrame — no React state per frame.
 */
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const base = useRef(new Vector3(...CAMERA_POSES.sanctuary.position));
  const look = useRef(new Vector3(...CAMERA_POSES.sanctuary.target));
  const offset = useRef({ x: 0, y: 0 });
  const scratch = useRef(new Vector3());
  const introLook = useRef(new Vector3());

  const lastAspect = useRef(0);

  useFrame((state, delta) => {
    const { camera } = state;
    // Wider lens on portrait screens so both destinations stay in frame.
    const aspect = state.size.width / state.size.height;
    if (aspect !== lastAspect.current && camera instanceof PerspectiveCamera) {
      lastAspect.current = aspect;
      camera.fov = aspect < 1 ? 50 + (1 - aspect) * 46 : 50;
      camera.updateProjectionMatrix();
    }
    const { view, cameraShift } = useExperience.getState();
    const pose = CAMERA_POSES[view];
    const dt = Math.min(delta, 0.1);
    const travel = reducedMotion ? 8 : TRAVEL_LAMBDA;

    // Only shift on wide screens; on narrow ones panels cover the scene anyway.
    const shift = aspect > 1.2 ? cameraShift : 0;
    const p = scratch.current.set(...pose.position);
    p.x += shift;
    base.current.x = MathUtils.damp(base.current.x, p.x, travel, dt);
    base.current.y = MathUtils.damp(base.current.y, p.y, travel, dt);
    base.current.z = MathUtils.damp(base.current.z, p.z, travel, dt);

    const amount = reducedMotion ? 0 : pose.parallax;
    offset.current.x = MathUtils.damp(offset.current.x, state.pointer.x * amount, PARALLAX_LAMBDA, dt);
    offset.current.y = MathUtils.damp(offset.current.y, state.pointer.y * amount * 0.45, PARALLAX_LAMBDA, dt);

    // Portrait screens: pull back a little so both destinations stay closer to frame.
    const pullBack = aspect < 1 ? (1 - aspect) * 6 : 0;
    camera.position.set(
      base.current.x + offset.current.x,
      base.current.y + offset.current.y,
      base.current.z + pullBack,
    );

    const t = scratch.current.set(...pose.target);
    t.x += shift;
    look.current.x = MathUtils.damp(look.current.x, t.x, travel, dt);
    look.current.y = MathUtils.damp(look.current.y, t.y, travel, dt);
    look.current.z = MathUtils.damp(look.current.z, t.z, travel, dt);

    // The entrance: glide down from the sky onto the rig's pose, slow at both ends.
    const k = ramp(introProgress(), 0.04, 0.95);
    if (k < 1) {
      camera.position.lerpVectors(INTRO_FROM, camera.position, k);
      camera.lookAt(introLook.current.lerpVectors(INTRO_LOOK, look.current, k));
      return;
    }
    camera.lookAt(look.current);
  });

  return null;
}
