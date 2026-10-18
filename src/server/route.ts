import "server-only";
import { handleInterpretation, MAX_BODY_BYTES, type InterpretKind } from "./interpret";
import { providerFromEnv } from "./providers";
import { createRateLimiter } from "./rateLimit";

const limiter = createRateLimiter(8, 60_000);

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/** Shared POST handler for both interpretation routes. */
export function interpretationRoute(kind: InterpretKind) {
  return async function POST(request: Request): Promise<Response> {
    const headers = { "cache-control": "no-store" };
    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return Response.json({ ok: false, error: "invalid_request" }, { status: 415, headers });
    }
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES)
      return Response.json({ ok: false, error: "payload_too_large" }, { status: 413, headers });
    if (!limiter.check(clientKey(request))) {
      return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers });
    }
    const body = await request.text();
    const result = await handleInterpretation(kind, body, providerFromEnv());
    return Response.json(result.body, { status: result.status, headers });
  };
}
