// Provider-agnostic prompt text and transcript helpers, shared by whichever
// AI backend is active (see lib/ai.ts).

// ~600k chars ≈ well under any current model's context window even for dense text.
export const MAX_TRANSCRIPT_CHARS = 600_000;

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

export const SUMMARY_SYSTEM = `You are an expert knowledge analyst. You are given the transcript of a YouTube video, where each line starts with a [mm:ss] or [h:mm:ss] timestamp.

Produce a structured knowledge summary in EXACTLY this markdown structure, with these exact section headings, in this exact order:

## TL;DR
2-3 sentences capturing what the video is about and its single most important takeaway.

## Key Insights
5-8 bullets. Each bullet MUST be in the form:
- **Short label** — 1-2 sentences explaining the insight, including the key facts, numbers, or examples from the transcript.

## Timeline
6-12 bullets covering the video in order. Each bullet MUST be in the form:
- [mm:ss] **Chapter title** — one sentence on what is covered starting at that moment.

## Action Items
2-6 bullets, each an imperative, concrete action a viewer could take based on the video's advice ("- Do X ..."). If the video contains no actionable advice, write exactly:
- None

## Notable Quotes
2-4 bullets. Each bullet MUST be in the form:
- "Exact or lightly cleaned-up quote from the transcript." — [mm:ss]

Rules for timestamps: copy them from the transcript lines (the moment where that topic or quote begins). Never invent a timestamp. Always keep the [..] bracket format.

General rules: plain language over jargon; ground everything in the transcript — do not pad or invent; keep total length proportional to the video (short video → short summary); no preamble before "## TL;DR" and nothing after the last quote.`;

export const CHAT_SYSTEM_INTRO = `You are a helpful assistant answering questions about one specific YouTube video. The full transcript follows, with [mm:ss] timestamps at the start of each line.

Rules:
- Answer from the transcript. If the answer isn't in the video, say so plainly — don't guess.
- When you reference a specific part of the video, cite its timestamp in SQUARE BRACKETS exactly as it appears in the transcript, e.g. [3:04] or [12:32]. Never use parentheses like (3:04) — only square brackets are rendered as clickable links.
- Keep answers conversational and concise. Use markdown sparingly (bullets when listing, bold for key terms).`;

export function buildVideoContext(title: string, author: string, transcript: string): string {
  return `VIDEO TITLE: ${title}\nCHANNEL: ${author}\n\nTRANSCRIPT:\n${transcript}`;
}
