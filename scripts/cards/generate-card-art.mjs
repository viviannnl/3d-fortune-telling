#!/usr/bin/env node
// Generates original "Dreamy Celestial Fantasy" tarot artwork as standalone SVGs.
// Output: public/cards/major-XX-<slug>.svg (22 faces) + public/cards/card-back.svg
// Every SVG is self-contained (no external refs, no web fonts) so it can be
// rasterised into a WebGL texture via an <img>.
//
// Usage (from project root): node scripts/cards/generate-card-art.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = join(ROOT, "public", "cards");

// ---------------------------------------------------------------- palette ---
const C = {
  midnight: "#17152F",
  violet: "#302448",
  amethyst: "#55427C",
  lavender: "#BCA6F5",
  moon: "#E7DDFB",
  blue: "#C5DDF8",
  silver: "#C9C3DD",
};

const W = 600;
const H = 1000;
const FONT = "Georgia, 'Times New Roman', serif";

// ------------------------------------------------------------- primitives ---
const f = (n) => +Number(n).toFixed(2);
const rad = (deg) => (deg * Math.PI) / 180;
const polar = (cx, cy, r, deg) => [f(cx + r * Math.cos(rad(deg))), f(cy + r * Math.sin(rad(deg)))];

const fmt = (v) => (typeof v === "number" ? f(v) : v);
const attr = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${fmt(v)}"`)
    .join(" ");
const el = (tag, o = {}, inner) =>
  inner === undefined ? `<${tag} ${attr(o)}/>` : `<${tag} ${attr(o)}>${inner}</${tag}>`;

/** Style shorthand: s=stroke, w=width, f=fill, fo=fill-opacity, o=opacity, dash, t=transform. */
function S({ s = C.moon, w = 3, f: fill = "none", fo, o, so, dash, t, ...rest } = {}) {
  return {
    stroke: s,
    "stroke-width": s === "none" ? undefined : w,
    fill,
    "fill-opacity": fo,
    "stroke-opacity": so,
    opacity: o,
    "stroke-dasharray": dash,
    transform: t,
    ...rest,
  };
}

const path = (d, o) => el("path", { d, ...S(o) });
const circle = (cx, cy, r, o) => el("circle", { cx, cy, r, ...S(o) });
const ellipse = (cx, cy, rx, ry, o) => el("ellipse", { cx, cy, rx, ry, ...S(o) });
const line = (x1, y1, x2, y2, o) => el("line", { x1, y1, x2, y2, ...S(o) });
const rect = (x, y, w, h, o) => el("rect", { x, y, width: w, height: h, ...S(o) });
const poly = (points, o) =>
  el("polygon", { points: Array.isArray(points) ? points.map((p) => p.join(",")).join(" ") : points, ...S(o) });
const g = (inner, o = {}) => el("g", o, Array.isArray(inner) ? inner.join("") : inner);
const dot = (cx, cy, r, fill = C.moon, o) => circle(cx, cy, r, { s: "none", f: fill, o });

/** n-pointed star polygon points. */
function starPoints(cx, cy, ro, ri, n, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(polar(cx, cy, i % 2 ? ri : ro, rot + (i * 180) / n));
  return pts;
}
const star = (cx, cy, ro, ri, n, o, rot) => poly(starPoints(cx, cy, ro, ri, n, rot), o);

/** Four-point concave sparkle. */
function sparkle(cx, cy, r, o = { s: "none", f: C.moon }) {
  const k = r * 0.18;
  return path(
    `M${f(cx)},${f(cy - r)} Q${f(cx + k)},${f(cy - k)} ${f(cx + r)},${f(cy)} Q${f(cx + k)},${f(cy + k)} ${f(cx)},${f(cy + r)} ` +
      `Q${f(cx - k)},${f(cy + k)} ${f(cx - r)},${f(cy)} Q${f(cx - k)},${f(cy - k)} ${f(cx)},${f(cy - r)}Z`,
    o,
  );
}

/** Falling droplet / spark (point up, round bottom). */
function drop(x, y, s = 1, o = { s: "none", f: C.lavender }) {
  return path(
    `M${f(x)},${f(y - 11 * s)} Q${f(x + 7 * s)},${f(y)} ${f(x)},${f(y + 7 * s)} Q${f(x - 7 * s)},${f(y)} ${f(x)},${f(y - 11 * s)}Z`,
    o,
  );
}

/**
 * Lit part of a moon. k in [0,1] is terminator width; gibbous=false -> crescent.
 * rot=0 means lit side on the left (horns pointing right).
 */
function moonLit(cx, cy, r, k, gibbous, rot = 0, o = { s: "none", f: C.moon }) {
  const d =
    `M${f(cx)},${f(cy - r)} A${f(r)},${f(r)} 0 0 0 ${f(cx)},${f(cy + r)} ` +
    `A${f(Math.max(k * r, 0.01))},${f(r)} 0 0 ${gibbous ? 0 : 1} ${f(cx)},${f(cy - r)}Z`;
  return path(d, { ...o, t: rot ? `rotate(${rot} ${f(cx)} ${f(cy)})` : undefined });
}

/** Archimedean spiral as a polyline path. */
function spiral(cx, cy, r0, r1, turns, a0 = 0, dir = 1, steps = 80) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = polar(cx, cy, r0 + (r1 - r0) * t, a0 + dir * t * turns * 360);
    d += `${i ? "L" : "M"}${x},${y} `;
  }
  return d.trim();
}

/** Glow: the single soft radial highlight allowed per card. */
const glow = (cx, cy, r) => circle(cx, cy, r, { s: "none", f: "url(#glow)" });

