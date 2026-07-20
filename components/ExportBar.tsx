"use client";

import { useState, type ReactNode } from "react";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "summary"
  );
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ExportButton({
  label,
  doneLabel,
  icon,
  onClick,
}: {
  label: string;
  doneLabel?: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await onClick();
        if (doneLabel) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      className="btn-ghost !gap-2 !rounded-xl !px-4 !py-2.5 text-[13px]"
    >
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} stroke="#22C55E" aria-hidden>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        icon
      )}
      {done ? doneLabel : label}
    </button>
  );
}

export default function ExportBar({
  title,
  markdown,
  videoId,
}: {
  title: string;
  markdown: string;
  videoId: string;
}) {
  const fullMarkdown = `# ${title}\n\n${markdown}`;

  return (
    <div className="print-hide flex flex-wrap items-center gap-2.5">
      <ExportButton
        label="Copy"
        doneLabel="Copied"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        }
        onClick={() => navigator.clipboard.writeText(fullMarkdown)}
      />
      <ExportButton
        label="Markdown"
        doneLabel="Saved"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5M12 15V3" />
          </svg>
        }
        onClick={() => downloadFile(`${slugify(title)}.md`, fullMarkdown, "text/markdown")}
      />
      <ExportButton
        label="PDF"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        }
        onClick={() => window.print()}
      />
      <ExportButton
        label="Copy for Notion"
        doneLabel="Copied"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 8v8M8 8l8 8V8" />
          </svg>
        }
        onClick={() => navigator.clipboard.writeText(fullMarkdown)}
      />
      <ExportButton
        label="Share"
        doneLabel="Link copied"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        }
        onClick={() =>
          navigator.clipboard.writeText(`${window.location.origin}/?v=${videoId}`)
        }
      />
    </div>
  );
}
