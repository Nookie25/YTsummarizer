"use client";

import { useState } from "react";
import { formatTimestamp, type TranscriptSegment } from "@/lib/format";

export default function TranscriptDrawer({
  segments,
  onSeek,
}: {
  segments: TranscriptSegment[];
  onSeek: (seconds: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="print-hide card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-text2">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Full Transcript
          </span>
          <span className="text-[12px] text-muted">· {segments.length} lines</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="panel-scroll max-h-[420px] overflow-y-auto border-t border-line px-3 py-3">
          <ol>
            {segments.map((seg, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onSeek(seg.start)}
                  className="group flex w-full gap-3.5 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className="shrink-0 pt-px font-mono text-[11px] leading-5 text-glow/70 group-hover:text-glow">
                    {formatTimestamp(seg.start)}
                  </span>
                  <span className="text-[13px] leading-5 text-text2 group-hover:text-text">
                    {seg.text}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
