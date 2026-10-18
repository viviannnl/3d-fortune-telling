"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { detectRenderQuality } from "@/lib/webgl";
import { WorldScene } from "./WorldScene";

interface WorldCanvasProps {
  label: string;
  onReady: () => void;
  /** Called if the browser drops the WebGL context (GPU reset, memory pressure). */
  onContextLost: () => void;
}

/** Owns the WebGL context. Loaded client-only via WorldStage. */
export default function WorldCanvas({ label, onReady, onContextLost }: WorldCanvasProps) {
  const reducedMotion = useReducedMotion();
  const quality = useMemo(() => detectRenderQuality(), []);
  // R3F forces a context loss when it disposes the renderer on unmount; that one is intentional.
  // This parent layout-effect cleanup runs before the Canvas tears itself down.
  const disposing = useRef(false);
  useLayoutEffect(() => {
    disposing.current = false;
    return () => {
      disposing.current = true;
    };
  }, []);

  return (
    <Canvas
      aria-label={label}
      role="img"
      dpr={quality === "high" ? [1, 1.75] : 1}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 3.2, 15], fov: 50, near: 0.1, far: 800 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          if (disposing.current) return;
          e.preventDefault();
          onContextLost();
        });
        onReady();
      }}
    >
      <WorldScene reducedMotion={reducedMotion} quality={quality} />
    </Canvas>
  );
}
