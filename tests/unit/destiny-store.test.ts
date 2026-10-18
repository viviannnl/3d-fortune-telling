import { beforeEach, describe, expect, it } from "vitest";
import { useDestiny } from "@/stores/destiny";

const initial = useDestiny.getState();
const TODAY = "2026-10-17";

describe("destiny store", () => {
  beforeEach(() => useDestiny.setState(initial, true));

  it("invalid input yields field errors and no chart", () => {
    expect(useDestiny.getState().submit(TODAY)).toBe(false);
    expect(useDestiny.getState().chart).toBeNull();
    expect(useDestiny.getState().fieldErrors.date).toBe("date_required");
  });

  it("calculates, then recalculates with new input and bumps chartSeq", () => {
    const s = useDestiny.getState();
    s.setDraft({ date: "2000-01-01", time: "12:00", placeId: "beijing" });
    expect(s.submit(TODAY)).toBe(true);
    const first = useDestiny.getState();
    expect(first.chart?.pillars.day.name).toBe("戊午");
    expect(first.chartSeq).toBe(1);
    expect(first.editing).toBe(false);

    first.edit();
    useDestiny.getState().setDraft({ date: "1949-10-01" });
    expect(useDestiny.getState().submit(TODAY)).toBe(true);
    expect(useDestiny.getState().chart?.pillars.day.name).toBe("甲子");
    expect(useDestiny.getState().chartSeq).toBe(2);
  });

  it("a failed recalculation clears the previous chart instead of leaving it looking current", () => {
    const s = useDestiny.getState();
    s.setDraft({ date: "2000-01-01", time: "12:00", placeId: "beijing" });
    expect(s.submit(TODAY)).toBe(true);
    useDestiny.getState().edit();
    useDestiny.getState().setDraft({ date: "2023-03-12", time: "02:30", placeId: "newyork" }); // DST gap
    expect(s.submit(TODAY)).toBe(false);
    expect(useDestiny.getState().chartError).toBe("nonexistent_local_time");
    expect(useDestiny.getState().chart).toBeNull();
    useDestiny.getState().setDraft({ date: "" });
    expect(useDestiny.getState().submit(TODAY)).toBe(false);
    expect(useDestiny.getState().chart).toBeNull();
  });

  it("ambiguous fall-back time asks for a fold, and changing the time clears it", () => {
    const s = useDestiny.getState();
    s.setDraft({ date: "2023-11-05", time: "01:30", placeId: "newyork" });
    expect(s.submit(TODAY)).toBe(false);
    expect(useDestiny.getState().chartError).toBe("ambiguous_local_time");
    useDestiny.getState().setDraft({ fold: "later" });
    expect(useDestiny.getState().submit(TODAY)).toBe(true);
    useDestiny.getState().setDraft({ time: "01:45" });
    expect(useDestiny.getState().draft.fold).toBeUndefined();
  });

  it("clear forgets birth details entirely", () => {
    const s = useDestiny.getState();
    s.setDraft({ date: "2000-01-01", time: "12:00", placeId: "beijing" });
    s.submit(TODAY);
    useDestiny.getState().clear();
    expect(useDestiny.getState()).toMatchObject({
      chart: null,
      input: null,
      draft: { date: "", time: "", placeId: "" },
    });
  });
});
