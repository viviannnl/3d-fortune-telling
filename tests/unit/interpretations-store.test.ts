import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInterpretations } from "@/stores/interpretations";

const initial = useInterpretations.getState();
const interpretation = {
  overview: "A gentle overview of the whole reading, offered as reflection rather than prediction.",
  items: [{ key: "a", title: "A", interpretation: "Some symbolic thoughts about a, tentatively." }],
  themes: ["One", "Two"],
  reflectionQuestions: ["What now?", "What next?"],
  suggestions: ["Rest a while.", "Write it down."],
  shareableSummary: "A short summary.",
};

function mockFetch(impl: () => Promise<Response>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("interpretation request store", () => {
  beforeEach(() => useInterpretations.setState(initial, true));
  afterEach(() => vi.unstubAllGlobals());

  it("deduplicates concurrent and repeated requests for the same key", async () => {
    const fetch = mockFetch(async () => Response.json({ ok: true, interpretation, subject: ["x"] }));
    const s = useInterpretations.getState();
    await Promise.all([
      s.request("k", "/api", {}, ["x"]),
      s.request("k", "/api", {}, ["x"]),
      s.request("k", "/api", {}, ["x"]),
    ]);
    await s.request("k", "/api", {}, ["x"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(useInterpretations.getState().entries.k).toEqual({ status: "success", interpretation });
  });

  it("refuses a response whose subject differs from what is on screen", async () => {
    mockFetch(async () => Response.json({ ok: true, interpretation, subject: ["other"] }));
    await useInterpretations.getState().request("k", "/api", {}, ["x"]);
    expect(useInterpretations.getState().entries.k).toEqual({ status: "error", error: "mismatch" });
  });

  it("surfaces server error codes and allows a retry", async () => {
    mockFetch(async () => Response.json({ ok: false, error: "not_configured" }, { status: 503 }));
    await useInterpretations.getState().request("k", "/api", {}, ["x"]);
    expect(useInterpretations.getState().entries.k).toEqual({ status: "error", error: "not_configured" });
    const fetch = mockFetch(async () => Response.json({ ok: true, interpretation, subject: ["x"] }));
    await useInterpretations.getState().request("k", "/api", {}, ["x"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(useInterpretations.getState().entries.k?.status).toBe("success");
  });

  it("treats malformed responses and network failures as errors", async () => {
    mockFetch(async () => new Response("<html>oops</html>", { status: 500 }));
    await useInterpretations.getState().request("a", "/api", {}, ["x"]);
    expect(useInterpretations.getState().entries.a).toEqual({ status: "error", error: "invalid_output" });
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await useInterpretations.getState().request("b", "/api", {}, ["x"]);
    expect(useInterpretations.getState().entries.b).toEqual({ status: "error", error: "network" });
  });

  it("cancel aborts in flight and clears the entry", async () => {
    mockFetch(
      () =>
        new Promise<Response>((_, reject) => {
          setTimeout(() => reject(new DOMException("aborted", "AbortError")), 5);
        }),
    );
    const p = useInterpretations.getState().request("k", "/api", {}, ["x"]);
    useInterpretations.getState().cancel("k");
    await p;
    expect(useInterpretations.getState().entries.k).toBeUndefined();
  });
});
