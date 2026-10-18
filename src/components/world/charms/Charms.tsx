"use client";

import { MOON } from "../layout";
import { TERRACE_Y, terraceLanternPosition } from "../garden/Terrace";
import { CharmHotspot } from "./CharmHotspot";
import { SparkleBursts } from "./SparkleBursts";

/** The sanctuary's hidden charms: wisteria, lanterns, crystals, the orb, and the moon. */
export function Charms({ reducedMotion }: { reducedMotion: boolean }) {
  const [mx, my, mz] = MOON.position;
  return (
    <group>
      <CharmHotspot
        id="wisteria-left"
        position={[-8.2, 8.4, 8]}
        radius={2.2}
        color="#d6b6ff"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="wisteria-right"
        position={[8.2, 8.4, 8]}
        radius={2.2}
        color="#d6b6ff"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="lantern-left"
        position={terraceLanternPosition(0)}
        radius={0.45}
        hintScale={1.2}
        color="#ffd890"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="lantern-right"
        position={terraceLanternPosition(1)}
        radius={0.45}
        hintScale={1.2}
        color="#ffd890"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="crystal-left"
        position={[-8.2, TERRACE_Y + 1.5, 7.4]}
        radius={1.1}
        color="#c9a3ff"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="crystal-right"
        position={[8.4, TERRACE_Y + 1.3, 7.6]}
        radius={1.0}
        color="#a9c8ff"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="orb"
        position={[3.9, TERRACE_Y + 0.88, 7.6]}
        radius={0.45}
        hintScale={1.4}
        color="#d9c2ff"
        reducedMotion={reducedMotion}
      />
      <CharmHotspot
        id="moon"
        position={[mx, my, mz]}
        radius={MOON.radius}
        hintScale={0.1}
        color="#f4eeff"
        reducedMotion={reducedMotion}
      />
      <SparkleBursts reducedMotion={reducedMotion} />
    </group>
  );
}
