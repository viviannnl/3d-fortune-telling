import { z } from "zod";
import { CATEGORIES, SPREAD_POSITIONS } from "@/features/tarot/types";
import { LOCALES } from "@/lib/i18n/dictionaries";

// ───────────────────────── requests (untrusted, from the browser) ─────────────────────────

export const LocaleSchema = z.enum(LOCALES);

export const TarotInterpretationRequestSchema = z
  .object({
    locale: LocaleSchema,
    category: z.enum(CATEGORIES),
    selections: z
      .array(
        z
          .object({
            cardId: z.string().max(64),
            orientation: z.enum(["upright", "reversed"]),
            position: z.enum(SPREAD_POSITIONS),
          })
          .strict(),
      )
      .length(3),
  })
  .strict();
export type TarotInterpretationRequest = z.infer<typeof TarotInterpretationRequestSchema>;

export const DESTINY_TOPICS = ["overview", "love", "career", "self"] as const;
export type DestinyTopic = (typeof DESTINY_TOPICS)[number];

export const DestinyInterpretationRequestSchema = z
  .object({
    locale: LocaleSchema,
    topic: z.enum(DESTINY_TOPICS),
    /** Birth details are only used to recompute the chart server-side; never forwarded to the model or logged. */
    birth: z
      .object({
        date: z.string().max(10),
        time: z.string().max(5).nullable(),
        timeZone: z.string().max(64),
        longitude: z.number().min(-180).max(180).nullable(),
        fold: z.enum(["earlier", "later"]).optional(),
      })
      .strict(),
  })
  .strict();
export type DestinyInterpretationRequest = z.infer<typeof DestinyInterpretationRequestSchema>;

// ───────────────────────── model output ─────────────────────────

/**
 * Shape requested from the model (structured output). Kept free of length
 * constraints, which the structured-output format does not guarantee; the
 * stricter `validateInterpretation` below enforces content rules.
 */
export const InterpretationWireSchema = z.object({
  overview: z.string(),
  items: z.array(z.object({ key: z.string(), title: z.string(), interpretation: z.string() })),
  themes: z.array(z.string()),
  reflectionQuestions: z.array(z.string()),
  suggestions: z.array(z.string()),
  shareableSummary: z.string(),
});

export const InterpretationSchema = z.object({
  overview: z.string().trim().min(40).max(1400),
  items: z.array(
    z.object({
      key: z.string(),
      title: z.string().trim().min(1).max(120),
      interpretation: z.string().trim().min(20).max(1600),
    }),
  ),
  themes: z.array(z.string().trim().min(1).max(80)).min(2).max(6),
  reflectionQuestions: z.array(z.string().trim().min(5).max(240)).min(2).max(5),
  suggestions: z.array(z.string().trim().min(5).max(280)).min(2).max(5),
  shareableSummary: z.string().trim().min(10).max(280),
});
export type Interpretation = z.infer<typeof InterpretationSchema>;

/**
 * Validates model output and checks it addresses exactly the expected items,
 * in order (e.g. the three card ids in spread order). Returns null if invalid.
 */
export function validateInterpretation(raw: unknown, expectedKeys: readonly string[]): Interpretation | null {
  const parsed = InterpretationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const keys = parsed.data.items.map((i) => i.key);
  if (keys.length !== expectedKeys.length || keys.some((k, i) => k !== expectedKeys[i])) return null;
  return parsed.data;
}

// ───────────────────────── API responses ─────────────────────────

export const INTERPRETATION_ERROR_CODES = [
  "invalid_request",
  "not_configured",
  "rate_limited",
  "timeout",
  "provider_error",
  "invalid_output",
  "refused",
  "payload_too_large",
] as const;
export type InterpretationErrorCode = (typeof INTERPRETATION_ERROR_CODES)[number];

export const InterpretationResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    interpretation: InterpretationSchema,
    /** Echo of exactly what was interpreted, so the client can confirm it matches the screen. */
    subject: z.array(z.string()),
  }),
  z.object({ ok: z.literal(false), error: z.enum(INTERPRETATION_ERROR_CODES) }),
]);
export type InterpretationResponse = z.infer<typeof InterpretationResponseSchema>;
