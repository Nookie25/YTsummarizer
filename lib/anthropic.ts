import Anthropic from "@anthropic-ai/sdk";
import { createTextStream } from "@/lib/stream";
import type { CompletionRequest } from "@/lib/ai-types";

export const MODEL = "claude-opus-4-8";

// Streaming default; Opus 4.8 supports up to 128k with streaming.
const MAX_OUTPUT_TOKENS = 64000;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function streamAnthropic(req: CompletionRequest): Response {
  const system: Anthropic.TextBlockParam[] = req.system.map((block) => ({
    type: "text",
    text: block.text,
    ...(block.cache ? { cache_control: { type: "ephemeral" as const } } : {}),
  }));

  return createTextStream(async (write) => {
    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: Math.min(req.maxTokens, MAX_OUTPUT_TOKENS),
      thinking: { type: "adaptive" },
      system,
      messages: req.messages,
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        write(event.delta.text);
      }
    }
  });
}
