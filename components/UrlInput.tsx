"use client";

import { useState } from "react";

export default function UrlInput({
  onSubmit,
  busy,
  compact = false,
  initialValue = "",
}: {
  onSubmit: (url: string) => void;
  busy: boolean;
  compact?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className={`flex w-full gap-2 ${compact ? "" : "flex-col sm:flex-row"}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() && !busy) onSubmit(value);
      }}
    >
      <input
        type="text"
        inputMode="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={compact ? "Paste another link…" : "https://www.youtube.com/watch?v=…"}
        aria-label="YouTube video URL"
        className={`min-w-0 flex-1 rounded-xl border border-line bg-surface text-cream placeholder:text-muted focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 ${
          compact ? "px-3.5 py-2 text-[13px]" : "px-5 py-4 text-[15px]"
        }`}
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className={`shrink-0 rounded-xl bg-signal font-medium text-ink transition-all hover:bg-signal-deep disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? "px-4 py-2 text-[13px]" : "px-7 py-4 text-[15px]"
        }`}
      >
        {busy ? "Fetching…" : "Summarize"}
      </button>
    </form>
  );
}
