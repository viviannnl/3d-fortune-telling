"use client";

import { useCallback, useEffect, useState } from "react";
import { slotOf } from "@/features/tarot/reading";
import { playSound } from "@/lib/audio/engine";
import { useExperience } from "@/stores/experience";
import { useTarot } from "@/stores/tarot";
import { CardBackPlane } from "./CardBackPlane";
import { cardTarget, FAN_CARD_WIDTH } from "./spreadLayout";
import { TarotCard3D } from "./TarotCard3D";

/** The deck on the table, the fan while drawing, and the three-card spread. */
export function TarotSpread3D({ reducedMotion }: { reducedMotion: boolean }) {
  const reading = useTarot((s) => s.reading);
  const enabled = useExperience((s) => s.view === "tarot");
  // Hover belongs to one reading phase; it lapses when the phase changes or the view is left.
  const phaseKey = `${reading.readingId}:${reading.phase}:${reading.picks.length}:${reading.revealed}`;
  const [hover, setHover] = useState<{ key: string; index: number } | null>(null);
  const activeHover = enabled && hover?.key === phaseKey ? hover.index : null;

  useEffect(() => {
    if (activeHover === null) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [activeHover]);

  const onHover = useCallback(
    (i: number | null) => {
      if (i === null) return setHover(null);
      setHover((prev) => {
        if (prev?.index !== i) playSound("hover");
        return { key: phaseKey, index: i };
      });
    },
    [phaseKey],
  );

  const onSelect = useCallback((i: number) => {
    const { reading: r, pick, reveal } = useTarot.getState();
    if (r.phase === "drawing") {
      if (pick(i)) playSound("select");
    } else if (r.phase === "revealing" && slotOf(r, i) === r.revealed) {
      if (reveal()) playSound("flip");
    }
    setHover(null);
  }, []);

  const stackOrigin = cardTarget({ ...reading, phase: "choosing" }, 0, null);

  if (reading.phase === "choosing") {
    // Before shuffling there is no identity to show: a neat stack of backs.
    return (
      <group position={[0, 1.03, 0.1]} rotation={[-Math.PI / 2, 0, 0.08]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[0, 0, i * 0.008]}>
            <CardBackPlane width={FAN_CARD_WIDTH} />
          </group>
        ))}
      </group>
    );
  }

  return (
    <group>
      {reading.deck.map((entry, i) => (
        <TarotCard3D
          key={`${reading.readingId}-${entry.cardId}`}
          deckIndex={i}
          cardId={entry.cardId}
          orientation={entry.orientation}
          target={cardTarget(reading, i, activeHover)}
          origin={{
            ...stackOrigin,
            position: [stackOrigin.position[0], stackOrigin.position[1] + i * 0.004, stackOrigin.position[2]],
          }}
          hovered={activeHover === i}
          showFace={slotOf(reading, i) >= 0}
          enabled={enabled}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
