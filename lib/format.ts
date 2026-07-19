// Pure helpers shared by server routes and client components.

export interface TranscriptSegment {
  /** start time in seconds */
  start: number;
  /** duration in seconds */
  dur: number;
  text: string;
}

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Parse "mm:ss" / "h:mm:ss" back into seconds. Returns null if malformed. */
export function parseTimestamp(ts: string): number | null {
  const parts = ts.split(":").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/** Join segments into `[mm:ss] text` lines for the model prompts. */
export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`)
    .join("\n");
}
