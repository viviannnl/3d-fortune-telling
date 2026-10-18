import { describe, expect, it, vi } from "vitest";
import { calculateChart } from "@/features/destiny/engine";
import { buildDestinyPrompt, buildTarotPrompt, type BuiltPrompt } from "@/features/interpretation/prompts";
import { validateInterpretation, type TarotInterpretationRequest } from "@/features/interpretation/schema";
import { MAJOR_ARCANA } from "@/features/tarot/cards";
import { handleInterpretation, MAX_BODY_BYTES } from "@/server/interpret";
import {
  createMockProvider,
  providerFromEnv,
  type InterpretationProvider,
  type ProviderResult,
} from "@/server/providers";
import { createRateLimiter } from "@/server/rateLimit";

const tarotReq: TarotInterpretationRequest = {
  locale: "en",
  category: "career",
  selections: [
    { cardId: "major-12-hanged-man", orientation: "upright", position: "past" },
    { cardId: "major-09-hermit", orientation: "reversed", position: "present" },
    { cardId: "major-18-moon", orientation: "upright", position: "future" },
  ],
};
const birth = { date: "1990-05-17", time: "08:45", timeZone: "Asia/Shanghai", longitude: 121.47 };
const destinyReq = { locale: "en", topic: "career", birth };

function goodOutput(keys: string[]) {
  return {
    overview: "A gentle reading about pausing, turning inward, and walking an uncertain path with care.",
    items: keys.map((key) => ({
      key,
      title: `Title ${key}`,
      interpretation: `A symbolic reflection about ${key}, offered tentatively.`,
    })),
    themes: ["Pause", "Inner light", "Uncertainty"],
    reflectionQuestions: ["What are you waiting for?", "What does quiet teach you?", "Where is the path unclear?"],
    suggestions: ["Take a short walk alone.", "Write down one question.", "Ask a friend for perspective."],
    shareableSummary: "A reflection on pausing and inner light.",
  };
}

function fakeProvider(result: (p: BuiltPrompt, signal: AbortSignal) => Promise<ProviderResult> | ProviderResult) {
  const calls: BuiltPrompt[] = [];
  const provider: InterpretationProvider = {
    generate: async (p, signal) => {
      calls.push(p);
      return result(p, signal);
    },
  };
  return { provider, calls };
}

const ok = (p: BuiltPrompt): ProviderResult => ({ kind: "ok", output: goodOutput(p.expectedKeys) });

describe("tarot prompt construction", () => {
  it("contains exactly the selected cards, orientations, positions, and their curated meanings", () => {
    const p = buildTarotPrompt(tarotReq);
    expect(p.expectedKeys).toEqual(tarotReq.selections.map((s) => s.cardId));
    for (const s of tarotReq.selections) {
      const card = MAJOR_ARCANA.find((c) => c.id === s.cardId);
      expect(p.user).toContain(`key: ${s.cardId}`);
      expect(p.user).toContain(`position: ${s.position}`);
      expect(p.user).toContain(`${card?.name.en} (${card?.name.zh}), ${s.orientation}`);
      expect(p.user).toContain(card?.[s.orientation].en);
      expect(p.user).toContain(card?.focus.career.en);
    }
    const others = MAJOR_ARCANA.filter((c) => !p.expectedKeys.includes(c.id));
    for (const c of others) expect(p.user).not.toContain(c.id);
    expect(p.system).toMatch(/never as prediction/);
    expect(p.system).toMatch(/death, illness/);
  });

  it("asks for Chinese output when the locale is zh", () => {
    expect(buildTarotPrompt({ ...tarotReq, locale: "zh" }).system).toContain("简体中文");
  });
});

