import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { InterpretationWireSchema } from "@/features/interpretation/schema";
import type { BuiltPrompt } from "@/features/interpretation/prompts";

export type ProviderResult =
  | { kind: "ok"; output: unknown }
  | { kind: "refused" }
  | { kind: "invalid_output" }
  | { kind: "rate_limited" }
  | { kind: "timeout" }
  | { kind: "provider_error" };

export interface InterpretationProvider {
  generate(prompt: BuiltPrompt, signal: AbortSignal): Promise<ProviderResult>;
}

export const DEFAULT_MODEL = "claude-opus-5-5";

export function createAnthropicProvider(apiKey: string, model = DEFAULT_MODEL): InterpretationProvider {
  const client = new Anthropic({ apiKey, maxRetries: 1 });
  return {
    async generate(prompt, signal) {
      try {
        const response = await client.beta.messages.parse(
          {
            model,
            max_tokens: 16000,
            // Adaptive thinking is the default on this model; effort is set explicitly.
            output_config: { effort: "medium", format: betaZodOutputFormat(InterpretationWireSchema) },
            // On a policy decline, re-run on Anthropic's recommended fallback model.
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: prompt.system,
            messages: [{ role: "user", content: prompt.user }],
          },
          { signal },
        );
        if (response.stop_reason === "refusal") return { kind: "refused" };
        if (response.stop_reason === "max_tokens" || response.parsed_output == null) return { kind: "invalid_output" };
        return { kind: "ok", output: response.parsed_output };
      } catch (error) {
        if (signal.aborted || error instanceof Anthropic.APIUserAbortError) return { kind: "timeout" };
        if (error instanceof Anthropic.RateLimitError) return { kind: "rate_limited" };
        if (error instanceof Anthropic.APIConnectionTimeoutError) return { kind: "timeout" };
        if (error instanceof SyntaxError) return { kind: "invalid_output" }; // malformed JSON from the parse helper
        return { kind: "provider_error" };
      }
    },
  };
}

/**
 * Deterministic offline provider for local development and end-to-end tests.
 * Builds clearly-labelled placeholder prose from the expected keys only.
 */
export function createMockProvider(): InterpretationProvider {
  return {
    async generate(prompt) {
      const zh = prompt.system.includes("简体中文");
      return {
        kind: "ok",
        output: {
          overview: zh
            ? "（演示模式）这是一段由本地演示服务生成的示例解读，用于在未连接 AI 服务时检验界面与数据流程。"
            : "(Demo mode) This sample reflection comes from the local demo provider, used to check the interface and data flow without an AI service.",
          items: prompt.expectedKeys.map((key) => ({
            key,
            title: zh ? `关于 ${key}` : `On ${key}`,
            interpretation: zh
              ? `演示文本：此处将针对「${key}」给出象征性的反思，而不是预测。`
              : `Demo text: a symbolic reflection on "${key}" would appear here, offered as reflection rather than prediction.`,
          })),
          themes: zh ? ["耐心", "好奇", "温柔"] : ["Patience", "Curiosity", "Gentleness"],
          reflectionQuestions: zh
            ? ["此刻什么最值得你留意？", "你想以怎样的节奏前进？", "哪些事情可以暂时放下？"]
            : [
                "What feels most worth noticing right now?",
                "What pace feels kind to you?",
                "What could you set down for a while?",
              ],
          suggestions: zh
            ? ["写下一个让你安心的小习惯。", "给自己留一段安静的时间。", "与信任的人聊聊近况。"]
            : [
                "Write down one small habit that steadies you.",
                "Keep a quiet half hour for yourself.",
                "Talk with someone you trust about how things are.",
              ],
          shareableSummary: zh ? "一次关于耐心与好奇的安静反思。" : "A quiet reflection on patience and curiosity.",
        },
      };
    },
  };
}

/** Chooses the provider from server-only configuration. Returns null when not configured. */
export function providerFromEnv(env: NodeJS.ProcessEnv = process.env): InterpretationProvider | null {
  if (env.INTERPRETATION_PROVIDER === "mock") return createMockProvider();
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return createAnthropicProvider(key, env.INTERPRETATION_MODEL?.trim() || DEFAULT_MODEL);
}
