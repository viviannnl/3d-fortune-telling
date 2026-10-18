"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ShareCardContent } from "@/features/share/content";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { renderShareCard, SHARE_HEIGHT, SHARE_WIDTH } from "./renderShareCard";

interface ShareDialogProps {
  /** Builds the card content; must be memoized by the caller (it re-renders the card when it changes). */
  build: (includeDate: boolean) => ShareCardContent;
  defaultIncludeDate: boolean;
  privacyNote: string;
  fileName: string;
  onClose: () => void;
}

type RenderState = { status: "rendering" } | { status: "ready"; url: string; blob: Blob } | { status: "failed" };

/** Modal preview of the share card with download and (where supported) native share. */
export function ShareDialog({ build, defaultIncludeDate, privacyNote, fileName, onClose }: ShareDialogProps) {
  const t = useDictionary();
  const dialog = useRef<HTMLDialogElement>(null);
  const [includeDate, setIncludeDate] = useState(defaultIncludeDate);
  const [render, setRender] = useState<RenderState>({ status: "rendering" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    renderShareCard(build(includeDate), t.brand.name, t.share.footer).then(
      (blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setRender({ status: "ready", url, blob });
      },
      () => !cancelled && setRender({ status: "failed" }),
    );
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [build, includeDate, attempt, t]);

  const file = render.status === "ready" ? new File([render.blob], fileName, { type: "image/png" }) : null;
  const canShare = file !== null && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-labelledby="share-title"
      className="m-auto max-h-[94dvh] w-[min(34rem,94vw)] overflow-y-auto rounded-md border border-border-subtle bg-surface p-0 text-text shadow-md backdrop:bg-midnight/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h2 id="share-title" className="font-serif text-2xl">
          {t.share.title}
        </h2>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={t.share.close}
          className="flex size-9 cursor-pointer items-center justify-center rounded-pill text-text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-text"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div
          className="relative mx-auto w-full max-w-[22rem]"
          style={{ aspectRatio: `${SHARE_WIDTH} / ${SHARE_HEIGHT}` }}
        >
          {render.status === "ready" ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL preview
            <img
              src={render.url}
              alt={t.share.alt}
              data-testid="share-preview"
              className="size-full rounded-sm shadow-md"
            />
          ) : (
            <div
              role="status"
              className="flex size-full animate-shimmer items-center justify-center rounded-sm bg-surface-raised text-sm text-text-muted"
            >
              {render.status === "failed" ? t.share.failed : t.share.rendering}
            </div>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeDate}
            onChange={(e) => {
              setRender({ status: "rendering" });
              setIncludeDate(e.target.checked);
            }}
            className="size-4 cursor-pointer accent-[var(--lavender)]"
          />
          {t.share.includeDate}
        </label>
        <p className="text-xs text-text-muted">{privacyNote}</p>
        <div className="flex flex-wrap gap-2">
          {render.status === "failed" ? (
            <Button
              variant="primary"
              onClick={() => {
                setRender({ status: "rendering" });
                setAttempt((n) => n + 1);
              }}
            >
              {t.ai.retry}
            </Button>
          ) : (
            <a
              href={render.status === "ready" ? render.url : undefined}
              download={fileName}
              aria-disabled={render.status !== "ready"}
              className="inline-flex h-10 items-center gap-2 rounded-pill bg-lavender px-4 text-sm font-medium text-midnight transition-[background-color,transform] duration-150 hover:bg-moonlight active:scale-[0.97] aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              <Download aria-hidden className="size-4" />
              {t.share.download}
            </a>
          )}
          {canShare && file && (
            <Button
              variant="secondary"
              onClick={() => void navigator.share({ files: [file], title: t.share.title }).catch(() => undefined)}
            >
              <Share2 aria-hidden className="size-4" />
              {t.share.share}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
