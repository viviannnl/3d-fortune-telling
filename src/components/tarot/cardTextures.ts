"use client";

import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace, TextureLoader, type Texture } from "three";
import { PALETTE } from "@/lib/palette";

export const CARD_ASPECT = 0.6; // width / height of every card asset (600 × 1000)
export const CARD_BACK_ASSET = "/cards/card-back.svg";

/**
 * Card textures are few (≤ 23) and reused across readings, so they are cached
 * for the lifetime of the page. three re-uploads them to a new renderer if the
 * canvas remounts.
 */
const cache = new Map<string, Promise<Texture>>();

function load(url: string): Promise<Texture> {
  let pending = cache.get(url);
  if (!pending) {
    pending = new TextureLoader().loadAsync(url).then((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    });
    // Let a failed asset be retried on a later mount.
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

export type CardTextureState =
  { status: "loading"; texture: null } | { status: "ready"; texture: Texture } | { status: "failed"; texture: null };

export function useCardTexture(url: string): CardTextureState {
  const [state, setState] = useState<{ url: string; result: CardTextureState }>({
    url,
    result: { status: "loading", texture: null },
  });

  useEffect(() => {
    let active = true;
    load(url).then(
      (texture) => active && setState({ url, result: { status: "ready", texture } }),
      () => active && setState({ url, result: { status: "failed", texture: null } }),
    );
    return () => {
      active = false;
    };
  }, [url]);

  return state.url === url ? state.result : { status: "loading", texture: null };
}

/** Drawn face used when a card's artwork can't be loaded, so the reading stays legible. */
export function createFallbackFace(numeral: string, name: string): CanvasTexture {
  const w = 600;
  const h = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, PALETTE.midnight);
    bg.addColorStop(1, PALETTE.deepViolet);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c9c3dd";
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(38, 38, w - 76, h - 76);
    ctx.fillStyle = PALETTE.moonlight;
    ctx.textAlign = "center";
    ctx.font = "56px Georgia, serif";
    ctx.fillText(numeral, w / 2, 150);
    ctx.font = "italic 48px Georgia, serif";
    ctx.fillText(name, w / 2, h / 2 + 16, w - 120);
    ctx.strokeStyle = PALETTE.lavender;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 120, 70, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
