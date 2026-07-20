import { NextResponse } from "next/server";
import { hasApiKey, missingKeyResponse, streamCompletion } from "@/lib/ai";
import { buildVideoContext, CHAT_SYSTEM_INTRO, truncateTranscript } from "@/lib/prompts";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ChatBody {
  title?: string;
  author?: string;
  transcript?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function POST(req: Request) {
  if (!hasApiKey()) return missingKeyResponse();

  const rate = await checkRateLimit(`chat:${clientIp(req)}`, {
    limit: 40,
    windowSeconds: 3600,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Chat rate limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { title, author, transcript, messages } = body;
  if (
    typeof title !== "string" ||
    typeof author !== "string" ||
    typeof transcript !== "string" ||
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 60 ||
    !messages.every(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length <= 8000,
    ) ||
    messages[messages.length - 1].role !== "user"
  ) {
    return NextResponse.json({ error: "Invalid chat payload." }, { status: 400 });
  }

  const { text } = truncateTranscript(transcript);

  // The transcript block is marked cacheable so follow-up questions about the
  // same video are served from the provider's prompt cache (Anthropic:
  // explicit cache_control; OpenAI: automatic for repeated stable prefixes).
  return streamCompletion({
    system: [
      { text: CHAT_SYSTEM_INTRO },
      { text: buildVideoContext(title, author, text), cache: true },
    ],
    messages,
    maxTokens: 16000,
  });
}
