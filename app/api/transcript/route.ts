import { NextResponse } from "next/server";
import { fetchVideoData, parseVideoId, TranscriptError } from "@/lib/youtube";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rate = await checkRateLimit(`transcript:${clientIp(req)}`, {
    limit: 20,
    windowSeconds: 3600,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof url !== "string") {
    return NextResponse.json({ error: "Missing YouTube URL." }, { status: 400 });
  }

  const videoId = parseVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "That doesn't look like a YouTube link. Paste a video URL like https://youtube.com/watch?v=..." },
      { status: 400 },
    );
  }

  try {
    const data = await fetchVideoData(videoId);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof TranscriptError) {
      const status = err.code === "NO_CAPTIONS" || err.code === "VIDEO_UNAVAILABLE" ? 404 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    log.error("transcript route error", err, { videoId });
    return NextResponse.json(
      { error: "Couldn't fetch the transcript. Please try again." },
      { status: 502 },
    );
  }
}
