import { NextResponse } from "next/server";
import { hasApiKey, missingKeyResponse, streamCompletion } from "@/lib/ai";
import { buildVideoContext, SUMMARY_SYSTEM, truncateTranscript } from "@/lib/prompts";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!hasApiKey()) return missingKeyResponse();

  const rate = checkRateLimit(`summarize:${clientIp(req)}`, {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Summary rate limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: { title?: string; author?: string; transcript?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { title, author, transcript } = body;
  if (
    typeof title !== "string" ||
    typeof author !== "string" ||
    typeof transcript !== "string" ||
    !transcript.trim()
  ) {
    return NextResponse.json({ error: "Missing transcript." }, { status: 400 });
  }

  const { text, truncated } = truncateTranscript(transcript);
  const context = buildVideoContext(title, author, text);

  return streamCompletion({
    system: [{ text: SUMMARY_SYSTEM }],
    messages: [
      {
        role: "user",
        content: truncated
          ? `${context}\n\n(Note: the transcript was truncated for length — summarize what is present.)`
          : context,
      },
    ],
    maxTokens: 64000,
  });
}
