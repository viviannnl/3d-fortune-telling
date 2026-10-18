/** Small line glyphs drawn to match the world's silver linework (stroke = currentColor). */

export function TarotGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="6.5" y="3.5" width="11" height="17" rx="1.6" />
      <rect x="8.4" y="5.4" width="7.2" height="13.2" rx="0.8" opacity={0.6} />
      <path d="M12 8.6l.9 2.2 2.3.2-1.8 1.5.6 2.3-2-1.2-2 1.2.6-2.3-1.8-1.5 2.3-.2z" />
    </svg>
  );
}

export function ArmillaryGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="10.5" r="7" />
      <ellipse cx="12" cy="10.5" rx="7" ry="2.4" />
      <ellipse cx="12" cy="10.5" rx="2.6" ry="7" opacity={0.7} />
      <circle cx="12" cy="10.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M12 17.5v2.6M8.8 21h6.4" />
    </svg>
  );
}

/** A tiny diamond-and-hairline divider used between panel sections. */
export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-2 text-border ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border/70" />
      <span className="size-1.5 rotate-45 border border-current" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border/70" />
    </div>
  );
}
