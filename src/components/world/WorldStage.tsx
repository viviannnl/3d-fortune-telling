"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { useRouteActivation } from "@/lib/useRouteActive";
import { isWebGLAvailable } from "@/lib/webgl";
import { SkyFallback } from "./SkyFallback";
import { WorldErrorBoundary } from "./WorldErrorBoundary";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

const noopSubscribe = () => () => {};

function StageNotice({ children, live }: { children: string; live: "polite" | "assertive" }) {
  return (
    <p
      role="status"
      aria-live={live}
      className="absolute inset-x-0 bottom-28 mx-auto max-w-md px-6 text-center text-sm text-text-muted"
    >
      {children}
    </p>
  );
}

/**
 * Hosts the 3D world: WebGL detection, client-only loading, a static sky while
 * loading, and a graceful fallback if WebGL is missing or the scene crashes.
 */
export function WorldStage() {
  const t = useDictionary();
  // null on the server / first hydration pass; boolean once on the client.
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => null);
  // The canvas only exists while the route is visible, so a hidden route releases its WebGL context.
  const activation = useRouteActivation();
  const active = activation > 0;
  const [readyActivation, setReadyActivation] = useState(0);
  const handleReady = useCallback(() => setReadyActivation(activation), [activation]);
  const ready = active && readyActivation === activation;
  // Bumped to remount the canvas after a lost context.
  const [canvasKey, setCanvasKey] = useState(0);
  const [lost, setLost] = useState(false);
  const handleLost = useCallback(() => setLost(true), []);
  const restore = () => {
    setLost(false);
    setReadyActivation(0);
    setCanvasKey((k) => k + 1);
  };

  const unavailable = (
    <>
      <SkyFallback />
      <StageNotice live="assertive">{t.world.unavailable}</StageNotice>
    </>
  );

  if (webgl === false) return <div className="absolute inset-0">{unavailable}</div>;

  if (lost) {
    return (
      <div className="absolute inset-0">
        <SkyFallback />
        <div
          role="status"
          className="absolute inset-x-0 bottom-36 mx-auto flex max-w-md flex-col items-center gap-3 px-6 text-center"
        >
          <p className="text-sm text-text-muted">{t.world.lost}</p>
          <button
            type="button"
            onClick={restore}
            className="pointer-events-auto control-surface h-9 cursor-pointer rounded-pill px-4 text-xs font-medium text-text transition-transform duration-150 active:scale-[0.97]"
          >
            {t.world.restore}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0" data-world-ready={ready}>
      {webgl && active ? (
        <WorldErrorBoundary fallback={unavailable}>
          {!ready && <SkyFallback />}
          <div
            className="absolute inset-0 transition-opacity ease-out"
            style={{ opacity: ready ? 1 : 0, transitionDuration: "var(--duration-scene)" }}
          >
            <WorldCanvas key={canvasKey} label={t.world.canvasLabel} onReady={handleReady} onContextLost={handleLost} />
          </div>
          {!ready && <StageNotice live="polite">{t.world.loading}</StageNotice>}
        </WorldErrorBoundary>
      ) : (
        // webgl === null: first hydration pass, before detection runs.
        <SkyFallback />
      )}
    </div>
  );
}
