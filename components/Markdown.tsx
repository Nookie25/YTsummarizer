"use client";

import { Fragment, type ReactNode } from "react";
import { parseTimestamp } from "@/lib/format";

// Renders the constrained markdown the model produces (## / ### headings,
// bullets, bold/italic/code) and turns every [mm:ss] token into a clickable
// timecode chip that seeks the player.

const TIMECODE_RE = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function renderStyled(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-s${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-cream">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function renderInline(
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
        className="timecode"
        onClick={() => seconds != null && onSeek(seconds)}
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

interface Block {
  type: "h2" | "h3" | "p" | "ul" | "ol" | "quote";
  lines: string[];
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ") && !trimmed.startsWith("###")) {
      blocks.push({ type: "h2", lines: [trimmed.slice(3)] });
    } else if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", lines: [trimmed.slice(4)] });
    } else if (/^[-*] /.test(trimmed)) {
      const prev = blocks[blocks.length - 1];
      const item = trimmed.slice(2);
      if (prev?.type === "ul") prev.lines.push(item);
      else blocks.push({ type: "ul", lines: [item] });
    } else if (/^\d+\. /.test(trimmed)) {
      const prev = blocks[blocks.length - 1];
      const item = trimmed.replace(/^\d+\. /, "");
      if (prev?.type === "ol") prev.lines.push(item);
      else blocks.push({ type: "ol", lines: [item] });
    } else if (trimmed.startsWith("> ")) {
      blocks.push({ type: "quote", lines: [trimmed.slice(2)] });
    } else {
      blocks.push({ type: "p", lines: [trimmed] });
    }
  }
  return blocks;
}

export default function Markdown({
  text,
  onSeek,
}: {
  text: string;
  onSeek: (seconds: number) => void;
}) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-cream-dim">
      {blocks.map((block, i) => {
        const key = `b${i}`;
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={key}
                className="pt-3 font-display text-[1.55rem] leading-snug text-cream first:pt-0"
              >
                {block.lines[0]}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} className="pt-1.5 text-[1.02rem] font-semibold text-cream">
                {block.lines[0]}
              </h3>
            );
          case "ul":
            return (
              <ul key={key} className="space-y-1.5 pl-1">
                {block.lines.map((item, j) => (
                  <li key={`${key}-${j}`} className="flex gap-2.5">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-signal" />
                    <span>{renderInline(item, onSeek, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="space-y-1.5 pl-1">
                {block.lines.map((item, j) => (
                  <li key={`${key}-${j}`} className="flex gap-2.5">
                    <span className="shrink-0 font-mono text-[0.8em] leading-[1.9] text-muted">
                      {j + 1}.
                    </span>
                    <span>{renderInline(item, onSeek, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-2 border-signal/50 pl-3 text-sm italic"
              >
                {renderInline(block.lines[0], onSeek, key)}
              </blockquote>
            );
          default:
            return <p key={key}>{renderInline(block.lines[0], onSeek, key)}</p>;
        }
      })}
    </div>
  );
}
