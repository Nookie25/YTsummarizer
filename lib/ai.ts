// Single entry point the API routes use — picks the active provider via the
// AI_PROVIDER env var (default: anthropic) and dispatches to it. Routes never
// import lib/anthropic.ts or lib/openai.ts directly.

import type { CompletionRequest, Provider } from "@/lib/ai-types";
import { hasAnthropicKey, streamAnthropic } from "@/lib/anthropic";
import { hasOpenAIKey, streamOpenAI } from "@/lib/openai";

export function getProvider(): Provider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "openai"
    ? "openai"
    : "anthropic";
}

export function hasApiKey(): boolean {
  return getProvider() === "openai" ? hasOpenAIKey() : hasAnthropicKey();
}

export function missingKeyResponse(): Response {
  const provider = getProvider();
  const envVar = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
  return Response.json(
    {
      error: `The server is missing an API key for the active provider (${provider}). Add ${envVar} to .env.local (or your Vercel env vars) — or set AI_PROVIDER to switch providers — then restart.`,
    },
    { status: 500 },
  );
}

export function streamCompletion(req: CompletionRequest): Response {
  return getProvider() === "openai" ? streamOpenAI(req) : streamAnthropic(req);
}
