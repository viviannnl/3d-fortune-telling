/**
 * Static, non-WebGL sky used while the canvas loads and when WebGL is unavailable.
 * Purely decorative; any message is rendered by the caller.
 */
export function SkyFallback() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-surface">
      <div
        className="absolute left-1/2 top-[17%] size-[min(28vh,56vw)] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 42% 38%, var(--moonlight) 0%, var(--lavender) 58%, var(--amethyst) 100%)",
          boxShadow: "var(--glow-moon)",
          opacity: 0.85,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, var(--deep-violet), transparent)" }}
      />
    </div>
  );
}
