import OpenAI from "openai";
import { createTextStream } from "@/lib/stream";
import type { CompletionRequest } from "@/lib/ai-types";

// gpt-4o is the default: a stable, widely-available Chat Completions model
// with good streaming support. Override via OPENAI_MODEL for a different one
// (reasoning-only models like o1/o3 use a different params shape and aren't
// supported by this integration as-is).
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// gpt-4o's output ceiling; OpenAI automatically caches repeated prompt
// prefixes over ~1024 tokens, so no explicit cache_control is needed here —
// the transcript block just needs to stay byte-identical across turns, which
// it already does (see app/api/chat/route.ts).
const MAX_OUTPUT_TOKENS = 16384;

let client: OpenAI | null = null;
function getClient(): OpenAI {
  client ??= new OpenAI();
  return client;
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function streamOpenAI(req: CompletionRequest): Response {
  const systemText = req.system.map((block) => block.text).join("\n\n");
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemText },
    ...req.messages,
  ];

  return createTextStream(async (write) => {
    const stream = await getClient().chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: Math.min(req.maxTokens, MAX_OUTPUT_TOKENS),
      stream: true,
      messages,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) write(delta);
    }
  });
}