describe("destiny prompt construction", () => {
  it("uses the calculated chart and conventions, and never the birth details", () => {
    const chart = calculateChart(birth);
    if (!chart.ok) throw new Error("chart");
    const p = buildDestinyPrompt(chart, "career", "en");
    expect(p.expectedKeys).toEqual(["year", "month", "day", "hour"]);
    for (const name of ["庚午", "辛巳", "壬午", "甲辰"]) expect(p.user).toContain(name);
    expect(p.user).toContain("bazi-mvp-1");
    expect(p.system).toMatch(/Never recalculate/);
    for (const secret of ["1990", "05-17", "08:45", "07:45", "Shanghai", "121.47"]) {
      expect(p.system + p.user).not.toContain(secret);
    }
  });

  it("omits the hour pillar and flags ambiguity when the time is unknown", () => {
    const chart = calculateChart({ date: "2024-02-04", time: null, timeZone: "Asia/Shanghai", longitude: null });
    if (!chart.ok) throw new Error("chart");
    const p = buildDestinyPrompt(chart, "overview", "en");
    expect(p.expectedKeys).toEqual(["year", "month", "day"]);
    expect(p.user).toMatch(/birth time is unknown/);
    expect(p.user).toMatch(/year pillar is uncertain/);
  });
});

describe("output validation", () => {
  const keys = ["a", "b", "c"];
  it("accepts a well-formed response with the expected keys in order", () => {
    expect(validateInterpretation(goodOutput(keys), keys)).not.toBeNull();
  });
  it.each([
    ["wrong order", { ...goodOutput(["b", "a", "c"]) }],
    ["missing item", { ...goodOutput(["a", "b"]) }],
    ["extra item", { ...goodOutput(["a", "b", "c", "d"]) }],
    ["empty overview", { ...goodOutput(keys), overview: "" }],
    ["too few themes", { ...goodOutput(keys), themes: ["x"] }],
    ["long summary", { ...goodOutput(keys), shareableSummary: "x".repeat(400) }],
    [
      "missing field",
      (() => {
        const o: Record<string, unknown> = { ...goodOutput(keys) };
        delete o.suggestions;
        return o;
      })(),
    ],
    ["not an object", "nope"],
    ["null", null],
  ])("rejects %s", (_label, raw) => {
    expect(validateInterpretation(raw, keys)).toBeNull();
  });
});

