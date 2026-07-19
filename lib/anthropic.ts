import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-4-8";

// ~600k chars ≈ well under the 1M-token context window even for dense text.
export const MAX_TRANSCRIPT_CHARS = 600_000;

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function truncateTranscript(transcript: string): {
  text: string;
  truncated: boolean;
} {
  if (transcript.length <= MAX_TRANSCRIPT_CHARS) {
    return { text: transcript, truncated: false };
  }
  return {
    text: transcript.slice(0, MAX_TRANSCRIPT_CHARS),
    truncated: true,
  };
}

export const SUMMARY_SYSTEM = `You are an expert video analyst. You are given the transcript of a YouTube video, where each line starts with a [mm:ss] or [h:mm:ss] timestamp.

Write a summary in EXACTLY this markdown structure:

## Overview
2-3 sentences capturing what the video is about and its single most important takeaway.

## Summary
Cover the video's content in order, grouped under ### subheadings you choose. Write clear prose (short paragraphs, occasional bullet lists where they help). Include the key arguments, facts, numbers, and examples from the transcript — do not pad or invent anything that isn't in it.

## Key Moments
6-12 bullets, each in the form:
- [mm:ss] **Short label** — one sentence on what happens at that moment.

Rules for timestamps: copy them from the transcript lines (the moment where that topic begins). Never invent a timestamp. Keep the same [..] bracket format so they stay clickable.

General rules: plain language over jargon; keep the total length proportional to the video (short video → short summary); no preamble before "## Overview" and nothing after the last key moment.`;

export const CHAT_SYSTEM_INTRO = `You are a helpful assistant answering questions about one specific YouTube video. The full transcript follows, with [mm:ss] timestamps at the start of each line.

Rules:
- Answer from the transcript. If the answer isn't in the video, say so plainly — don't guess.
- When you reference a specific part of the video, cite its timestamp in the same [mm:ss] bracket format so it stays clickable.
- Keep answers conversational and concise. Use markdown sparingly (bullets when listing, bold for key terms).`;

export function buildVideoContext(title: string, author: string, transcript: string): string {
  return `VIDEO TITLE: ${title}\nCHANNEL: ${author}\n\nTRANSCRIPT:\n${transcript}`;
}

/** Turn an SDK message stream into a plain-text web ReadableStream. */
export function textStreamResponse(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("stream error:", err);
        controller.enqueue(
          encoder.encode("\n\n> ⚠️ The response was interrupted. Please try again."),
        );
        controller.close();
      }
    },
  });
  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function missingKeyResponse(): Response {
  return Response.json(
    {
      error:
        "The server is missing an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local (or your Vercel env vars) and restart.",
    },
    { status: 500 },
  );
}
