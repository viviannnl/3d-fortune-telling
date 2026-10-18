"use client";

import type { ShareCardContent, ShareCardDestiny, ShareCardTarot } from "@/features/share/content";
import { PALETTE } from "@/lib/palette";
import { ELEMENT_COLOR } from "@/components/destiny/elementStyle";

export const SHARE_WIDTH = 1080;
export const SHARE_HEIGHT = 1350;
const SILVER = "#c9c3dd";
const MUTED = "#a497c4";

function fontFamilies() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    serif: [v("--font-cormorant"), v("--font-noto-serif-sc"), "Georgia", "serif"].filter(Boolean).join(", "),
    sans: [v("--font-inter"), v("--font-noto-sans-sc"), "system-ui", "sans-serif"].filter(Boolean).join(", "),
  };
}

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Wraps by words for spaced scripts and by characters for CJK. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = /[　-鿿]/.test(text) ? [...text] : text.split(/(\s+)/);
  const lines: string[] = [];
  let line = "";
  for (const tok of tokens) {
    const next = line + tok;
    if (ctx.measureText(next).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = tok.trimStart();
    } else line = next;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_HEIGHT);
  bg.addColorStop(0, "#120f27");
  bg.addColorStop(0.55, PALETTE.midnight);
  bg.addColorStop(1, PALETTE.deepViolet);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);

  const glow = ctx.createRadialGradient(925, 120, 8, 925, 120, 360);
  glow.addColorStop(0, "rgba(231,221,251,0.30)");
  glow.addColorStop(0.25, "rgba(188,166,245,0.12)");
  glow.addColorStop(1, "rgba(188,166,245,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);
  ctx.fillStyle = PALETTE.moonlight;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(925, 120, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  for (let i = 0; i < 160; i++) {
    const x = rand(i + 1) * SHARE_WIDTH;
    const y = rand(i + 99) * SHARE_HEIGHT * 0.8;
    ctx.globalAlpha = 0.15 + rand(i + 7) * 0.55;
    ctx.fillStyle = rand(i + 3) > 0.85 ? PALETTE.paleBlue : PALETTE.moonlight;
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + rand(i + 5) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = SILVER;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, SHARE_WIDTH - 72, SHARE_HEIGHT - 72);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, SHARE_WIDTH - 100, SHARE_HEIGHT - 100);
  ctx.globalAlpha = 1;
  for (const [x, y] of [
    [50, 50],
    [SHARE_WIDTH - 50, 50],
    [50, SHARE_HEIGHT - 50],
    [SHARE_WIDTH - 50, SHARE_HEIGHT - 50],
  ]) {
    ctx.fillStyle = PALETTE.lavender;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHeader(ctx: CanvasRenderingContext2D, c: ShareCardContent, f: ReturnType<typeof fontFamilies>) {
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.moonlight;
  ctx.font = `500 68px ${f.serif}`;
  ctx.fillText(c.title, SHARE_WIDTH / 2, 170);
  ctx.fillStyle = MUTED;
  ctx.font = `400 26px ${f.sans}`;
  ctx.fillText(c.subtitle, SHARE_WIDTH / 2, 220);
}

async function drawTarot(ctx: CanvasRenderingContext2D, c: ShareCardTarot, f: ReturnType<typeof fontFamilies>) {
  const w = 270;
  const h = 450;
  const gap = 48;
  const x0 = (SHARE_WIDTH - (w * 3 + gap * 2)) / 2;
  const y = 290;
  const images = await Promise.all(c.cards.map((card) => loadImage(card.asset)));
  c.cards.forEach((card, i) => {
    const x = x0 + i * (w + gap);
    ctx.save();
    ctx.shadowColor = "rgba(10,8,28,0.6)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.translate(x + w / 2, y + h / 2);
    if (card.reversed) ctx.rotate(Math.PI);
    const img = images[i];
    if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);
    else {
      ctx.fillStyle = PALETTE.deepViolet;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = SILVER;
      ctx.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
      ctx.fillStyle = PALETTE.moonlight;
      ctx.font = `500 44px ${f.serif}`;
      ctx.textAlign = "center";
      ctx.fillText(String(card.numeral), 0, 10);
    }
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = PALETTE.lavender;
    ctx.font = `500 20px ${f.sans}`;
    ctx.fillText(card.position.toUpperCase(), x + w / 2, y + h + 50);
    ctx.fillStyle = PALETTE.moonlight;
    ctx.font = `500 34px ${f.serif}`;
    ctx.fillText(card.name, x + w / 2, y + h + 92, w + 30);
    ctx.fillStyle = MUTED;
    ctx.font = `400 21px ${f.sans}`;
    ctx.fillText(card.orientation, x + w / 2, y + h + 126);
  });
}

function drawDestiny(ctx: CanvasRenderingContext2D, c: ShareCardDestiny, f: ReturnType<typeof fontFamilies>) {
  const colW = 190;
  const x0 = SHARE_WIDTH / 2 - (colW * c.pillars.length) / 2;
  const top = 300;
  c.pillars.forEach((p, i) => {
    const cx = x0 + colW * i + colW / 2;
    ctx.strokeStyle = "rgba(188,166,245,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 74, top, 148, 330, 14);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = MUTED;
    ctx.font = `500 22px ${f.sans}`;
    ctx.fillText(p.label, cx, top + 48);
    ctx.font = `500 104px ${f.serif}`;
    ctx.fillStyle = ELEMENT_COLOR[p.stemElement];
    ctx.fillText(p.stem, cx, top + 170);
    ctx.fillStyle = ELEMENT_COLOR[p.branchElement];
    ctx.fillText(p.branch, cx, top + 290);
  });
  ctx.fillStyle = PALETTE.moonlight;
  ctx.font = `500 32px ${f.serif}`;
  ctx.textAlign = "center";
  ctx.fillText(c.dayMaster, SHARE_WIDTH / 2, top + 400);

  const barX = 250;
  const barW = 560;
  const max = Math.max(1, ...c.elements.map((e) => e.count));
  c.elements.forEach((e, i) => {
    const y = top + 460 + i * 40;
    ctx.textAlign = "right";
    ctx.fillStyle = PALETTE.moonlight;
    ctx.font = `400 24px ${f.sans}`;
    ctx.fillText(e.label, barX - 24, y + 8);
    ctx.fillStyle = "rgba(48,36,72,0.9)";
    ctx.beginPath();
    ctx.roundRect(barX, y - 6, barW, 12, 6);
    ctx.fill();
    ctx.fillStyle = ELEMENT_COLOR[e.id];
    ctx.beginPath();
    ctx.roundRect(barX, y - 6, Math.max(12, (e.count / max) * barW), 12, 6);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = PALETTE.moonlight;
    ctx.fillText(String(e.count), barX + barW + 20, y + 8);
  });
}

function drawSummaryAndFooter(
  ctx: CanvasRenderingContext2D,
  c: ShareCardContent,
  f: ReturnType<typeof fontFamilies>,
  brand: string,
  footer: string,
) {
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.moonlight;
  ctx.font = `italic 400 36px ${f.serif}`;
  const lines = wrap(ctx, c.summary, 860).slice(0, 3);
  const startY = c.kind === "tarot" ? 1000 : 1035;
  lines.forEach((l, i) => ctx.fillText(l, SHARE_WIDTH / 2, startY + i * 48));

  ctx.fillStyle = SILVER;
  ctx.fillRect(SHARE_WIDTH / 2 - 40, 1190, 80, 1);
  ctx.fillStyle = PALETTE.lavender;
  ctx.font = `500 28px ${f.serif}`;
  ctx.fillText(brand, SHARE_WIDTH / 2, 1238);
  ctx.fillStyle = MUTED;
  ctx.font = `400 19px ${f.sans}`;
  ctx.fillText([footer, c.dateLabel].filter(Boolean).join(" · "), SHARE_WIDTH / 2, 1272);
}

/** Draws the card to an offscreen canvas and returns a PNG blob. */
export async function renderShareCard(content: ShareCardContent, brand: string, footer: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_WIDTH;
  canvas.height = SHARE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const f = fontFamilies();
  await Promise.allSettled([
    document.fonts.load(`68px ${f.serif}`, content.title),
    document.fonts.load(`26px ${f.sans}`, content.subtitle),
  ]);

  drawBackdrop(ctx);
  drawHeader(ctx, content, f);
  if (content.kind === "tarot") await drawTarot(ctx, content, f);
  else drawDestiny(ctx, content, f);
  drawSummaryAndFooter(ctx, content, f, brand, footer);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}
