"use client";

import { useState, type ReactNode } from "react";
import type { ParsedSummary } from "@/lib/summary-parser";
import { renderInline } from "@/components/Inline";

// The workspace's knowledge sections, rendered from the progressively-parsed
// streamed summary: TL;DR → Key Insights → Timeline → Action Items → Quotes.

function SectionShell({
  label,
  icon,
  children,
  delay = 0,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section className="fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-text2">
          {icon}
        </span>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {label}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-2.5 p-5" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-3 rounded"
          style={{ width: `${[95, 88, 60, 92, 75][i % 5]}%`, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const Icons = {
  tldr: (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  insights: (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
    </svg>
  ),
  timeline: (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  actions: (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  quotes: (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M3 21c3-1 5-3.5 5-7V7a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2" />
      <path d="M15 21c3-1 5-3.5 5-7V7a3 3 0 0 0-3-3h-1a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2" />
    </svg>
  ),
};

export default function SummarySections({
  parsed,
  streaming,
  onSeek,
}: {
  parsed: ParsedSummary;
  streaming: boolean;
  onSeek: (seconds: number) => void;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="space-y-12">
      {/* TL;DR */}
      <SectionShell label="TL;DR" icon={Icons.tldr}>
        {parsed.tldr ? (
          <div className="card border-l-2 border-l-indigo p-6">
            <p
              className={`text-[16.5px] leading-relaxed text-text ${
                streaming && !parsed.insights.length ? "stream-caret" : ""
              }`}
            >
              {renderInline(parsed.tldr.replace(/\n+/g, " "), onSeek, "tldr")}
            </p>
          </div>
        ) : (
          <Skeleton lines={3} />
        )}
      </SectionShell>

      {/* Key Insights */}
      <SectionShell label="Key Insights" icon={Icons.insights} delay={60}>
        {parsed.insights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {parsed.insights.map((insight, i) => (
              <div
                key={i}
                className="card card-lift fade-up p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo/15 font-mono text-[10px] font-medium text-glow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {insight.label && (
                    <p className="text-[14px] font-semibold leading-snug text-text">
                      {insight.label}
                    </p>
                  )}
                </div>
                <p className="text-[13.5px] leading-relaxed text-text2">
                  {renderInline(insight.text, onSeek, `in-${i}`)}
                </p>
              </div>
            ))}
          </div>
        ) : streaming || !parsed.hasContent ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton lines={3} />
            <Skeleton lines={3} />
          </div>
        ) : null}
      </SectionShell>

      {/* Timeline */}
      <SectionShell label="Timeline" icon={Icons.timeline} delay={120}>
        {parsed.timeline.length > 0 ? (
          <div className="card overflow-hidden">
            <ol>
              {parsed.timeline.map((entry, i) => (
                <li key={i} className={i > 0 ? "border-t border-line" : ""}>
                  <button
                    type="button"
                    onClick={() => onSeek(entry.seconds)}
                    className="group flex w-full items-baseline gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="ts-chip shrink-0 !text-[11px]">{entry.time}</span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-text group-hover:text-glow">
                        {entry.title}
                      </span>
                      {entry.text && (
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-text2">
                          {entry.text}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : streaming || !parsed.hasContent ? (
          <Skeleton lines={5} />
        ) : null}
      </SectionShell>

      {/* Action Items */}
      {(parsed.actions.length > 0 || streaming || !parsed.hasContent) && (
        <SectionShell label="Action Items" icon={Icons.actions} delay={180}>
          {parsed.actions.length > 0 ? (
            <div className="card p-2.5">
              <ul>
                {parsed.actions.map((action, i) => {
                  const done = checked.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        aria-pressed={done}
                        className="flex w-full items-start gap-3.5 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.03]"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            done
                              ? "border-success/50 bg-success/15"
                              : "border-line-bright bg-transparent"
                          }`}
                        >
                          {done && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-pop">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-[14px] leading-relaxed transition-colors ${
                            done ? "text-muted line-through" : "text-text2"
                          }`}
                        >
                          {renderInline(action, onSeek, `ac-${i}`)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <Skeleton lines={3} />
          )}
        </SectionShell>
      )}

      {/* Notable Quotes */}
      {(parsed.quotes.length > 0 || streaming || !parsed.hasContent) && (
        <SectionShell label="Notable Quotes" icon={Icons.quotes} delay={240}>
          {parsed.quotes.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {parsed.quotes.map((quote, i) => (
                <figure
                  key={i}
                  className="card card-lift fade-up relative overflow-hidden p-6"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span
                    aria-hidden
                    className="absolute -top-3 left-4 select-none text-[64px] font-bold leading-none text-violet/15"
                  >
                    “
                  </span>
                  <blockquote className="relative text-[15px] font-medium leading-relaxed text-text">
                    {quote.text}
                  </blockquote>
                  {quote.time && quote.seconds != null && (
                    <figcaption className="mt-4">
                      <button
                        type="button"
                        className="ts-chip"
                        onClick={() => onSeek(quote.seconds!)}
                        aria-label={`Jump to quote at ${quote.time}`}
                      >
                        {quote.time}
                      </button>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <Skeleton lines={2} />
          )}
        </SectionShell>
      )}
    </div>
  );
}
