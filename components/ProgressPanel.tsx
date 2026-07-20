"use client";

// Intelligent processing panel: an animated checklist driven by real pipeline
// signals (see the `stage` mapping in Home.tsx) instead of a spinner.

const STEPS = [
  "Retrieving transcript",
  "Detecting chapters",
  "Understanding context",
  "Identifying important concepts",
  "Generating structured summary",
  "Preparing visual insights",
];

export default function ProgressPanel({
  stage,
  videoTitle,
}: {
  /** number of completed steps (0–6); the next one renders as active */
  stage: number;
  videoTitle: string | null;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-6rem)] items-center justify-center px-6">
      <div className="card fade-up w-full max-w-[440px] p-8">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo" />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Analyzing
          </p>
        </div>
        {videoTitle ? (
          <p className="mb-7 line-clamp-2 text-[16px] font-medium leading-snug text-text">
            {videoTitle}
          </p>
        ) : (
          <p className="mb-7 text-[16px] font-medium text-text">Fetching video…</p>
        )}

        <ol className="space-y-4">
          {STEPS.map((step, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <li key={step} className="flex items-center gap-3.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                    done
                      ? "border-success/40 bg-success/12"
                      : active
                        ? "border-indigo/50 bg-indigo/10"
                        : "border-line bg-transparent"
                  }`}
                >
                  {done ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="check-pop"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : active ? (
                    <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-indigo" />
                  ) : null}
                </span>
                <span
                  className={`text-[14px] transition-colors duration-300 ${
                    done ? "text-text2" : active ? "font-medium text-text" : "text-muted"
                  }`}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, (stage / STEPS.length) * 100)}%`,
              background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
