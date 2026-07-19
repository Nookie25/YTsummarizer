// Shared shapes used by the provider-agnostic dispatcher (lib/ai.ts) and both
// provider implementations (lib/anthropic.ts, lib/openai.ts).

export type Provider = "anthropic" | "openai";

export interface SystemBlock {
  text: string;
  /** Mark as a large, stable block (e.g. the video transcript) worth caching. */
  cache?: boolean;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  system: SystemBlock[];
  messages: ChatTurn[];
  /** Requested output budget; each provider clamps to its own ceiling. */
  maxTokens: number;
}
