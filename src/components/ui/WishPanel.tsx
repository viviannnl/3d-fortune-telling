"use client";

import { useEffect, useRef, useState } from "react";
import { Flower2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WISH_MAX_LENGTH } from "@/features/wishes/wish";
import { playSound } from "@/lib/audio/engine";
import { format } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { isModalOpen } from "@/lib/modal";
import { useWishes } from "@/stores/wishes";

/** Write a wish and set a lantern adrift. The text never leaves the browser. */
export function WishPanel() {
  const t = useDictionary().wishes;
  const count = useWishes((s) => s.wishes.length);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isModalOpen()) return;
      e.preventDefault();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  useEffect(() => {
    if (!confirmed) return;
    const id = window.setTimeout(() => setConfirmed(false), 5000);
    return () => window.clearTimeout(id);
  }, [confirmed]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useWishes.getState().release(text)) {
      setError(true);
      input.current?.focus();
      return;
    }
    playSound("blessing");
    setText("");
    setError(false);
    setOpen(false);
    setConfirmed(true);
  };

  if (!open) {
    return (
      <div className="pointer-events-auto flex flex-col items-center gap-1">
        <Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => setOpen(true)} data-testid="wish-open">
          <Flower2 aria-hidden className="size-4 text-champagne" />
          {t.open}
        </Button>
        {confirmed && (
          <p role="status" className="animate-fade-in text-xs text-champagne [text-shadow:var(--text-halo)]">
            {t.released}
          </p>
        )}
        {count > 0 && (
          <p data-testid="wish-count" className="text-xs text-text-muted [text-shadow:var(--text-halo)]">
            {format(t.count, { n: count })}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      data-testid="wish-form"
      aria-labelledby="wish-title"
      className="pointer-events-auto w-[min(26rem,92vw)] animate-rise-in rounded-md control-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id="wish-title" className="font-serif text-lg text-text">
          {t.title}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.close}
          className="-mt-1 -mr-1 flex size-7 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <input
        ref={input}
        value={text}
        maxLength={WISH_MAX_LENGTH}
        onChange={(e) => {
          setText(e.target.value);
          setError(false);
        }}
        aria-invalid={error}
        aria-describedby="wish-privacy"
        placeholder={t.placeholder}
        className="mt-3 block h-10 w-full rounded-sm border border-border bg-surface/70 px-3 text-sm text-text placeholder:text-text-muted/70 transition-colors duration-150 hover:border-lavender/70 focus-visible:border-pale-blue aria-[invalid=true]:border-danger-border"
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {t.empty}
        </p>
      )}
      <p id="wish-privacy" className="mt-2 text-xs leading-relaxed text-text-muted">
        {t.privacy}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" className="h-9 px-4 text-xs">
          {t.release}
        </Button>
        {count > 0 && (
          <Button
            variant="ghost"
            className="h-9 px-3 text-xs"
            onClick={() => {
              useWishes.getState().clear();
              setOpen(false);
            }}
          >
            {t.clear}
          </Button>
        )}
      </div>
    </form>
  );
}
