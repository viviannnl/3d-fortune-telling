"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-lavender text-midnight hover:bg-moonlight shadow-sm",
  secondary: "control-surface text-text hover:border-border",
  ghost: "text-text-muted hover:text-text hover:bg-surface-raised/60",
};

/** Shared button: rest / hover / active / focus-visible / disabled / loading. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", loading = false, disabled, className = "", children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-pill px-4 text-sm font-medium",
        "transition-[background-color,color,border-color,transform,opacity] duration-150 ease-out active:scale-[0.97]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:scale-100",
        VARIANTS[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
});
