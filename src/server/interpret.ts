import "server-only";
import { calculateChart } from "@/features/destiny/engine";
import { buildDestinyPrompt, buildTarotPrompt, type BuiltPrompt } from "@/features/interpretation/prompts";
import {
  DestinyInterpretationRequestSchema,
  TarotInterpretationRequestSchema,
  validateInterpretation,
  type InterpretationErrorCode,
  type InterpretationResponse,
} from "@/features/interpretation/schema";
import { getCard } from "@/features/tarot/cards";
import { SPREAD_POSITIONS } from "@/features/tarot/types";
import type { InterpretationProvider } from "./providers";

export const MAX_BODY_BYTES = 4096;
export const PROVIDER_TIMEOUT_MS = 60_000;

export type InterpretKind = "tarot" | "destiny";

export interface HandlerResult {
  status: number;
  body: InterpretationResponse;
}

const STATUS: Record<InterpretationErrorCode, number> = {
  invalid_request: 400,
  payload_too_large: 413,
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  provider_error: 502,
  invalid_output: 502,
  refused: 422,
};

const fail = (error: InterpretationErrorCode): HandlerResult => ({ status: STATUS[error], body: { ok: false, error } });

type Prepared = { prompt: BuiltPrompt; subject: string[] } | null;

function prepareTarot(json: unknown): Prepared {
  const parsed = TarotInterpretationRequestSchema.safeParse(json);
  if (!parsed.success) return null;
  const { selections } = parsed.data;
  // Exactly Past, Present, Future in order; three distinct, known cards.
  if (selections.some((s, i) => s.position !== SPREAD_POSITIONS[i])) return null;
  if (new Set(selections.map((s) => s.cardId)).size !== 3) return null;
  if (selections.some((s) => !getCard(s.cardId))) return null;
  return {
    prompt: buildTarotPrompt(parsed.data),
    subject: selections.map((s) => `${s.position}:${s.cardId}:${s.orientation}`),
  };
}

function prepareDestiny(json: unknown): Prepared {
  const parsed = DestinyInterpretationRequestSchema.safeParse(json);
  if (!parsed.success) return null;
  // Recompute the chart with the same engine: the client can't supply or alter pillars.
  const chart = calculateChart(parsed.data.birth);
  if (!chart.ok) return null;
  const p = chart.pillars;
  return {
    prompt: buildDestinyPrompt(chart, parsed.data.topic, parsed.data.locale),
    subject: [p.year.name, p.month.name, p.day.name, p.hour?.name ?? ""],
  };
}

/**
 * Framework-independent request handling so it can be unit-tested with a fake provider.
 * Never logs request bodies (they may contain birth details).
 */
export async function handleInterpretation(
  kind: InterpretKind,
  rawBody: string,
  provider: InterpretationProvider | null,
  timeoutMs = PROVIDER_TIMEOUT_MS,
): Promise<HandlerResult> {
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) return fail("payload_too_large");
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return fail("invalid_request");
  }
  const prepared = kind === "tarot" ? prepareTarot(json) : prepareDestiny(json);
  if (!prepared) return fail("invalid_request");
  if (!provider) return fail("not_configured");

  const signal = AbortSignal.timeout(timeoutMs);
  const result = await provider.generate(prepared.prompt, signal);
  if (result.kind !== "ok") {
    console.warn(`[interpret] ${kind} failed: ${result.kind}`);
    return fail(result.kind);
  }
  const interpretation = validateInterpretation(result.output, prepared.prompt.expectedKeys);
  if (!interpretation) {
    console.warn(`[interpret] ${kind} failed: invalid_output`);
    return fail("invalid_output");
  }
  return { status: 200, body: { ok: true, interpretation, subject: prepared.subject } };
}
