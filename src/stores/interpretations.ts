import { create } from "zustand";
import {
  InterpretationResponseSchema,
  type Interpretation,
  type InterpretationErrorCode,
} from "@/features/interpretation/schema";

export type ClientErrorCode = InterpretationErrorCode | "network" | "mismatch";

export type InterpretationEntry =
  | { status: "loading" }
  | { status: "success"; interpretation: Interpretation }
  | { status: "error"; error: ClientErrorCode };

const CLIENT_TIMEOUT_MS = 75_000;

interface InterpretationStore {
  entries: Record<string, InterpretationEntry>;
  /**
   * Requests an interpretation for a reading key. Ignored while one is in flight
   * or already succeeded for the same key, so repeated clicks can't fan out.
   */
  request: (key: string, url: string, body: unknown, expectedSubject: string[]) => Promise<void>;
  cancel: (key: string) => void;
}

const controllers = new Map<string, AbortController>();

export const useInterpretations = create<InterpretationStore>()((set, get) => ({
  entries: {},
  request: async (key, url, body, expectedSubject) => {
    const existing = get().entries[key];
    if (existing?.status === "loading" || existing?.status === "success") return;
    const controller = new AbortController();
    controllers.set(key, controller);
    const timer = setTimeout(() => controller.abort("timeout"), CLIENT_TIMEOUT_MS);
    const put = (entry: InterpretationEntry) => set((s) => ({ entries: { ...s.entries, [key]: entry } }));
    put({ status: "loading" });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const parsed = InterpretationResponseSchema.safeParse(await res.json().catch(() => null));
      if (!parsed.success) return put({ status: "error", error: "invalid_output" });
      if (!parsed.data.ok) return put({ status: "error", error: parsed.data.error });
      // The server echoes what it interpreted; refuse to show a reading for anything else.
      const same =
        parsed.data.subject.length === expectedSubject.length &&
        parsed.data.subject.every((s, i) => s === expectedSubject[i]);
      if (!same) return put({ status: "error", error: "mismatch" });
      put({ status: "success", interpretation: parsed.data.interpretation });
    } catch {
      if (controller.signal.aborted && controller.signal.reason !== "timeout") {
        // Cancelled by the user/app: forget the attempt entirely.
        set((s) => {
          const entries = { ...s.entries };
          delete entries[key];
          return { entries };
        });
        return;
      }
      put({ status: "error", error: controller.signal.aborted ? "timeout" : "network" });
    } finally {
      clearTimeout(timer);
      if (controllers.get(key) === controller) controllers.delete(key);
    }
  },
  cancel: (key) => controllers.get(key)?.abort("cancelled"),
}));
