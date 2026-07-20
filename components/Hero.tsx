"use client";

import { useRef } from "react";
import CommandBar from "@/components/CommandBar";
import FloatingDashboard from "@/components/FloatingDashboard";

export default function Hero({
  onSubmit,
  onWatchDemo,
  busy,
  error,
}: {
  onSubmit: (url: string) => void;
  onWatchDemo: () => void;
  busy: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-6rem)] w-full max-w-[1200px] items-center gap-16 px-6 py-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-10">
      {/* Left — copy */}
      <div>
        <div
          className="fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5"
          style={{ animationDelay: "0ms" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo" />
          <span className="text-[12px] font-medium text-text2">
            AI-powered knowledge compression
          </span>
        </div>

        <h1
          className="fade-up text-[44px] font-bold leading-[1.06] tracking-[-0.03em] text-text sm:text-[58px]"
          style={{ animationDelay: "80ms" }}
        >
          Understand Hours of Content{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(100deg, #6366F1, #8B5CF6 60%, #60A5FA)",
            }}
          >
            in Minutes.
          </span>
        </h1>

        <p
          className="fade-up mt-6 max-w-[520px] text-[17px] leading-relaxed text-text2"
          style={{ animationDelay: "160ms" }}
        >
          Extract key insights, action items, timestamps, and important ideas
          from any YouTube video with AI-powered precision.
        </p>

        <div className="fade-up mt-9 max-w-[560px]" style={{ animationDelay: "240ms" }}>
          <CommandBar onSubmit={onSubmit} busy={busy} inputRef={inputRef} />
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-error/25 bg-error/[0.06] px-4 py-2.5 text-[13px] text-text2"
            >
              {error}
            </p>
          )}
        </div>

        <div
          className="fade-up mt-5 flex items-center gap-3"
          style={{ animationDelay: "320ms" }}
        >
          <button type="button" onClick={onWatchDemo} disabled={busy} className="btn-ghost !px-5 !py-2.5 text-[14px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
            Watch Demo
          </button>
          <span className="text-[12.5px] text-muted">
            Runs a real summary on a featured video — no sign-up.
          </span>
        </div>

        <p
          className="fade-up mt-12 font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
          style={{ animationDelay: "400ms" }}
        >
          Stop consuming content. Start absorbing knowledge.
        </p>
      </div>

      {/* Right — floating dashboard mockup */}
      <div className="fade-up relative hidden justify-center lg:flex" style={{ animationDelay: "300ms" }}>
        <FloatingDashboard />
      </div>
    </section>
  );
}
