import { beforeEach, describe, expect, it } from "vitest";
import { useExperience } from "@/stores/experience";

const initial = useExperience.getState();

describe("experience store", () => {
  beforeEach(() => useExperience.setState(initial, true));

  it("starts in the sanctuary with nothing hovered", () => {
    const s = useExperience.getState();
    expect(s.view).toBe("sanctuary");
    expect(s.hovered).toBeNull();
  });

  it("enters a destination and records an entry pulse", () => {
    expect(useExperience.getState().enter("tarot")).toBe(true);
    const s = useExperience.getState();
    expect(s.view).toBe("tarot");
    expect(s.lastEnter).toEqual({ id: "tarot", seq: 1 });
  });

  it("ignores entering another destination while already inside one", () => {
    useExperience.getState().enter("tarot");
    expect(useExperience.getState().enter("destiny")).toBe(false);
    expect(useExperience.getState().view).toBe("tarot");
    expect(useExperience.getState().lastEnter?.seq).toBe(1);
  });

  it("rapid repeated entry produces exactly one transition", () => {
    const results = Array.from({ length: 5 }, () => useExperience.getState().enter("destiny"));
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(useExperience.getState().lastEnter?.seq).toBe(1);
  });

  it("exit returns to the sanctuary and resets dimming; re-entry increments seq", () => {
    const s = useExperience.getState();
    s.enter("destiny");
    s.setDim(0.8);
    useExperience.getState().exit();
    expect(useExperience.getState()).toMatchObject({ view: "sanctuary", dim: 0, hovered: null });
    useExperience.getState().enter("tarot");
    expect(useExperience.getState().lastEnter).toEqual({ id: "tarot", seq: 2 });
  });

  it("clears hover on entry and refuses new hover targets inside a destination", () => {
    const s = useExperience.getState();
    s.setHovered("tarot");
    expect(useExperience.getState().hovered).toBe("tarot");
    s.enter("tarot");
    expect(useExperience.getState().hovered).toBeNull();
    useExperience.getState().setHovered("destiny");
    expect(useExperience.getState().hovered).toBeNull();
  });

  it("clamps dim to [0, 1]", () => {
    useExperience.getState().setDim(4);
    expect(useExperience.getState().dim).toBe(1);
    useExperience.getState().setDim(-1);
    expect(useExperience.getState().dim).toBe(0);
  });
});
