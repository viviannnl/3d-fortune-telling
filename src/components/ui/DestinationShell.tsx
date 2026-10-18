"use client";

import { isModalOpen } from "@/lib/modal";
import { useEffect, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { playSound } from "@/lib/audio/engine";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { useExperience, type DestinationId } from "@/stores/experience";

interface DestinationShellProps {
  id: DestinationId;
  children?: ReactNode;
  /** Return false to veto leaving (e.g. while a request is in flight). Defaults to allowing. */
  canLeave?: () => boolean;
}

/** Shared chrome inside a destination: heading, return control, and Escape-to-leave. */
export function DestinationShell({ id, children, canLeave }: DestinationShellProps) {
  const t = useDictionary();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || isModalOpen()) return;
      if (canLeave && !canLeave()) return;
      playSound("back");
      useExperience.getState().exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canLeave]);

  const leave = () => {
    if (canLeave && !canLeave()) return;
    playSound("back");
    useExperience.getState().exit();
  };

  return (
    <section aria-labelledby={`${id}-title`} className="flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-auto flex animate-rise-in items-center gap-4 [animation-delay:500ms]">
        <button
          type="button"
          onClick={leave}
          className="control-surface flex h-9 cursor-pointer items-center gap-2 rounded-pill px-3 text-xs font-medium text-text-muted transition-[color,transform] duration-150 ease-out hover:text-text active:scale-[0.97]"
        >
          <ArrowLeft aria-hidden className="size-4" />
          <span>{t.nav.back}</span>
        </button>
        <h2 id={`${id}-title`} className="font-serif text-2xl text-text [text-shadow:var(--text-halo)] md:text-3xl">
          {t.destinations[id].name}
        </h2>
      </div>
      {children}
    </section>
  );
}