/** Seeded RNG (mulberry32) so output is deterministic. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ frame ---
const WINDOW_D = "M70,900 L70,400 A230,230 0 0 1 530,400 L530,900 Z";
const WINDOW_INNER_D = "M80,890 L80,400 A220,220 0 0 1 520,400 L520,890 Z";

function insideWindow(x, y, pad = 0) {
  if (x < 70 + pad || x > 530 - pad || y > 900 - pad) return false;
  if (y >= 400) return true;
  return (x - 300) ** 2 + (y - 400) ** 2 < (230 - pad) ** 2;
}

function starField(seed, count = 44) {
  const r = rng(seed * 7919 + 13);
  const out = [];
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < 2000) {
    const x = 85 + r() * 430;
    const y = 180 + Math.pow(r(), 1.7) * 640; // denser in the sky (upper half)
    if (!insideWindow(x, y, 14)) continue;
    const big = r() < 0.12;
    out.push(dot(x, y, big ? 1.9 : 0.9 + r() * 0.9, r() < 0.3 ? C.blue : C.moon, f(0.35 + r() * 0.45)));
    placed++;
  }
  return out.join("");
}

function cornerOrnament(x, y, sx, sy) {
  return g(
    [
      path("M0,30 Q0,0 30,0", { s: C.silver, w: 2 }),
      path("M8,40 Q8,8 40,8", { s: C.silver, w: 1.2, o: 0.6 }),
      poly(
        [
          [20, 11],
          [29, 20],
          [20, 29],
          [11, 20],
        ],
        { s: "none", f: C.silver, o: 0.85 },
      ),
      dot(46, 4, 1.8, C.silver, 0.8),
      dot(4, 46, 1.8, C.silver, 0.8),
    ],
    { transform: `translate(${x} ${y}) scale(${sx} ${sy})` },
  );
}

const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.midnight}"/>
    <stop offset="1" stop-color="${C.violet}"/>
  </linearGradient>
  <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.amethyst}" stop-opacity="0.26"/>
    <stop offset="0.6" stop-color="${C.amethyst}" stop-opacity="0.08"/>
    <stop offset="1" stop-color="${C.midnight}" stop-opacity="0.25"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.lavender}" stop-opacity="0.34"/>
    <stop offset="0.45" stop-color="${C.lavender}" stop-opacity="0.12"/>
    <stop offset="1" stop-color="${C.lavender}" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="window"><path d="${WINDOW_D}"/></clipPath>`;

function svgDoc(body, defs = DEFS) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs>${defs}</defs>${body}</svg>\n`
  );
}

function frame({ numeral, seed, motif }) {
  const ls = 8;
  return svgDoc(
    [
      rect(0, 0, W, H, { s: "none", f: "url(#bg)" }),
      path(WINDOW_D, { s: "none", f: "url(#win)" }),
      g([starField(seed), g(motif, { "stroke-linecap": "round", "stroke-linejoin": "round" })], {
        "clip-path": "url(#window)",
      }),
      // arched window
      path(WINDOW_D, { s: C.silver, w: 2.5 }),
      path(WINDOW_INNER_D, { s: C.silver, w: 1.2, o: 0.45 }),
      // keystone at the apex of the arch
      poly(
        [
          [300, 162],
          [308, 170],
          [300, 178],
          [292, 170],
        ],
        { s: "none", f: C.silver },
      ),
      // double border
      rect(16, 16, 568, 968, { s: C.silver, w: 3, rx: 18 }),
      rect(28, 28, 544, 944, { s: C.silver, w: 1.4, o: 0.7, rx: 10 }),
      cornerOrnament(34, 34, 1, 1),
      cornerOrnament(566, 34, -1, 1),
      cornerOrnament(34, 966, 1, -1),
      cornerOrnament(566, 966, -1, -1),
      // numeral + flanking filigree (top only: reads as "up")
      el(
        "text",
        {
          x: numeral === "0" ? 300 : 300 + ls / 2,
          y: 124,
          "text-anchor": "middle",
          "font-family": FONT,
          // Georgia's "0" is an old-style (x-height) figure: enlarge it to read at cap height.
          "font-size": numeral === "0" ? 66 : 46,
          "letter-spacing": numeral === "0" ? 0 : ls,
          fill: C.moon,
        },
        numeral,
      ),
      line(118, 108, 186, 108, { s: C.silver, w: 1.5, o: 0.8 }),
      line(414, 108, 482, 108, { s: C.silver, w: 1.5, o: 0.8 }),
      dot(110, 108, 2.6, C.silver),
      dot(490, 108, 2.6, C.silver),
      sparkle(196, 108, 6, { s: "none", f: C.silver }),
      sparkle(404, 108, 6, { s: "none", f: C.silver }),
      // footer ornament (bottom only)
      line(214, 940, 282, 940, { s: C.silver, w: 1.5, o: 0.8 }),
      line(318, 940, 386, 940, { s: C.silver, w: 1.5, o: 0.8 }),
      poly(
        [
          [300, 929],
          [311, 940],
          [300, 951],
          [289, 940],
        ],
        { s: C.silver, w: 1.5, f: C.amethyst },
      ),
      dot(204, 940, 2.2, C.silver),
      dot(396, 940, 2.2, C.silver),
    ].join(""),
  );
}

// --------------------------------------------------------- shared motifs ---
const L = C.lavender;
const M = C.moon;
const B = C.blue;
const A = C.amethyst;
const V = C.violet;
const SV = C.silver;

function infinity(cx, cy, hw, hh, o = { s: M, w: 3.5 }) {
  return path(
    `M${cx},${cy} C${cx + hw * 0.4},${cy - hh} ${cx + hw},${cy - hh} ${cx + hw},${cy} ` +
      `C${cx + hw},${cy + hh} ${cx + hw * 0.4},${cy + hh} ${cx},${cy} ` +
      `C${cx - hw * 0.4},${cy - hh} ${cx - hw},${cy - hh} ${cx - hw},${cy} ` +
      `C${cx - hw},${cy + hh} ${cx - hw * 0.4},${cy + hh} ${cx},${cy}Z`,
    o,
  );
}

function tower(x, y, w, h, o = {}) {
  const m = w / 5;
  const top =
    `M${x},${y + h} L${x},${y} L${x + m},${y} L${x + m},${y + 12} L${x + 2 * m},${y + 12} L${x + 2 * m},${y} ` +
    `L${x + 3 * m},${y} L${x + 3 * m},${y + 12} L${x + 4 * m},${y + 12} L${x + 4 * m},${y} L${x + w},${y} L${x + w},${y + h}`;
  const cx = x + w / 2;
  return [
    path(top, { s: o.s ?? L, w: 3, f: A, fo: 0.45 }),
    path(`M${cx - 7},${y + 62} L${cx - 7},${y + 48} A7,7 0 0 1 ${cx + 7},${y + 48} L${cx + 7},${y + 62}Z`, {
      s: "none",
      f: M,
      o: 0.75,
    }),
  ].join("");
}

function goblet(cx, cy, rot, o = { s: M, w: 3, f: A, fo: 0.5 }) {
  return g(
    [
      path("M-28,-30 L28,-30 Q28,14 0,18 Q-28,14 -28,-30Z", o),
      line(0, 18, 0, 40, { s: o.s, w: 3 }),
      path("M-18,44 Q0,36 18,44", { s: o.s, w: 3 }),
    ],
    { transform: `translate(${cx} ${cy}) rotate(${rot})` },
  );
}

function flower5(cx, cy, r, o = { s: "none", f: M }) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const [x, y] = polar(cx, cy, r, -90 + i * 72);
    out.push(circle(x, y, r * 0.75, o));
  }
  out.push(dot(cx, cy, r * 0.55, A));
  return out.join("");
}

function wheat(x0, y0, qx, qy, x1, y1) {
  const out = [path(`M${x0},${y0} Q${qx},${qy} ${x1},${y1}`, { s: L, w: 3 })];
  let dx = x1 - qx;
  let dy = y1 - qy;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const px = -dy;
  const py = dx;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  for (let i = 0; i < 6; i++) {
    const cx = x1 - dx * (i * 15 + 14);
    const cy = y1 - dy * (i * 15 + 14);
    for (const side of [1, -1]) {
      out.push(
        ellipse(cx + px * 7 * side, cy + py * 7 * side, 4.5, 11, {
          s: M,
          w: 2.5,
          f: A,
          fo: 0.6,
          t: `rotate(${f(ang - 90 + 28 * side)} ${f(cx + px * 7 * side)} ${f(cy + py * 7 * side)})`,
        }),
      );
    }
  }
  out.push(ellipse(x1 + dx * 2, y1 + dy * 2, 4.5, 11, { s: M, w: 2.5, f: A, fo: 0.6, t: `rotate(${f(ang - 90)} ${f(x1)} ${f(y1)})` }));
  return out.join("");
}

function hills(d, o = { s: B, w: 2.5, o: 0.55 }) {
  return path(d, o);
}

// ------------------------------------------------------- card motifs (22) ---
const motifs = {
  fool() {
    return [
      glow(392, 318, 130),
      // trajectory of the leap, a dashed arc toward the star
      path("M368,684 C410,600 430,470 392,372", { s: B, w: 2.5, dash: "3 11", o: 0.9 }),
      star(392, 318, 46, 15, 8, { s: M, w: 3, f: A, fo: 0.55 }),
      star(392, 318, 20, 8, 4, { s: "none", f: M }, -90),
      sparkle(448, 252, 9),
      sparkle(330, 262, 6),
      sparkle(460, 384, 5),
      // far mountains beyond the edge
      hills("M396,900 L436,826 L462,852 L494,800 L530,846"),
      // the cliff
      path(
        "M60,716 L140,708 L230,702 L318,694 L374,688 L388,712 L378,748 L398,792 L384,842 L402,910 L60,910Z",
        { s: L, w: 3, f: A, fo: 0.38 },
      ),
      path("M120,760 L160,752 M200,800 L250,790 M110,850 L170,840", { s: L, w: 2.5, o: 0.5 }),
      // the bundle on a staff, resting at the edge
      line(292, 696, 344, 604, { s: M, w: 3 }),
      circle(350, 592, 17, { s: M, w: 3, f: A, fo: 0.8 }),
      path("M338,580 L332,570 M362,580 L368,570", { s: M, w: 2.5 }),
      // a small white flower and footprints
      line(138, 706, 138, 680, { s: B, w: 2.5 }),
      flower5(138, 672, 6),
      dot(200, 698, 3, M, 0.6),
      dot(232, 692, 3, M, 0.6),
      dot(264, 690, 3, M, 0.6),
    ];
  },

  magician() {
    const glyph = (x, y, down, bar, col) => {
      const pts = down
        ? [
            [x - 22, y - 14],
            [x + 22, y - 14],
            [x, y + 24],
          ]
        : [
            [x, y - 24],
            [x + 22, y + 14],
            [x - 22, y + 14],
          ];
      return poly(pts, { s: col, w: 3, f: A, fo: 0.4 }) + (bar ? line(x - 24, y, x + 24, y, { s: col, w: 3 }) : "");
    };
    return [
      glow(300, 292, 140),
      infinity(300, 292, 100, 48, { s: M, w: 4 }),
      // wand: as above, so below
      line(300, 364, 300, 524, { s: L, w: 3.5 }),
      sparkle(300, 360, 16),
      path("M286,512 L300,530 L314,512", { s: L, w: 3 }),
      circle(300, 444, 6, { s: "none", f: M }),
      // table
      glyph(180, 572, false, false, M),
      glyph(260, 572, true, false, B),
      glyph(340, 572, false, true, L),
      glyph(420, 572, true, true, M),
      rect(130, 612, 340, 20, { s: L, w: 3, f: A, fo: 0.6, rx: 3 }),
      line(160, 632, 160, 820, { s: L, w: 3 }),
      line(440, 632, 440, 820, { s: L, w: 3 }),
      line(160, 770, 440, 770, { s: L, w: 2.5, o: 0.6 }),
      path("M130,632 Q300,676 470,632", { s: B, w: 2.5, o: 0.6 }),
      // floor garden
      flower5(112, 860, 7, { s: "none", f: L }),
      flower5(488, 860, 7, { s: "none", f: L }),
      path("M80,880 Q300,850 520,880", { s: B, w: 2.5, o: 0.5 }),
    ];
  },

  "high-priestess"() {
    const pillar = (x, filled) =>
      [
        rect(x - 6, 336, 62, 22, { s: filled ? L : M, w: 3, f: filled ? A : "none", fo: 0.9, rx: 2 }),
        rect(x, 358, 50, 482, { s: filled ? L : M, w: 3, f: filled ? A : "none", fo: 0.7 }),
        rect(x - 6, 840, 62, 22, { s: filled ? L : M, w: 3, f: filled ? A : "none", fo: 0.9, rx: 2 }),
      ].join("");
    const veil = [];
    for (let i = 0; i <= 4; i++) {
      const t = (i + 0.5) / 5;
      const x = (1 - t) ** 2 * 186 + 2 * (1 - t) * t * 300 + t * t * 414;
      const y = (1 - t) ** 2 * 372 + 2 * (1 - t) * t * 460 + t * t * 372;
      veil.push(line(x, y, x, y + 26, { s: B, w: 2.5, o: 0.7 }), circle(x, y + 34, 7, { s: L, w: 2.5, f: A }));
    }
    return [
      glow(300, 286, 130),
      // triple moon crown
      circle(300, 286, 30, { s: M, w: 3, f: M, fo: 0.85 }),
      moonLit(234, 286, 24, 0.45, false, 180),
      moonLit(366, 286, 24, 0.45, false, 0),
      pillar(130, true),
      pillar(420, false),
      path("M186,372 Q300,460 414,372", { s: B, w: 3 }),
      ...veil,
      // scroll
      rect(258, 560, 84, 46, { s: M, w: 3, f: A, fo: 0.5, rx: 4 }),
      circle(258, 583, 8, { s: M, w: 3, f: V }),
      circle(342, 583, 8, { s: M, w: 3, f: V }),
      line(276, 576, 324, 576, { s: L, w: 2.5 }),
      line(276, 590, 314, 590, { s: L, w: 2.5 }),
      // crescent at the feet, horns up
      moonLit(300, 776, 46, 0.55, false, -90),
      path("M196,852 Q248,840 300,852 T404,852", { s: B, w: 2.5, o: 0.7 }),
      path("M210,878 Q255,868 300,878 T390,878", { s: B, w: 2.5, o: 0.45 }),
    ];
  },

  empress() {
    const stars = [];
    for (let i = 0; i < 12; i++) {
      const [x, y] = polar(300, 318, 86, -90 + i * 30);
      stars.push(star(x, y, 11, 4.5, 5, { s: "none", f: M }));
    }
    return [
      glow(300, 318, 150),
      circle(300, 318, 86, { s: SV, w: 1.5, o: 0.45 }),
      ...stars,
      // Venus glyph
      circle(300, 300, 24, { s: L, w: 3.5, f: A, fo: 0.5 }),
      line(300, 324, 300, 372, { s: L, w: 3.5 }),
      line(280, 350, 320, 350, { s: L, w: 3.5 }),
      // rolling hills and a stream
      hills("M70,812 Q180,762 300,800 T530,786"),
      path("M90,872 Q190,846 260,866 T420,860 T530,870", { s: B, w: 2.5, o: 0.45 }),
      // wheat sheaf
      wheat(300, 880, 300, 720, 300, 540),
      wheat(296, 880, 260, 720, 232, 574),
      wheat(304, 880, 340, 720, 368, 574),
      wheat(292, 880, 210, 760, 176, 630),
      wheat(308, 880, 390, 760, 424, 630),
      path("M268,820 Q300,836 332,820", { s: M, w: 3 }),
    ];
  },

  emperor() {
    const aries =
      "M300,336 L300,296 C300,262 282,244 262,248 C244,252 242,276 256,284 C266,290 276,282 272,272 " +
      "M300,296 C300,262 318,244 338,248 C356,252 358,276 344,284 C334,290 324,282 328,272";
    return [
      glow(300, 290, 120),
      path(aries, { s: M, w: 3.5 }),
      // distant peaks behind the throne
      hills("M70,780 L110,700 L140,736 L176,668 L210,740", { s: B, w: 2.5, o: 0.5 }),
      hills("M530,780 L490,700 L460,736 L424,668 L390,740", { s: B, w: 2.5, o: 0.5 }),
      // orb with cross
      circle(300, 400, 13, { s: M, w: 3, f: A }),
      line(300, 387, 300, 368, { s: M, w: 3 }),
      line(291, 376, 309, 376, { s: M, w: 3 }),
      // throne back with ram horns
      rect(208, 426, 184, 266, { s: L, w: 3, f: A, fo: 0.45, rx: 4 }),
      path(spiral(208, 450, 4, 38, 1.6, 0, -1), { s: M, w: 3 }),
      path(spiral(392, 450, 4, 38, 1.6, 180, 1), { s: M, w: 3 }),
      // cube emblem
      rect(276, 500, 48, 48, { s: M, w: 2.5 }),
      path("M276,500 L300,486 L348,486 L324,500 M348,486 L348,534 L324,548", { s: M, w: 2.5, o: 0.8 }),
      // arms, seat, base, step
      rect(176, 604, 32, 88, { s: L, w: 3, f: A, fo: 0.6, rx: 3 }),
      rect(392, 604, 32, 88, { s: L, w: 3, f: A, fo: 0.6, rx: 3 }),
      rect(168, 692, 264, 28, { s: M, w: 3, f: A, fo: 0.8, rx: 3 }),
      rect(196, 720, 208, 96, { s: L, w: 3, f: A, fo: 0.35 }),
      line(248, 734, 248, 802, { s: L, w: 2.5, o: 0.6 }),
      line(352, 734, 352, 802, { s: L, w: 2.5, o: 0.6 }),
      rect(156, 816, 288, 26, { s: SV, w: 2.5, f: V, rx: 3 }),
    ];
  },

  hierophant() {
    const key = (rot, col) =>
      g(
        [
          circle(0, -96, 22, { s: col, w: 3.5, f: A, fo: 0.5 }),
          circle(0, -96, 8, { s: col, w: 2.5 }),
          line(0, -74, 0, 92, { s: col, w: 3.5 }),
          path("M0,60 L24,60 L24,72 L12,72 L12,82 L24,82 L24,92 L0,92", { s: col, w: 3 }),
        ],
        { transform: `translate(300 670) rotate(${rot})` },
      );
    return [
      glow(300, 300, 130),
      // triple cross
      line(300, 246, 300, 528, { s: M, w: 4 }),
      line(282, 278, 318, 278, { s: M, w: 4 }),
      line(270, 306, 330, 306, { s: M, w: 4 }),
      line(256, 336, 344, 336, { s: M, w: 4 }),
      sparkle(300, 240, 12),
      ...[282, 318, 270, 330, 256, 344].map((x, i) => dot(x, [278, 278, 306, 306, 336, 336][i], 5, L)),
      // two slim columns
      line(118, 440, 118, 860, { s: L, w: 3, o: 0.7 }),
      line(482, 440, 482, 860, { s: L, w: 3, o: 0.7 }),
      rect(106, 424, 24, 14, { s: L, w: 2.5, f: A }),
      rect(470, 424, 24, 14, { s: L, w: 2.5, f: A }),
      // crossed keys
      key(-34, M),
      key(34, B),
      // three steps
      rect(214, 812, 172, 18, { s: SV, w: 2.5, f: A, fo: 0.5 }),
      rect(184, 830, 232, 18, { s: SV, w: 2.5, f: A, fo: 0.4 }),
      rect(154, 848, 292, 18, { s: SV, w: 2.5, f: A, fo: 0.3 }),
    ];
  },

  lovers() {
    const rays = [];
    for (let i = 0; i < 16; i++) {
      const a = -90 + i * 22.5;
      const [x1, y1] = polar(300, 282, 52, a);
      const [x2, y2] = polar(300, 282, i % 2 ? 72 : 90, a);
      rays.push(line(x1, y1, x2, y2, { s: i % 2 ? L : M, w: 3 }));
    }
    const orbit = (rot, col, t) => {
      const [cx, cy, rx, ry] = [300, 576, 136, 54];
      const x = rx * Math.cos(t);
      const y = ry * Math.sin(t);
      const c = Math.cos(rad(rot));
      const s = Math.sin(rad(rot));
      return (
        ellipse(cx, cy, rx, ry, { s: col, w: 3, t: `rotate(${rot} ${cx} ${cy})` }) +
        circle(cx + x * c - y * s, cy + x * s + y * c, 12, { s: col, w: 3, f: A })
      );
    };
    return [
      glow(300, 282, 150),
      ...rays,
      circle(300, 282, 40, { s: M, w: 3.5, f: A, fo: 0.6 }),
      orbit(28, M, Math.PI * 0.95),
      orbit(-28, B, Math.PI * 0.05),
      sparkle(300, 576, 14),
      // mountain between, trees on each side
      path("M214,872 L300,750 L386,872", { s: L, w: 3, f: A, fo: 0.3 }),
      line(140, 872, 140, 770, { s: L, w: 3 }),
      ...[
        [140, 752],
        [120, 782],
        [160, 782],
      ].map(([x, y]) => drop(x, y, 1.3, { s: "none", f: M })),
      line(460, 872, 460, 770, { s: L, w: 3 }),
      circle(460, 752, 30, { s: L, w: 3, f: A, fo: 0.5 }),
      path("M452,866 C474,850 446,830 466,812 C478,800 458,792 468,780", { s: B, w: 2.5 }),
      path("M80,880 Q300,860 520,880", { s: B, w: 2.5, o: 0.5 }),
    ];
  },

  chariot() {
    let scallop = "M150,360";
    for (let i = 0; i < 5; i++) scallop += ` q30,30 60,0`;
    const canopyStars = [];
    for (let i = 0; i < 7; i++) {
      const x = 174 + i * 42;
      const y = 342 - Math.sin((i / 6) * Math.PI) * 28;
      canopyStars.push(star(x, y, 10, 4, 5, { s: "none", f: M }));
    }
    const wheel = (cx, cy) => {
      const spokes = [];
      for (let i = 0; i < 6; i++) {
        const [x, y] = polar(cx, cy, 30, i * 60);
        spokes.push(line(cx, cy, x, y, { s: L, w: 2.5 }));
      }
      return circle(cx, cy, 30, { s: M, w: 3, f: V }) + spokes.join("") + dot(cx, cy, 5, M);
    };
    return [
      glow(300, 320, 130),
      path(`M150,360 Q300,270 450,360` + " q-30,30 -60,0".repeat(5) + "Z", { s: M, w: 3, f: A, fo: 0.4 }),
      path(scallop, { s: L, w: 3 }),
      ...canopyStars,
      line(160, 366, 160, 600, { s: L, w: 3 }),
      line(440, 366, 440, 600, { s: L, w: 3 }),
      // chariot body with winged disc
      path("M140,600 L460,600 L436,716 L164,716Z", { s: L, w: 3, f: A, fo: 0.45 }),
      circle(300, 652, 14, { s: "none", f: M }),
      path("M282,652 Q246,628 210,642 Q246,650 282,662", { s: M, w: 2.5, f: A }),
      path("M318,652 Q354,628 390,642 Q354,650 318,662", { s: M, w: 2.5, f: A }),
      wheel(184, 734),
      wheel(416, 734),
      // twin sphinx crescents: dark and light
      moonLit(234, 830, 34, 0.5, false, -90, { s: L, w: 2.5, f: V }),
      moonLit(366, 830, 34, 0.5, false, -90, { s: "none", f: M }),
      sparkle(234, 818, 7, { s: "none", f: L }),
      sparkle(366, 818, 7, { s: "none", f: A }),
      path("M90,876 Q300,858 510,876", { s: B, w: 2.5, o: 0.5 }),
    ];
  },

  strength() {
    const mane = [];
    for (let i = 0; i < 16; i++) {
      const a = i * 22.5;
      const [x1, y1] = polar(300, 636, 52, a);
      const [qx, qy] = polar(300, 636, 92, a + 24);
      const [x2, y2] = polar(300, 636, 116, a + 8);
      mane.push(path(`M${x1},${y1} Q${qx},${qy} ${x2},${y2}`, { s: i % 2 ? L : M, w: 3 }));
    }
    return [
      glow(300, 286, 120),
      infinity(300, 286, 74, 36, { s: M, w: 3.5 }),
      // garland flowing from the lemniscate to the mane
      path("M232,304 C170,380 176,470 214,528", { s: B, w: 3, dash: "0.5 10" }),
      path("M368,304 C430,380 424,470 386,528", { s: B, w: 3, dash: "0.5 10" }),
      flower5(214, 540, 5, { s: "none", f: L }),
      flower5(386, 540, 5, { s: "none", f: L }),
      // stylised lion
      ...mane,
      circle(270, 600, 11, { s: M, w: 3, f: A }),
      circle(330, 600, 11, { s: M, w: 3, f: A }),
      circle(300, 636, 46, { s: M, w: 3, f: A }),
      path("M280,624 Q286,618 292,624 M308,624 Q314,618 320,624", { s: M, w: 2.5 }),
      path("M292,644 L308,644 L300,654Z", { s: "none", f: M }),
      path("M300,654 L300,662 M290,666 Q300,672 310,666", { s: M, w: 2.5 }),
      // meadow
      path("M80,840 Q300,812 520,840", { s: B, w: 2.5, o: 0.55 }),
      path("M130,872 l6,-18 l6,18 M240,866 l6,-16 l6,16 M350,866 l6,-16 l6,16 M456,872 l6,-18 l6,18", {
        s: L,
        w: 2.5,
        o: 0.6,
      }),
    ];
  },

  hermit() {
    return [
      glow(300, 410, 150),
      // the peak
      path("M60,910 L60,850 L180,770 L240,712 L300,640 L362,706 L432,770 L540,846 L540,910Z", {
        s: L,
        w: 3,
        f: A,
        fo: 0.38,
      }),
      path("M262,686 L282,702 L300,682 L320,704 L340,690", { s: M, w: 2.5 }),
      path("M150,830 L190,812 M390,800 L440,820", { s: L, w: 2.5, o: 0.5 }),
      // staff with crook
      path("M364,668 L364,308 Q364,278 334,278 Q300,278 300,304", { s: L, w: 3.5 }),
      // lantern
      line(300, 304, 300, 336, { s: M, w: 3 }),
      path("M278,354 L300,334 L322,354Z", { s: M, w: 3, f: A }),
      path("M276,356 L324,356 L332,382 L332,446 L324,468 L276,468 L268,446 L268,382Z", {
        s: M,
        w: 3,
        f: A,
        fo: 0.45,
      }),
      star(300, 412, 22, 12.7, 6, { s: "none", f: M }),
      line(276, 468, 324, 468, { s: M, w: 3 }),
      dot(300, 476, 4, M),
    ];
  },

  "wheel-of-fortune"() {
    const cx = 300;
    const cy = 552;
    const spokes = [];
    for (let i = 0; i < 8; i++) {
      const a = i * 45 + 22.5;
      const [x1, y1] = polar(cx, cy, 28, a);
      const [x2, y2] = polar(cx, cy, 112, a);
      const [x3, y3] = polar(cx, cy, 148, a);
      const [x4, y4] = polar(cx, cy, 162, a);
      spokes.push(line(x1, y1, x2, y2, { s: L, w: 3 }), line(x3, y3, x4, y4, { s: SV, w: 2.5 }));
    }
    const at = (deg, inner) => {
      const [x, y] = polar(cx, cy, 138, deg);
      return g(inner, { transform: `translate(${x} ${y})` });
    };
    const mercury = [
      circle(0, -2, 8, { s: M, w: 2.5 }),
      path("M-8,-18 A8,8 0 0 0 8,-18", { s: M, w: 2.5 }),
      line(0, 6, 0, 20, { s: M, w: 2.5 }),
      line(-7, 13, 7, 13, { s: M, w: 2.5 }),
    ];
    const sulfur = [
      path("M0,-20 L12,0 L-12,0Z", { s: M, w: 2.5 }),
      line(0, 0, 0, 20, { s: M, w: 2.5 }),
      line(-8, 11, 8, 11, { s: M, w: 2.5 }),
    ];
    const salt = [circle(0, 0, 12, { s: M, w: 2.5 }), line(-12, 0, 12, 0, { s: M, w: 2.5 })];
    const water = [
      path("M-14,-5 l7,-6 l7,6 l7,-6 l7,6", { s: M, w: 2.5 }),
      path("M-14,7 l7,-6 l7,6 l7,-6 l7,6", { s: M, w: 2.5 }),
    ];
    return [
      glow(cx, cy, 190),
      // perched star above the wheel
      path("M276,372 L300,350 L324,372", { s: L, w: 3 }),
      star(300, 322, 24, 9, 8, { s: M, w: 2.5, f: A, fo: 0.6 }),
      circle(cx, cy, 164, { s: SV, w: 3 }),
      circle(cx, cy, 148, { s: L, w: 2.5, o: 0.7 }),
      circle(cx, cy, 112, { s: L, w: 3, f: A, fo: 0.25 }),
      ...spokes,
      circle(cx, cy, 28, { s: M, w: 3, f: A }),
      dot(cx, cy, 8, M),
      at(-90, mercury),
      at(0, sulfur),
      at(90, salt),
      at(180, water),
      // rising and falling currents
      path("M104,430 q12,20 0,40 q-12,20 0,40 q12,20 0,40 q-12,20 0,40", { s: B, w: 2.5 }),
      path("M92,630 L104,650 L116,630", { s: B, w: 2.5 }),
      path("M496,670 q12,-20 0,-40 q-12,-20 0,-40 q12,-20 0,-40 q-12,-20 0,-40", { s: B, w: 2.5 }),
      path("M484,522 L496,502 L508,522", { s: B, w: 2.5 }),
      // cloud bank
      path(
        "M90,860 Q104,820 140,830 Q160,796 200,816 Q230,790 262,818 Q300,800 330,824 Q370,796 400,822 Q440,804 458,834 Q500,826 510,862",
        { s: L, w: 3, f: A, fo: 0.35 },
      ),
    ];
  },

  justice() {
    return [
      glow(300, 396, 140),
      // upright sword
      path("M300,236 L313,266 L313,540 L287,540 L287,266Z", { s: M, w: 3, f: A, fo: 0.45 }),
      line(300, 276, 300, 526, { s: L, w: 2.5 }),
      line(248, 550, 352, 550, { s: M, w: 4 }),
      dot(244, 550, 6, M),
      dot(356, 550, 6, M),
      rect(293, 556, 14, 36, { s: M, w: 2.5, f: A, rx: 3 }),
      circle(300, 602, 10, { s: M, w: 3, f: A }),
      // scales
      line(300, 616, 300, 852, { s: SV, w: 3 }),
      line(156, 652, 444, 652, { s: M, w: 3.5 }),
      circle(300, 652, 8, { s: M, w: 3, f: A }),
      dot(156, 652, 5, M),
      dot(444, 652, 5, M),
      path("M168,656 L126,760 M168,656 L210,760", { s: B, w: 2.5 }),
      path("M432,656 L390,760 M432,656 L474,760", { s: B, w: 2.5 }),
      path("M118,760 Q168,806 218,760Z", { s: M, w: 3, f: A, fo: 0.6 }),
      path("M382,760 Q432,806 482,760Z", { s: M, w: 3, f: A, fo: 0.6 }),
      path("M256,876 L344,876 L324,852 L276,852Z", { s: SV, w: 3, f: A, fo: 0.5 }),
    ];
  },

  "hanged-man"() {
    const leaves = [
      [196, 290, -30],
      [240, 288, 20],
      [362, 288, -20],
      [406, 290, 30],
      [290, 760, -60],
      [310, 800, 60],
    ].map(([x, y, r]) => ellipse(x, y, 5, 12, { s: "none", f: L, o: 0.85, t: `rotate(${r} ${x} ${y})` }));
    const halo = [];
    for (let i = 0; i < 9; i++) {
      const a = 20 + i * 17.5;
      const [x1, y1] = polar(300, 600, 56, a);
      const [x2, y2] = polar(300, 600, i % 2 ? 70 : 80, a);
      halo.push(line(x1, y1, x2, y2, { s: M, w: 2.5 }));
    }
    return [
      glow(300, 602, 120),
      // living tau cross
      line(300, 302, 300, 864, { s: L, w: 6 }),
      line(168, 302, 432, 302, { s: L, w: 6 }),
      ...leaves,
      // the suspended figure, abstract: a "4" above an inverted triangle
      line(300, 304, 300, 330, { s: M, w: 3 }),
      path("M300,330 L300,468 M300,468 L344,404 L300,404", { s: M, w: 3.5 }),
      path("M284,468 L316,468 L324,560 L276,560Z", { s: M, w: 3, f: A }),
      path("M280,554 L254,504 L300,480 L346,504 L320,554", { s: B, w: 3 }),
      // the halo, hanging below
      circle(300, 600, 46, { s: M, w: 2.5, o: 0.85 }),
      circle(300, 600, 20, { s: M, w: 3, f: V }),
      ...halo,
      path("M110,866 Q300,842 490,866", { s: B, w: 2.5, o: 0.55 }),
    ];
  },

  death() {
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const [x, y] = polar(300, 340, 24, -90 + i * 72);
      petals.push(circle(x, y, 24, { s: M, w: 2.5, f: M, fo: 0.18 }));
    }
    const rays = [];
    for (let i = 0; i < 11; i++) {
      const a = 180 + 15 + i * 15;
      const [x1, y1] = polar(300, 772, 76, a);
      const [x2, y2] = polar(300, 772, i % 2 ? 100 : 116, a);
      rays.push(line(x1, y1, x2, y2, { s: L, w: 2.5 }));
    }
    return [
      glow(300, 772, 170),
      // white rose
      line(300, 380, 300, 470, { s: L, w: 3 }),
      ellipse(278, 438, 7, 16, { s: "none", f: L, t: "rotate(-50 278 438)" }),
      ellipse(322, 418, 7, 16, { s: "none", f: L, t: "rotate(50 322 418)" }),
      ...petals,
      path(spiral(300, 340, 2, 16, 1.6, 0, 1), { s: M, w: 2.5 }),
      // two towers and the rising sun between
      tower(118, 560, 66, 212),
      tower(416, 560, 66, 212),
      ...rays,
      path("M240,772 A60,60 0 0 1 360,772Z", { s: M, w: 3, f: M, fo: 0.22 }),
      line(70, 772, 530, 772, { s: SV, w: 2.5 }),
      // river
      path("M120,808 Q210,796 300,808 T480,808", { s: B, w: 2.5, o: 0.8 }),
      path("M150,840 Q225,830 300,840 T450,840", { s: B, w: 2.5, o: 0.6 }),
      path("M190,870 Q245,862 300,870 T410,870", { s: B, w: 2.5, o: 0.4 }),
    ];
  },

  temperance() {
    return [
      glow(300, 276, 130),
      // crown at the end of the road
      path("M256,302 L256,262 L278,282 L300,250 L322,282 L344,262 L344,302Z", { s: M, w: 3, f: A, fo: 0.6 }),
      line(256, 302, 344, 302, { s: M, w: 3.5 }),
      dot(256, 258, 4.5, M),
      dot(300, 246, 4.5, M),
      dot(344, 258, 4.5, M),
      // triangle within a square
      rect(280, 352, 40, 40, { s: L, w: 2.5 }),
      path("M300,358 L315,386 L285,386Z", { s: L, w: 2.5 }),
      // two cups and the flowing arc
      goblet(196, 474, -28),
      goblet(408, 612, 8),
      path("M228,436 C300,404 396,460 398,580", { s: B, w: 3.5 }),
      path("M232,450 C296,428 380,474 384,580", { s: B, w: 2.5, o: 0.6 }),
      sparkle(318, 432, 6, { s: "none", f: B }),
      sparkle(372, 488, 5, { s: "none", f: B }),
      // path through the hills
      hills("M70,770 Q170,708 278,742", { s: L, w: 2.5, o: 0.7 }),
      hills("M322,742 Q430,708 530,770", { s: L, w: 2.5, o: 0.7 }),
      path("M214,904 C196,846 316,820 292,744", { s: M, w: 2.5 }),
      path("M386,904 C368,846 334,818 308,744", { s: M, w: 2.5 }),
      ellipse(130, 860, 52, 12, { s: B, w: 2.5, f: A, fo: 0.4 }),
    ];
  },

  devil() {
    const link = (x, y, rot) => ellipse(x, y, 9, 5.5, { s: SV, w: 2.5, t: `rotate(${f(rot)} ${f(x)} ${f(y)})` });
    const chain = (x0, y0, qx, qy, x1, y1) => {
      const out = [];
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * qx + t * t * x1;
        const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * qy + t * t * y1;
        const dx = 2 * (1 - t) * (qx - x0) + 2 * t * (x1 - qx);
        const dy = 2 * (1 - t) * (qy - y0) + 2 * t * (y1 - qy);
        out.push(link(x, y, (Math.atan2(dy, dx) * 180) / Math.PI + (i % 2 ? 90 : 0)));
      }
      return out.join("");
    };
    const pent = [];
    for (let k = 0; k < 5; k++) pent.push(polar(300, 352, 90, 90 + k * 144));
    return [
      glow(300, 352, 130),
      circle(300, 352, 100, { s: SV, w: 2.5 }),
      circle(300, 352, 108, { s: SV, w: 1.2, o: 0.5 }),
      poly(pent, { s: L, w: 3 }),
      // pedestal
      rect(214, 590, 172, 16, { s: L, w: 3, f: A, rx: 2 }),
      rect(232, 606, 136, 80, { s: L, w: 3, f: A, fo: 0.55 }),
      circle(250, 668, 7, { s: SV, w: 2.5 }),
      circle(350, 668, 7, { s: SV, w: 2.5 }),
      path("M276,624 L324,624 M284,646 L316,646", { s: L, w: 2.5, o: 0.6 }),
      // loose chains and opened shackles
      chain(246, 680, 214, 790, 182, 794),
      chain(354, 680, 386, 790, 418, 794),
      path("M176,818 A20,20 0 1 1 196,800", { s: SV, w: 3 }),
      path("M424,818 A20,20 0 1 0 404,800", { s: SV, w: 3 }),
      path("M90,868 Q300,846 510,868", { s: B, w: 2.5, o: 0.5 }),
    ];
  },

  tower() {
    const sparks = [
      [128, 470, 1.1],
      [170, 540, 0.9],
      [112, 620, 1],
      [190, 660, 0.8],
      [140, 740, 1],
      [204, 470, 0.7],
      [462, 500, 1.1],
      [420, 560, 0.8],
      [486, 610, 0.9],
      [432, 680, 1],
      [470, 760, 0.8],
      [404, 470, 0.7],
    ].map(([x, y, s], i) => drop(x, y, s, { s: "none", f: i % 3 ? L : M }));
    return [
      glow(330, 404, 120),
      // rock
      path("M168,904 L190,852 L236,830 L364,830 L410,852 L432,904Z", { s: L, w: 3, f: A, fo: 0.35 }),
      // tower
      path("M246,830 L260,420 L340,420 L354,830Z", { s: L, w: 3, f: A, fo: 0.4 }),
      path("M256,420 L256,398 L272,398 L272,410 L292,410 L292,398 L308,398 L308,410 L328,410 L328,398 L344,398 L344,420", {
        s: L,
        w: 3,
      }),
      ...[500, 610, 720].map((y) =>
        path(`M293,${y + 24} L293,${y + 8} A7,7 0 0 1 307,${y + 8} L307,${y + 24}Z`, { s: "none", f: M, o: 0.8 }),
      ),
      path("M326,424 L312,470 L322,500 L304,560 L314,600", { s: M, w: 2.5, o: 0.8 }),
      // crown tossed into the air
      g(path("M-24,14 L-24,-10 L-12,2 L0,-18 L12,2 L24,-10 L24,14Z", { s: M, w: 3, f: A, fo: 0.6 }), {
        transform: "translate(410 338) rotate(28)",
      }),
      // lightning
      path("M492,196 L428,284 L456,290 L382,364 L406,368 L332,418", { s: M, w: 4 }),
      ...sparks,
    ];
  },

  star() {
    const small = [
      [150, 246],
      [450, 246],
      [118, 380],
      [482, 380],
      [182, 486],
      [418, 486],
      [300, 480],
    ].map(([x, y]) => star(x, y, 17, 6, 8, { s: "none", f: M }));
    const jug = (x, y, rot) =>
      g(
        [
          path("M-8,-30 L8,-30 L8,-20 C26,-14 28,16 0,30 C-28,16 -26,-14 -8,-20Z", { s: M, w: 3, f: A, fo: 0.6 }),
          line(-12, -32, 12, -32, { s: M, w: 3 }),
          path("M9,-22 C28,-26 30,0 20,6", { s: M, w: 2.5 }),
        ],
        { transform: `translate(${x} ${y}) rotate(${rot})` },
      );
    return [
      glow(300, 320, 150),
      star(300, 320, 88, 30, 8, { s: M, w: 3, f: M, fo: 0.18 }),
      star(300, 320, 46, 18, 8, { s: "none", f: M, o: 0.85 }, -90 + 22.5),
      ...small,
      // two vessels pouring
      jug(250, 610, -110),
      jug(350, 610, 110),
      path("M381,622 C404,640 392,710 356,778", { s: B, w: 3 }),
      path("M219,622 C192,646 162,760 150,830", { s: B, w: 3 }),
      path("M150,830 L120,850 M150,830 L150,858 M150,830 L182,852", { s: B, w: 2.5, o: 0.7 }),
      // pool
      ellipse(312, 790, 168, 40, { s: B, w: 3, f: A, fo: 0.35 }),
      ellipse(346, 786, 72, 16, { s: B, w: 2.5, o: 0.7 }),
      ellipse(350, 784, 32, 7, { s: B, w: 2.5, o: 0.5 }),
      path("M80,870 Q300,850 520,870", { s: L, w: 2.5, o: 0.5 }),
    ];
  },

  moon() {
    const rays = [];
    for (let i = 0; i < 24; i++) {
      const a = i * 15;
      const [x1, y1] = polar(300, 310, 90, a);
      const [x2, y2] = polar(300, 310, i % 2 ? 102 : 114, a);
      rays.push(line(x1, y1, x2, y2, { s: L, w: 2.5, o: 0.8 }));
    }
    return [
      glow(300, 310, 160),
      ...rays,
      circle(300, 310, 78, { s: M, w: 3, f: A, fo: 0.45 }),
      moonLit(300, 310, 78, 0.42, false, 180, { s: "none", f: M, o: 0.92 }),
      ...[
        [240, 428],
        [300, 446],
        [360, 428],
        [270, 488],
        [330, 488],
      ].map(([x, y]) => drop(x, y, 0.9, { s: "none", f: L })),
      // distant ridge and towers
      hills("M180,598 L230,574 L270,590 L300,572 L330,590 L370,574 L420,598", { s: L, w: 2.5, o: 0.6 }),
      tower(100, 540, 66, 236),
      tower(434, 540, 66, 236),
      // winding path
      // winding path of stepping stones, shrinking toward the horizon
      ...Array.from({ length: 13 }, (_, i) => {
        const t = i / 12;
        const y = 846 - t * 236;
        const x = 300 + Math.sin(t * Math.PI * 2.2) * 46 * (1 - t * 0.7);
        const k = 1 - t * 0.65;
        return ellipse(x, y, 15 * k, 5 * k, { s: M, w: 2.5, f: A, fo: 0.5 });
      }),
      // pool with a crayfish-like ripple
      ellipse(300, 884, 170, 34, { s: B, w: 3, f: A, fo: 0.4 }),
      ellipse(300, 884, 90, 16, { s: B, w: 2.5, o: 0.6 }),
      ellipse(300, 872, 8, 14, { s: M, w: 2.5, f: A }),
      path("M294,860 Q280,850 282,836 Q290,842 296,850", { s: M, w: 2.5 }),
      path("M306,860 Q320,850 318,836 Q310,842 304,850", { s: M, w: 2.5 }),
    ];
  },

  sun() {
    const rays = [];
    for (let i = 0; i < 24; i++) {
      const a = i * 15 - 90;
      if (i % 2 === 0) {
        const [x1, y1] = polar(300, 330, 78, a);
        const [x2, y2] = polar(300, 330, 146, a);
        rays.push(line(x1, y1, x2, y2, { s: M, w: 3 }));
      } else {
        const [x1, y1] = polar(300, 330, 80, a - 3);
        const [x2, y2] = polar(300, 330, 114, a);
        const [x3, y3] = polar(300, 330, 80, a + 3);
        rays.push(path(`M${x1},${y1} L${x2},${y2} L${x3},${y3}`, { s: L, w: 2.5, f: L, fo: 0.35 }));
      }
    }
    const sunflower = (x, y, h) => {
      const out = [
        path(`M${x},${700} Q${x + 10},${(700 + y) / 2} ${x},${y + 20}`, { s: L, w: 3 }),
        ellipse(x + 12, y + 70, 6, 14, { s: "none", f: L, o: 0.8, t: `rotate(50 ${x + 12} ${y + 70})` }),
      ];
      for (let i = 0; i < 12; i++) {
        const a = i * 30;
        const [px, py] = polar(x, y, 22 * h, a);
        out.push(ellipse(px, py, 5 * h, 11 * h, { s: "none", f: M, o: 0.85, t: `rotate(${a + 90} ${px} ${py})` }));
      }
      out.push(circle(x, y, 14 * h, { s: L, w: 2.5, f: A }));
      return out.join("");
    };
    const bricks = [];
    for (let row = 0; row < 3; row++) {
      const y = 700 + row * 22;
      bricks.push(line(80, y + 22, 520, y + 22, { s: SV, w: 1.5, o: 0.6 }));
      for (let x = 96 + (row % 2) * 30; x < 520; x += 60) bricks.push(line(x, y, x, y + 22, { s: SV, w: 1.5, o: 0.6 }));
    }
    return [
      glow(300, 330, 175),
      ...rays,
      circle(300, 330, 62, { s: M, w: 3.5, f: M, fo: 0.2 }),
      circle(300, 330, 44, { s: L, w: 2.5 }),
      sunflower(160, 572, 0.9),
      sunflower(240, 530, 1),
      sunflower(360, 530, 1),
      sunflower(440, 572, 0.9),
      rect(70, 700, 460, 66, { s: SV, w: 2.5, f: A, fo: 0.4 }),
      ...bricks,
      path("M70,820 Q300,790 530,820", { s: B, w: 2.5, o: 0.5 }),
      path("M140,866 l6,-16 l6,16 M296,852 l6,-16 l6,16 M450,866 l6,-16 l6,16", { s: L, w: 2.5, o: 0.6 }),
    ];
  },

  judgement() {
    // trumpet axis from mouthpiece (440,224) to bell mouth (246,392)
    const [ax, ay, bx, by] = [440, 224, 252, 386];
    const ang = Math.atan2(by - ay, bx - ax);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const bell = (w, t) => [f(ax + (bx - ax) * t + nx * w), f(ay + (by - ay) * t + ny * w)];
    const tube =
      `M${bell(4, 0)} L${bell(5, 0.68)} Q${bell(9, 0.9)} ${bell(30, 1)} L${bell(-30, 1)} Q${bell(-9, 0.9)} ${bell(-5, 0.68)} L${bell(-4, 0)}Z`;
    const rays = [];
    for (let i = 0; i < 9; i++) {
      const a = 70 + i * 13;
      const [x1, y1] = polar(bx, by, 50, a);
      const [x2, y2] = polar(bx, by, 150 + (i % 2) * 50, a);
      rays.push(line(x1, y1, x2, y2, { s: B, w: 2.5, dash: "2 10", o: 0.85 }));
    }
    const rising = (x, h) =>
      [
        // an opened vessel, its lid set aside, and a luminous form unfolding upward
        rect(x - 34, 794, 68, 42, { s: L, w: 3, f: A, fo: 0.5, rx: 3 }),
        line(x + 30, 792, x + 48, 744, { s: L, w: 3, o: 0.8 }),
        path(`M${x},${794 - h} Q${x + 20},${794 - h * 0.45} ${x},${790} Q${x - 20},${794 - h * 0.45} ${x},${794 - h}Z`, {
          s: M,
          w: 3,
          f: M,
          fo: 0.2,
        }),
        path(
          `M${x - 8},${794 - h * 0.3} C${x - 30},${794 - h * 0.45} ${x - 34},${774 - h} ${x - 22},${760 - h}` +
            ` M${x + 8},${794 - h * 0.3} C${x + 30},${794 - h * 0.45} ${x + 34},${774 - h} ${x + 22},${760 - h}`,
          { s: L, w: 3 },
        ),
        dot(x, 780 - h, 4, M),
      ].join("");
    return [
      glow(bx, by, 130),
      // clouds
      path(
        "M90,300 Q110,258 150,272 Q172,238 214,258 Q236,236 266,256 L300,276",
        { s: L, w: 3, o: 0.7 },
      ),
      path("M380,430 Q420,404 452,424 Q482,404 510,430", { s: L, w: 3, o: 0.7 }),
      ...rays,
      path(tube, { s: M, w: 3, f: A, fo: 0.7 }),
      // small banner with an equal-armed cross
      (() => {
        const [p1x, p1y] = bell(6, 0.3);
        const [p2x, p2y] = bell(6, 0.58);
        const mx = (p1x + p2x) / 2;
        const my = (p1y + p2y) / 2 + 30;
        return (
          path(`M${p1x},${p1y} L${p2x},${p2y} L${p2x},${p2y + 52} L${p1x},${p1y + 52}Z`, { s: L, w: 2.5, f: V, fo: 0.9 }) +
          line(mx, my - 13, mx, my + 13, { s: M, w: 2.5 }) +
          line(mx - 13, my, mx + 13, my, { s: M, w: 2.5 })
        );
      })(),
      // rising forms
      rising(180, 80),
      rising(300, 104),
      rising(420, 80),
      path("M80,856 Q140,840 200,856 T320,856 T440,856 T560,856", { s: B, w: 2.5, o: 0.7 }),
      path("M70,884 Q130,870 190,884 T310,884 T430,884 T550,884", { s: B, w: 2.5, o: 0.45 }),
    ];
  },

  world() {
    const leaves = [];
    const [cx, cy, rx, ry] = [300, 546, 128, 214];
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      if (Math.abs(Math.sin(t)) > 0.97) continue; // gaps for the ribbons
      const x = cx + rx * Math.cos(t);
      const y = cy + ry * Math.sin(t);
      const tx = -rx * Math.sin(t);
      const ty = ry * Math.cos(t);
      const a = (Math.atan2(ty, tx) * 180) / Math.PI;
      const side = i % 2 ? 1 : -1;
      const nx = Math.cos(t) * rx;
      const ny = Math.sin(t) * ry;
      const nl = Math.hypot(nx, ny);
      const lx = x + (nx / nl) * 8 * side;
      const ly = y + (ny / nl) * 8 * side;
      leaves.push(ellipse(lx, ly, 5, 12, { s: "none", f: i % 2 ? L : M, o: 0.9, t: `rotate(${f(a - 90 + 35 * side)} ${f(lx)} ${f(ly)})` }));
    }
    const ribbon = (y, tail) =>
      [
        ellipse(cx - 14, y, 14, 7, { s: B, w: 2.5, t: `rotate(-20 ${cx - 14} ${y})` }),
        ellipse(cx + 14, y, 14, 7, { s: B, w: 2.5, t: `rotate(20 ${cx + 14} ${y})` }),
        path(`M${cx - 4},${y + 4} q-10,${tail * 0.6} -22,${tail} M${cx + 4},${y + 4} q10,${tail * 0.6} 22,${tail}`, {
          s: B,
          w: 2.5,
        }),
        dot(cx, y, 4, M),
      ].join("");
    const badge = (x, y, inner) => g([circle(0, 0, 34, { s: SV, w: 2.5, f: V, fo: 0.6 }), inner].join(""), { transform: `translate(${x} ${y})` });
    return [
      glow(cx, cy, 200),
      ellipse(cx, cy, rx, ry, { s: L, w: 3 }),
      ...leaves,
      ribbon(cy - ry, -18),
      ribbon(cy + ry, 30),
      // inner dancing sash and star
      star(300, 452, 22, 8, 8, { s: "none", f: M }),
      path("M262,520 C330,560 250,620 330,680", { s: B, w: 3.5 }),
      path("M286,500 C340,540 280,600 340,640", { s: M, w: 2.5, o: 0.6 }),
      // four corner glyphs: star, wing, horns, lion's curl
      badge(124, 300, star(0, 0, 18, 7, 8, { s: "none", f: M })),
      badge(
        476,
        300,
        path("M-16,10 Q-10,-18 18,-16 M-12,13 Q-2,-6 18,-4 M-8,16 Q4,6 16,8", { s: M, w: 2.5 }),
      ),
      badge(124, 836, circle(0, 6, 11, { s: M, w: 2.5 }) + path("M-16,-16 Q0,6 16,-16", { s: M, w: 2.5 })),
      badge(476, 836, circle(-8, 4, 8, { s: M, w: 2.5 }) + path("M-1,0 C0,-20 22,-20 18,0 C14,14 20,20 26,12", { s: M, w: 2.5 })),
    ];
  },
};

// ---------------------------------------------------------------- cards ---
const CARDS = [
  ["00", "fool", "0"],
  ["01", "magician", "I"],
  ["02", "high-priestess", "II"],
  ["03", "empress", "III"],
  ["04", "emperor", "IV"],
  ["05", "hierophant", "V"],
  ["06", "lovers", "VI"],
  ["07", "chariot", "VII"],
  ["08", "strength", "VIII"],
  ["09", "hermit", "IX"],
  ["10", "wheel-of-fortune", "X"],
  ["11", "justice", "XI"],
  ["12", "hanged-man", "XII"],
  ["13", "death", "XIII"],
  ["14", "temperance", "XIV"],
  ["15", "devil", "XV"],
  ["16", "tower", "XVI"],
  ["17", "star", "XVII"],
  ["18", "moon", "XVIII"],
  ["19", "sun", "XIX"],
  ["20", "judgement", "XX"],
  ["21", "world", "XXI"],
];

// ------------------------------------------------------------- card back ---
/** Card back: built from a half design + its 180-degree rotation, so it is rotationally symmetric. */
function cardBack() {
  const r = rng(424242);
  const half = [];
  // star field (upper half only; mirrored by rotation)
  for (let i = 0; i < 70; i++) {
    const x = 44 + r() * 512;
    const y = 44 + r() * 452;
    if ((x - 300) ** 2 + (y - 500) ** 2 < 250 ** 2) continue;
    half.push(dot(x, y, r() < 0.12 ? 1.8 : 0.8 + r() * 0.8, r() < 0.3 ? C.blue : C.moon, f(0.35 + r() * 0.45)));
  }
  for (const [x, y, s] of [
    [120, 150, 7],
    [470, 210, 6],
    [84, 380, 5],
    [520, 420, 5],
  ])
    half.push(sparkle(x, y, s, { s: "none", f: C.lavender }));
  // moon phases on the upper arc (lit side facing the centre's right, waxing left->right)
  const angles = [-157.5, -135, -112.5, -90, -67.5, -45, -22.5];
  const seq = [
    [0.75, false, 180],
    [0.35, false, 180],
    [0, false, 180],
    null, // full moon at the top
    [0, false, 0],
    [0.35, false, 0],
    [0.75, false, 0],
  ];
  angles.forEach((a, i) => {
    const [x, y] = polar(300, 500, 212, a);
    half.push(circle(x, y, 17, { s: C.silver, w: 1.5, f: C.amethyst, fo: 0.55 }));
    const p = seq[i];
    if (p === null) half.push(circle(x, y, 17, { s: "none", f: C.moon }));
    else half.push(moonLit(x, y, 17, p[0], p[1], p[2]));
  });
  // axial ornament toward the top edge
  half.push(
    line(300, 150, 300, 260, { s: C.silver, w: 1.5, o: 0.7 }),
    star(300, 128, 22, 8, 8, { s: C.moon, w: 2, f: C.amethyst, fo: 0.6 }),
    dot(300, 128, 4, C.moon),
    moonLit(300, 196, 16, 0.5, false, -90, { s: "none", f: C.lavender }),
    path("M190,90 Q300,60 410,90", { s: C.silver, w: 1.5, o: 0.7 }),
    dot(190, 90, 2.4, C.silver),
    dot(410, 90, 2.4, C.silver),
  );
  const halfMarkup = half.join("");

  const centre = [
    circle(300, 500, 250, { s: C.silver, w: 1.2, o: 0.4, dash: "1 7", "stroke-linecap": "round" }),
    circle(300, 500, 172, { s: C.silver, w: 2.5 }),
    circle(300, 500, 160, { s: C.silver, w: 1.2, o: 0.55 }),
    circle(300, 500, 124, { s: C.lavender, w: 1.5, o: 0.6, dash: "2 8", "stroke-linecap": "round" }),
    circle(300, 500, 90, { s: C.silver, w: 2 }),
    star(300, 500, 86, 40, 8, { s: C.lavender, w: 1.5, f: C.amethyst, fo: 0.3 }),
    star(300, 500, 86, 40, 8, { s: C.lavender, w: 1.5, f: "none", o: 0.6 }, -90 + 22.5),
    circle(300, 500, 46, { s: C.moon, w: 2.5, f: C.moon, fo: 0.88 }),
    circle(300, 500, 54, { s: C.silver, w: 1.5, o: 0.7 }),
  ];
  // twelve marks on the central ring
  for (let i = 0; i < 12; i++) {
    const [x, y] = polar(300, 500, 166, i * 30);
    centre.push(dot(x, y, 3, C.silver));
  }

  const defs = `
  <radialGradient id="bgr" cx="0.5" cy="0.5" r="0.62">
    <stop offset="0" stop-color="${C.violet}"/>
    <stop offset="1" stop-color="${C.midnight}"/>
  </radialGradient>`;
  const body = [
    rect(0, 0, W, H, { s: "none", f: "url(#bgr)" }),
    g(halfMarkup),
    g(halfMarkup, { transform: "rotate(180 300 500)" }),
    ...centre,
    rect(16, 16, 568, 968, { s: C.silver, w: 3, rx: 18 }),
    rect(28, 28, 544, 944, { s: C.silver, w: 1.4, o: 0.7, rx: 10 }),
    cornerOrnament(34, 34, 1, 1),
    cornerOrnament(566, 34, -1, 1),
    cornerOrnament(34, 966, 1, -1),
    cornerOrnament(566, 966, -1, -1),
  ].join("");
  return svgDoc(body, defs);
}

// ----------------------------------------------------------------- write ---
mkdirSync(OUT_DIR, { recursive: true });
CARDS.forEach(([num, slug, numeral], i) => {
  const motif = motifs[slug];
  if (!motif) throw new Error(`Missing motif for ${slug}`);
  const svg = frame({ numeral, seed: i + 1, motif: motif() });
  writeFileSync(join(OUT_DIR, `major-${num}-${slug}.svg`), svg);
});
writeFileSync(join(OUT_DIR, "card-back.svg"), cardBack());
console.log(`Wrote ${CARDS.length + 1} SVGs to ${OUT_DIR}`);
