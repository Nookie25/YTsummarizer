"use client";

import { forwardRef } from "react";
import VideoPlayer, { type VideoPlayerHandle } from "@/components/VideoPlayer";
import { formatTimestamp, type TranscriptSegment } from "@/lib/format";

const VideoHeader = forwardRef<
  VideoPlayerHandle,
  {
    videoId: string;
    title: string;
    author: string;
    segments: TranscriptSegment[];
    readingMin: number | null;
  }
>(function VideoHeader({ videoId, title, author, segments, readingMin }, ref) {
  const last = segments[segments.length - 1];
  const duration = last ? formatTimestamp(last.start + last.dur) : null;

  return (
    <header className="grid items-start gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="print-hide overflow-hidden rounded-[18px] border border-line bg-black shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
        <VideoPlayer ref={ref} videoId={videoId} />
      </div>
      <div className="lg:pt-2">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-text sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2.5 text-[14px] text-text2">{author}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {duration && (
            <span className="rounded-full border border-line bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-text2">
              {duration} video
            </span>
          )}
          {readingMin != null && (
            <span className="rounded-full border border-indigo/30 bg-indigo/10 px-3 py-1.5 font-mono text-[11px] text-glow">
              {readingMin} min read
            </span>
          )}
          <span className="rounded-full border border-line bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-text2">
            {segments.length} caption lines
          </span>
        </div>
      </div>
    </header>
  );
});

export default VideoHeader;
