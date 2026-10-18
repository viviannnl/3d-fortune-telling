"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { useDestinationSignals } from "@/components/world/destinations/DestinationContext";
import { useExperience } from "@/stores/experience";
import { useDestiny } from "@/stores/destiny";
import { ArmillarySphere } from "./ArmillarySphere";
import { ELEMENT_COLOR } from "./elementStyle";
import { FiveElements3D } from "./FiveElements3D";

export const ARMILLARY_CENTER_Y = 3.4;
const REVEAL_SPIN_SECONDS = 2.2;

/**
 * The armillary sphere, and — once a chart is calculated — the Five Elements
 * arranged around it. Each calculation replays a staged reveal.
 */
export function DestinyCenterpiece({ reducedMotion }: { reducedMotion: boolean }) {
  const { glow } = useDestinationSignals();
  const chart = useDestiny((s) => s.chart);
  const chartSeq = useDestiny((s) => s.chartSeq);
  const inside = useExperience((s) => s.view === "destiny");
  const energy = useRef(0);
  const revealAt = useRef(Number.POSITIVE_INFINITY);
  const pending = useRef(false);

  useEffect(() => {
    if (chartSeq > 0) pending.current = true;
  }, [chartSeq]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (pending.current) {
      revealAt.current = t + 0.4;
      pending.current = false;
    }
    const sinceReveal = t - revealAt.current;
    const boost =
      sinceReveal >= -0.4 && sinceReveal < REVEAL_SPIN_SECONDS ? 1 - Math.max(0, sinceReveal) / REVEAL_SPIN_SECONDS : 0;
    energy.current = MathUtils.damp(energy.current, Math.max(glow.current ?? 0, boost), 3, delta);
  });

  const showChart = inside && chart !== null;

  return (
    <group position={[0, ARMILLARY_CENTER_Y, 0]}>
      <ArmillarySphere
        radius={1.05}
        energy={energy}
        reducedMotion={reducedMotion}
        coreColor={showChart ? ELEMENT_COLOR[chart.dayMaster.element] : undefined}
      />
      {showChart && (
        <group position={[0, -0.75, 0]}>
          <FiveElements3D chart={chart} revealAt={revealAt} interactive={inside} reducedMotion={reducedMotion} />
        </group>
      )}
    </group>
  );
}
