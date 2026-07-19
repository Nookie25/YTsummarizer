import { Innertube } from "youtubei.js";
import type { TranscriptSegment } from "@/lib/format";

export type { TranscriptSegment };

export interface VideoData {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  segments: TranscriptSegment[];
  /** which provider produced the transcript */
  source: "direct" | "supadata";
}

export class TranscriptError extends Error {
  constructor(
    message: string,
    public readonly code: "NO_CAPTIONS" | "FETCH_FAILED" | "VIDEO_UNAVAILABLE",
  ) {
    super(message);
  }
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extract a video ID from any common YouTube URL shape, or a bare ID. */
export function parseVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1];
    return VIDEO_ID_RE.test(id ?? "") ? id : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID_RE.test(v)) return v;
    const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

interface OEmbedData {
  title: string;
  author: string;
  thumbnail: string;
}

async function fetchMetadata(videoId: string): Promise<OEmbedData> {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new TranscriptError(
      "This video doesn't exist or can't be embedded.",
      "VIDEO_UNAVAILABLE",
    );
  }
  const data = await res.json();
  return {
    title: data.title ?? "Untitled video",
    author: data.author_name ?? "Unknown channel",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

let innertubePromise: Promise<Innertube> | null = null;
function getInnertube(): Promise<Innertube> {
  innertubePromise ??= Innertube.create({ retrieve_player: false });
  return innertubePromise;
}

interface CaptionTrack {
  base_url: string;
  language_code?: string;
  kind?: string; // "asr" for auto-generated
}

/** Prefer manually-written English, then auto English, then the first track. */
function pickCaptionTrack(tracks: CaptionTrack[]): CaptionTrack {
  const isEnglish = (t: CaptionTrack) => t.language_code?.toLowerCase().startsWith("en");
  return (
    tracks.find((t) => isEnglish(t) && t.kind !== "asr") ??
    tracks.find(isEnglish) ??
    tracks[0]
  );
}

/**
 * Primary provider: Innertube (youtubei.js). Free, works from residential IPs.
 * Uses the ANDROID client (the WEB client withholds caption tracks) and pulls
 * timed text as json3 from the track URL — the get_transcript endpoint 400s.
 */
async function fetchTranscriptDirect(videoId: string): Promise<TranscriptSegment[]> {
  const yt = await getInnertube();
  const info = await yt.getBasicInfo(videoId, { client: "ANDROID" });

  if (info.playability_status?.status && info.playability_status.status !== "OK") {
    throw new TranscriptError(
      "This video can't be accessed (private, members-only, or region-locked).",
      "VIDEO_UNAVAILABLE",
    );
  }

  const tracks = info.captions?.caption_tracks as CaptionTrack[] | undefined;
  if (!tracks?.length) {
    throw new TranscriptError("This video has no captions.", "NO_CAPTIONS");
  }

  const url = new URL(pickCaptionTrack(tracks).base_url);
  url.searchParams.set("fmt", "json3");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new TranscriptError(
      `YouTube timed-text request failed (HTTP ${res.status}).`,
      "FETCH_FAILED",
    );
  }

  const data: {
    events?: Array<{
      tStartMs?: number;
      dDurationMs?: number;
      segs?: Array<{ utf8?: string }>;
    }>;
  } = await res.json();

  const segments: TranscriptSegment[] = [];
  for (const event of data.events ?? []) {
    if (!event.segs) continue;
    const text = event.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    segments.push({
      start: (event.tStartMs ?? 0) / 1000,
      dur: (event.dDurationMs ?? 0) / 1000,
      text,
    });
  }
  if (!segments.length) {
    throw new TranscriptError("This video has no captions.", "NO_CAPTIONS");
  }
  return segments;
}

/** Fallback provider: Supadata API (needed on cloud IPs YouTube blocks). */
async function fetchTranscriptSupadata(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new TranscriptError("Supadata fallback not configured.", "FETCH_FAILED");
  }
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
    { headers: { "x-api-key": apiKey }, cache: "no-store" },
  );
  if (res.status === 404) {
    throw new TranscriptError("This video has no captions.", "NO_CAPTIONS");
  }
  if (!res.ok) {
    throw new TranscriptError(
      `Transcript service failed (HTTP ${res.status}).`,
      "FETCH_FAILED",
    );
  }
  const data = await res.json();
  const content: Array<{ text: string; offset: number; duration: number }> =
    data.content ?? [];
  if (!content.length) {
    throw new TranscriptError("This video has no captions.", "NO_CAPTIONS");
  }
  return content.map((item) => ({
    start: item.offset / 1000,
    dur: item.duration / 1000,
    text: item.text.trim(),
  }));
}

export async function fetchVideoData(videoId: string): Promise<VideoData> {
  const metadata = await fetchMetadata(videoId);

  let segments: TranscriptSegment[];
  let source: VideoData["source"] = "direct";
  try {
    segments = await fetchTranscriptDirect(videoId);
  } catch (err) {
    // NO_CAPTIONS from the direct provider is authoritative — don't retry
    if (err instanceof TranscriptError && err.code === "NO_CAPTIONS") throw err;
    if (!process.env.SUPADATA_API_KEY) {
      throw err instanceof TranscriptError
        ? err
        : new TranscriptError(
            "Couldn't fetch the transcript from YouTube.",
            "FETCH_FAILED",
          );
    }
    segments = await fetchTranscriptSupadata(videoId);
    source = "supadata";
  }

  return { videoId, ...metadata, segments, source };
}
