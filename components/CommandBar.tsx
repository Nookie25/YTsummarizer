"use client";

import { useState, type RefObject } from "react";

export default function CommandBar({
  onSubmit,
  busy,
  compact = false,
  inputRef,
}: {
  onSubmit: (url: string) => void;
  busy: boolean;
  compact?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      className={`card flex w-full items-center gap-2 ${compact ? "p-1.5" : "p-2"}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() && !busy) onSubmit(value);
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={`ml-2.5 shrink-0 text-muted ${compact ? "hidden sm:block" : ""}`}
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        inputMode="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={compact ? "Paste a YouTube link…" : "Paste any YouTube link — https://youtube.com/watch?v=…"}
        aria-label="YouTube video URL"
        className={`min-w-0 flex-1 bg-transparent text-text placeholder:text-muted focus:outline-none ${
          compact ? "px-1 py-1.5 text-[13px]" : "px-1.5 py-2.5 text-[15px]"
        }`}
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className={`btn-primary shrink-0 ${compact ? "!rounded-xl !px-4 !py-2 text-[13px]" : "text-[15px]"}`}
      >
        {busy ? (
          <span className="pulse-soft">Working…</span>
        ) : compact ? (
          "Summarize"
        ) : (
          "Generate Summary"
        )}
      </button>
    </form>
  );
}
