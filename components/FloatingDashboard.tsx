// Decorative glass dashboard mockup for the hero — hand-built, not a
// screenshot. Slowly floats; shimmer accents suggest live intelligence.

const BARS = [64, 82, 48, 90, 70, 58, 84];

export default function FloatingDashboard() {
  return (
    <div aria-hidden className="float-slow relative select-none">
      {/* Glow behind the panel */}
      <div
        className="absolute -inset-8 rounded-[32px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.16), transparent 75%)",
        }}
      />

      <div className="card relative w-full max-w-[520px] p-5">
        {/* Video header row */}
        <div className="flex items-center gap-3.5">
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-bg2">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.2))",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                  <path d="M0 0l10 6-10 6z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-4/5 rounded bg-white/12" />
            <div className="h-2.5 w-2/5 rounded bg-white/7" />
          </div>
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-text2">
            42:17 → 4 min
          </span>
        </div>

        {/* TL;DR block */}
        <div className="mt-5 rounded-xl border border-line bg-white/[0.025] p-3.5">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
            TL;DR
          </p>
          <div className="space-y-1.5">
            <div className="shimmer h-2.5 w-full rounded" />
            <div className="shimmer h-2.5 w-11/12 rounded" style={{ animationDelay: "0.2s" }} />
            <div className="shimmer h-2.5 w-3/5 rounded" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>

        {/* Insights + timeline row */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-white/[0.025] p-3.5">
            <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              Key Insights
            </p>
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-md border border-indigo/40 bg-indigo/15" />
                  <div className="w-full space-y-1">
                    <div className="h-2 w-3/4 rounded bg-white/12" />
                    <div className="h-2 w-full rounded bg-white/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white/[0.025] p-3.5">
            <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              Timeline
            </p>
            <div className="flex h-[74px] items-end gap-1.5">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 3
                        ? "linear-gradient(to top, rgba(99,102,241,0.8), rgba(139,92,246,0.6))"
                        : "rgba(255,255,255,0.09)",
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-muted">
              <span>0:00</span>
              <span>42:17</span>
            </div>
          </div>
        </div>

        {/* Quote strip */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white/[0.025] p-3.5">
          <span className="text-lg leading-none text-violet">“</span>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-full rounded bg-white/10" />
            <div className="h-2 w-2/3 rounded bg-white/6" />
          </div>
          <span className="rounded-md border border-glow/25 bg-glow/10 px-1.5 py-0.5 font-mono text-[9px] text-glow">
            18:42
          </span>
        </div>
      </div>

      {/* Small floating chip, offset for depth */}
      <div
        className="card absolute -bottom-6 -left-8 hidden items-center gap-2.5 p-3 lg:flex"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <span className="text-[12px] font-medium text-text2">Summary ready · 6 insights</span>
      </div>
    </div>
  );
}
