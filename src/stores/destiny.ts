import { create } from "zustand";
import { calculateChart } from "@/features/destiny/engine";
import type { ElementId } from "@/features/destiny/symbols";
import type { BirthInput, ChartErrorCode, ChartResult, PillarKey } from "@/features/destiny/types";
import { EMPTY_FORM, parseBirthForm, type BirthFormValues, type FieldErrors } from "@/features/destiny/validation";

export type DestinySelection =
  { kind: "element"; id: ElementId } | { kind: "pillar"; id: PillarKey } | { kind: "dayMaster" };

/**
 * Birth details live only in memory for this tab — never persisted or logged.
 * `chartSeq` increments on every successful calculation to retrigger the reveal.
 */
interface DestinyStore {
  draft: BirthFormValues;
  fieldErrors: FieldErrors;
  chartError: ChartErrorCode | null;
  /** The validated input that produced `chart` (needed later for interpretation). */
  input: BirthInput | null;
  chart: ChartResult | null;
  chartSeq: number;
  editing: boolean;
  selection: DestinySelection | null;
  readingOpen: boolean;
  setReadingOpen: (open: boolean) => void;
  setDraft: (patch: Partial<BirthFormValues>) => void;
  submit: (today: string) => boolean;
  edit: () => void;
  select: (selection: DestinySelection | null) => void;
  clear: () => void;
}

export const useDestiny = create<DestinyStore>()((set, get) => ({
  draft: EMPTY_FORM,
  fieldErrors: {},
  chartError: null,
  input: null,
  chart: null,
  chartSeq: 0,
  editing: true,
  selection: null,
  readingOpen: false,
  setReadingOpen: (open) => set({ readingOpen: open && get().chart !== null }),
  setDraft: (patch) => {
    const draft = { ...get().draft, ...patch };
    // Any change to the moment of birth invalidates a previous DST fold choice.
    if (("date" in patch || "time" in patch || "placeId" in patch || "timeZone" in patch) && !("fold" in patch)) {
      delete draft.fold;
    }
    set({ draft });
  },
  submit: (today) => {
    const parsed = parseBirthForm(get().draft, today);
    if (!parsed.ok) {
      // A failed recalculation never leaves the previous chart looking current.
      set({
        fieldErrors: parsed.errors,
        chartError: null,
        chart: null,
        input: null,
        selection: null,
        readingOpen: false,
      });
      return false;
    }
    const result = calculateChart(parsed.input);
    if (!result.ok) {
      set({ fieldErrors: {}, chartError: result.code, chart: null, input: null, selection: null, readingOpen: false });
      return false;
    }
    set((s) => ({
      fieldErrors: {},
      chartError: null,
      input: parsed.input,
      chart: result,
      chartSeq: s.chartSeq + 1,
      editing: false,
      selection: null,
    }));
    return true;
  },
  edit: () => set({ editing: true, selection: null, readingOpen: false }),
  select: (selection) => set({ selection }),
  clear: () =>
    set({
      draft: EMPTY_FORM,
      fieldErrors: {},
      chartError: null,
      input: null,
      chart: null,
      editing: true,
      selection: null,
    }),
}));
