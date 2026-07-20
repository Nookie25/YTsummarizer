"use client";

import { Fragment, type ReactNode } from "react";
import { parseTimestamp } from "@/lib/format";

// Inline text renderer shared across the workspace: turns [mm:ss] tokens into
// clickable timestamp chips and handles **bold** / *italic* / `code`.

const TIMECODE_RE = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function renderStyled(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    const key = `${keyPrefix}-s${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-bg2 px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function renderInline(
  text: string,
  onSeek: (seconds: number) => void,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(TIMECODE_RE)) {
    const index = match.index ?? 0;
    if (index > last) {
      nodes.push(...renderStyled(text.slice(last, index), `${keyPrefix}-${i}`));
    }
    const ts = match[1];
    const seconds = parseTimestamp(ts);
    nodes.push(
      <button
        key={`${keyPrefix}-t${i}`}
        type="button"
        className="ts-chip"
        onClick={() => seconds != null && onSeek(seconds)}
        aria-label={`Jump to ${ts}`}
        title={`Jump to ${ts}`}
      >
        {ts}
      </button>,
    );
    last = index + match[0].length;
    i += 1;
  }
  if (last < text.length) {
    nodes.push(...renderStyled(text.slice(last), `${keyPrefix}-end`));
  }
  return nodes;
}

/** Light block renderer for chat replies (paragraphs + bullets + inline). */
export function ChatMarkdown({
  text,
  onSeek,
}: {
  text: string;
  onSeek: (seconds: number) => void;
}) {
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[-*] /.test(line)) {
      const prev = blocks[blocks.length - 1];
      const item = line.slice(2);
      if (prev?.type === "ul") prev.lines.push(item);
      else blocks.push({ type: "ul", lines: [item] });
    } else {
      blocks.push({ type: "p", lines: [line.replace(/^#{1,4}\s+/, "")] });
    }
  }
  return (
    <div className="space-y-2.5 text-[14px] leading-relaxed text-text2">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={`b${i}`} className="space-y-1.5 pl-1">
            {block.lines.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-indigo" />
                <span>{renderInline(item, onSeek, `b${i}-${j}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={`b${i}`}>{renderInline(block.lines[0], onSeek, `b${i}`)}</p>
        ),
      )}
    </div>
  );
}