describe("handleInterpretation", () => {
  it("tarot: success echoes exactly the interpreted spread", async () => {
    const { provider, calls } = fakeProvider(ok);
    const res = await handleInterpretation("tarot", JSON.stringify(tarotReq), provider);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      subject: ["past:major-12-hanged-man:upright", "present:major-09-hermit:reversed", "future:major-18-moon:upright"],
    });
    expect(calls).toHaveLength(1);
  });

  it.each([
    [
      "duplicate cards",
      {
        ...tarotReq,
        selections: [
          tarotReq.selections[0],
          { ...tarotReq.selections[0], position: "present" },
          tarotReq.selections[2],
        ],
      },
    ],
    [
      "positions out of order",
      { ...tarotReq, selections: [tarotReq.selections[1], tarotReq.selections[0], tarotReq.selections[2]] },
    ],
    [
      "unknown card",
      {
        ...tarotReq,
        selections: [
          { ...tarotReq.selections[0], cardId: "major-99-nope" },
          tarotReq.selections[1],
          tarotReq.selections[2],
        ],
      },
    ],
    ["two cards", { ...tarotReq, selections: tarotReq.selections.slice(0, 2) }],
    [
      "bad orientation",
      {
        ...tarotReq,
        selections: [{ ...tarotReq.selections[0], orientation: "sideways" }, ...tarotReq.selections.slice(1)],
      },
    ],
    ["extra field (e.g. client-supplied meanings)", { ...tarotReq, meanings: "trust me" }],
  ])("tarot: rejects %s without calling the provider", async (_label, body) => {
    const { provider, calls } = fakeProvider(ok);
    const res = await handleInterpretation("tarot", JSON.stringify(body), provider);
    expect(res).toEqual({ status: 400, body: { ok: false, error: "invalid_request" } });
    expect(calls).toHaveLength(0);
  });

  it("rejects malformed JSON and oversized bodies", async () => {
    const { provider } = fakeProvider(ok);
    expect((await handleInterpretation("tarot", "{not json", provider)).status).toBe(400);
    expect((await handleInterpretation("tarot", "x".repeat(MAX_BODY_BYTES + 1), provider)).body).toEqual({
      ok: false,
      error: "payload_too_large",
    });
  });

  it("reports missing configuration only after validating the request", async () => {
    expect(await handleInterpretation("tarot", JSON.stringify(tarotReq), null)).toEqual({
      status: 503,
      body: { ok: false, error: "not_configured" },
    });
    expect((await handleInterpretation("tarot", "{}", null)).status).toBe(400);
  });

  it.each([
    [{ kind: "refused" } as const, 422, "refused"],
    [{ kind: "rate_limited" } as const, 429, "rate_limited"],
    [{ kind: "provider_error" } as const, 502, "provider_error"],
    [{ kind: "invalid_output" } as const, 502, "invalid_output"],
  ])("maps provider failure %j", async (result, status, error) => {
    const { provider } = fakeProvider(() => result);
    expect(await handleInterpretation("tarot", JSON.stringify(tarotReq), provider)).toEqual({
      status,
      body: { ok: false, error },
    });
  });

  it("treats schema-violating model output as invalid_output, never passing it through", async () => {
    const { provider } = fakeProvider((p) => ({ kind: "ok", output: { ...goodOutput(p.expectedKeys), items: [] } }));
    expect((await handleInterpretation("tarot", JSON.stringify(tarotReq), provider)).body).toEqual({
      ok: false,
      error: "invalid_output",
    });
    const { provider: wrongCards } = fakeProvider(() => ({
      kind: "ok",
      output: goodOutput(["major-00-fool", "major-01-magician", "major-02-high-priestess"]),
    }));
    expect((await handleInterpretation("tarot", JSON.stringify(tarotReq), wrongCards)).body).toEqual({
      ok: false,
      error: "invalid_output",
    });
  });

  it("times out a slow provider via the abort signal", async () => {
    const { provider } = fakeProvider(
      (_p, signal) =>
        new Promise<ProviderResult>((resolve) => signal.addEventListener("abort", () => resolve({ kind: "timeout" }))),
    );
    const res = await handleInterpretation("tarot", JSON.stringify(tarotReq), provider, 30);
    expect(res).toEqual({ status: 504, body: { ok: false, error: "timeout" } });
  });

  it("destiny: recomputes the chart server-side and never forwards birth details", async () => {
    const { provider, calls } = fakeProvider(ok);
    const res = await handleInterpretation("destiny", JSON.stringify(destinyReq), provider);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, subject: ["庚午", "辛巳", "壬午", "甲辰"] });
    const sent = calls[0].system + calls[0].user;
    for (const secret of ["1990-05-17", "08:45", "Asia/Shanghai", "121.47"]) expect(sent).not.toContain(secret);
  });

  it("destiny: invalid or unchartable birth input is rejected before the provider", async () => {
    const { provider, calls } = fakeProvider(ok);
    for (const b of [
      { ...birth, date: "2023-02-30" },
      { ...birth, date: "2023-03-12", time: "02:30", timeZone: "America/New_York" },
      { ...birth, timeZone: "Nowhere/Land" },
    ]) {
      expect(
        (await handleInterpretation("destiny", JSON.stringify({ ...destinyReq, birth: b }), provider)).status,
      ).toBe(400);
    }
    expect(calls).toHaveLength(0);
  });

  it("does not log request bodies on failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { provider } = fakeProvider(() => ({ kind: "provider_error" }));
    await handleInterpretation("destiny", JSON.stringify(destinyReq), provider);
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).toContain("provider_error");
    expect(logged).not.toContain("1990");
    warn.mockRestore();
  });

  it("the mock provider produces schema-valid output for both kinds", async () => {
    for (const [kind, body] of [
      ["tarot", tarotReq],
      ["destiny", destinyReq],
    ] as const) {
      expect((await handleInterpretation(kind, JSON.stringify(body), createMockProvider())).status).toBe(200);
    }
  });
});

describe("configuration and limits", () => {
  it("providerFromEnv: null without a key, mock on request", () => {
    expect(providerFromEnv({} as NodeJS.ProcessEnv)).toBeNull();
    expect(providerFromEnv({ ANTHROPIC_API_KEY: "  " } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(providerFromEnv({ INTERPRETATION_PROVIDER: "mock" } as unknown as NodeJS.ProcessEnv)).not.toBeNull();
  });

  it("rate limiter allows N per window per client", () => {
    const rl = createRateLimiter(2, 1000);
    expect([rl.check("a", 0), rl.check("a", 10), rl.check("a", 20), rl.check("b", 20)]).toEqual([
      true,
      true,
      false,
      true,
    ]);
    expect(rl.check("a", 1500)).toBe(true);
  });
});
