"use client";

import { useState } from "react";
import Markdown from "@/components/Markdown";

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "summary"
  );
}

export default function SummaryPanel({
  title,
  summary,
  isStreaming,
  error,
  onSeek,
  onRegenerate,
}: {
  title: string;
  summary: string;
  isStreaming: boolean;
  error: string | null;
  onSeek: (seconds: number) => void;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasContent = summary.trim().length > 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {isStreaming ? (
            <span className="flex items-center gap-2">
              <span className="rec-dot inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              Summarizing…
            </span>
          ) : (
            "AI Summary"
          )}
        </span>
        {hasContent && !isStreaming && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={copy}
              className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(`${slugify(title)}.md`, `# ${title}\n\n${summary}`, "text/markdown")
              }
              className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
            >
              .md
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  `${slugify(title)}.txt`,
                  `${title}\n\n${summary.replace(/^#{2,3} /gm, "").replace(/\*\*/g, "")}`,
                  "text/plain",
                )
              }
              className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
            >
              .txt
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              title="Regenerate summary"
              className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
            >
              ↻
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-signal/30 bg-signal/5 p-4 text-sm text-cream-dim">
          <p className="mb-2 font-semibold text-signal">Couldn&apos;t generate the summary</p>
          <p>{error}</p>
          <button
            type="button"
            onClick={onRegenerate}
            className="mt-3 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-cream transition-colors hover:border-line-strong"
          >
            Try again
          </button>
        </div>
      ) : !hasContent && isStreaming ? (
        <div className="space-y-3 py-2" aria-hidden>
          {[92, 100, 78, 96, 60].map((w, i) => (
            <div
              key={i}
              className="h-3.5 animate-pulse rounded bg-raised"
              style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className={isStreaming ? "stream-caret" : undefined}>
          <Markdown text={summary} onSeek={onSeek} />
        </div>
      )}
    </div>
  );
}
