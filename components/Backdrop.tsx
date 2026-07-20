// Fixed ambient environment behind every screen: deep midnight base, two
// slow-drifting glow orbs, a faint grid, and subtle noise. Everything ≤ ~6%
// opacity so content stays the focus.

export default function Backdrop() {
  return (
    <div aria-hidden className="print-hide pointer-events-none fixed inset-0 overflow-hidden">
      {/* Soft radial glows */}
      <div
        className="drift-a absolute left-[-15%] top-[-25%] h-[70vh] w-[70vw] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent 70%)",
        }}
      />
      <div
        className="drift-b absolute bottom-[-30%] right-[-10%] h-[70vh] w-[60vw] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.08), transparent 70%)",
        }}
      />
      {/* Faint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Noise */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
