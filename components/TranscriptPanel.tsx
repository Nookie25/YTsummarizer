"use client";

import { formatTimestamp, type TranscriptSegment } from "@/lib/format";

export default function TranscriptPanel({
  segments,
  onSeek,
}: {
  segments: TranscriptSegment[];
  onSeek: (seconds: number) => void;
}) {
  return (
    <div className="panel-scroll max-h-[50dvh] overflow-y-auto lg:max-h-[calc(100dvh-30rem)]">
      <ol className="space-y-0.5 pr-2">
        {segments.map((seg, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSeek(seg.start)}
              className="group flex w-full gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-raised"
            >
              <span className="shrink-0 pt-px font-mono text-[11px] leading-5 text-timecode/80 group-hover:text-timecode">
                {formatTimestamp(seg.start)}
              </span>
              <span className="text-[13px] leading-5 text-cream-dim group-hover:text-cream">
                {seg.text}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
