// MemoTube mark: three knowledge layers compressing upward into a spark.
// Monochrome (inherits currentColor), legible at 24px.

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M4 17.5h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M4 12.75h12.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M4 8h15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19.25 2.5l.62 1.63 1.63.62-1.63.62-.62 1.63-.62-1.63-1.63-.62 1.63-.62.62-1.63z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap text-text">
      <LogoMark size={compact ? 22 : 26} />
      {!compact && (
        <span className="text-[17px] font-semibold tracking-tight">
          Memo<span className="text-text2">Tube</span>
        </span>
      )}
    </span>
  );
}
