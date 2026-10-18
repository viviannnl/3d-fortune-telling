@AGENTS.md

# 3d fortune telling — project guide

Desktop-first, immersive 3D fortune-telling experience: tarot readings, Chinese Bazi (八字) and Five Elements (五行) exploration, and AI-generated symbolic interpretations, set inside an atmospheric celestial world. It is an interactive experience, **not** a SaaS dashboard with a decorative 3D background.

Working display name: **Moonlit Sanctuary · 月影圣所** (change in `src/lib/i18n/dictionaries.ts` and `src/app/layout.tsx` metadata).

## Toolchain

- Node **22** pinned per-project via `mise.toml` (the global default stays untouched). Run commands through mise: `mise exec -- npm run dev`, or activate mise in your shell.
- Next.js 16 (App Router, Turbopack, `cacheComponents` on), React 19.3, TypeScript strict, Tailwind CSS v4 (CSS-first config in `src/app/globals.css`).
- 3D: three, @react-three/fiber 9, @react-three/drei 10. **R3F 9 peers on `react <19.4`** — React is pinned `~19.3.0`; don't bump React without checking R3F's peer range.
- State: zustand (works outside React — use `getState()` inside `useFrame`, never subscribe to per-frame values).
- Tests: Vitest (unit, `tests/unit`), Playwright + Chromium (E2E/visual, `tests/e2e`). Playwright launches Chromium with SwiftShader for software WebGL.
- AI: **Anthropic API** via `@anthropic-ai/sdk`, server-side only (`src/server/`, guarded by `server-only`). Model `claude-opus-5-5`, adaptive thinking (default), `effort: "medium"`, structured output via `betaZodOutputFormat`, server-side refusal `fallbacks: "default"`. Config in `.env.local` (see `.env.example`): `ANTHROPIC_API_KEY`, optional `INTERPRETATION_MODEL`, `INTERPRETATION_PROVIDER=mock` (deterministic offline provider; used by E2E).
- Bazi: `tyme4ts` (MIT). Solar terms verified against the Hong Kong Observatory table (`tests/fixtures/hko-solar-terms.json`).
- Dev/start bind to `127.0.0.1` (not the LAN).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright; builds and serves prod on port 3100 with the mock AI provider |
| `npm run format` | Prettier |
| `node scripts/qa/{shoot,tarot-flow,destiny-flow}.mjs <url> <outDir>` | Screenshot walkthroughs for visual review |
| `node scripts/cards/generate-card-art.mjs` | Regenerates the original card SVGs in `public/cards/` |
| `npm run check` | lint + typecheck + unit + build |

## Architecture

```
src/
  app/                 Routes, root layout, fonts, global tokens (globals.css)
  components/
    world/             3D presentation only (R3F). WorldStage = loader/fallback host,
                       WorldCanvas = owns the WebGL context, WorldScene = scene graph.
    ui/                HTML overlay UI (shell, controls). Accessible, readable text lives here.
    tarot/             3D cards/spread + HTML controls and reading panel.
    destiny/           Form, chart panel, explanations, armillary + Five Elements 3D.
    share/             Canvas 2D share-card renderer and dialog.
  features/            Pure domain logic — no React, no three.js imports.
    tarot/             Deck data, seeded/crypto RNG, shuffle, reading state machine.
    destiny/           Bazi engine (engine.ts), time zones, conventions, validation, reference notes, visual mapping.
    interpretation/    Request/response Zod schemas, prompt builders, output validation.
    share/             Share-card content (privacy-filtered).
  server/              Server-only: AI providers, request handler, rate limiter, route factory.
  app/api/interpret/   POST route handlers (tarot, destiny).
  lib/                 Cross-cutting utilities: i18n, palette, audio engine, WebGL detection, hooks.
  stores/              zustand stores: experience (view/hover/dim/camera), tarot, destiny, interpretations, preferences.
tests/
  unit/                Vitest — domain logic and pure utilities.
  e2e/                 Playwright — real browser flows, console-error checks, screenshots.
```

Rules:
- **Dependency direction:** `components → stores/features/lib`; `features` never imports React, three, or components. `components/world` never contains domain rules.
- **3D in WebGL, text in HTML.** Essential paragraphs, forms, and readings are HTML over the canvas; never render long text inside the scene.
- **No per-frame React state.** Continuous animation uses `useFrame` + refs. React state changes only on discrete events (hover enter/leave, click, phase change).
- **Client-only WebGL.** `WorldCanvas` is loaded via `next/dynamic({ ssr: false })` from a client component. Detect WebGL first; wrap the canvas in `WorldErrorBoundary`; show `SkyFallback` while loading and when unavailable.
- **Dispose what you create.** Manually created textures/geometries/materials must be disposed in effect cleanup (R3F disposes JSX-declared ones automatically).
- **Secrets stay on the server.** Route handlers only; never `NEXT_PUBLIC_` for keys. Do not log birth data.
- **Validate untrusted input** (forms, API bodies, AI output) with Zod (install when first needed).
- **Don't add libraries** without a clear need. GSAP only for genuinely complex sequenced transitions.

- **Next 16 Activity:** inactive routes are hidden, not unmounted. `useRouteActivation()` gates the WebGL canvas so a hidden route releases its context. R3F's own `forceContextLoss` on unmount must not be treated as a runtime context loss (see `WorldCanvas`).
- **Bazi convention** is documented once in `src/features/destiny/conventions.ts` (sent to the AI) and mirrored in localized copy on `/about#bazi`; keep them in sync. Never let an LLM derive pillars.
- **AI requests**: the server recomputes charts and looks up card meanings itself; clients send only ids/birth input. Responses echo a `subject` that the client checks against the screen. Never log request bodies.

## Internationalization

Bilingual English / Simplified Chinese with a toggle.
- Copy lives in `src/lib/i18n/dictionaries.ts`. `zh` is typed as `Dictionary` (= shape of `en`), so missing keys fail typecheck; a unit test also rejects empty strings.
- Locale state: `usePreferences` (zustand, persisted to localStorage, `skipHydration`). `PreferencesBootstrap` rehydrates after mount, falls back to `navigator.languages`, and syncs `<html lang>`.
- Server render is always English, then switches client-side — a brief flash for zh users is a known trade-off to keep the page static and avoid remounting the canvas on language change.
- Use `useDictionary()` in components. Never hard-code user-facing strings.
- Domain terms (天干地支, 五行, card names) need curated translations, not machine output.

## Design system — Dreamy Celestial Fantasy (mandatory)

Palette (tokens in `globals.css`; mirrored for WebGL in `src/lib/palette.ts` — keep in sync):

| Token | Hex | Use |
|---|---|---|
| midnight | #17152F | Base surface, scene background |
| deep-violet | #302448 | Raised surfaces, selected states |
| amethyst | #55427C | Decorative only (2.1:1 — never text) |
| lavender | #BCA6F5 | Accent (8.4:1 on midnight) |
| moonlight | #E7DDFB | Primary text (13.6:1) |
| pale-blue | #C5DDF8 | Focus ring, restrained cool accents |
| text-muted | #A497C4 | Secondary text (6.6:1 midnight, 5.3:1 deep-violet) |
| border | #7A68A6 | UI boundaries (3.7:1) |

- Environment: enormous luminous moon (the focal point), distant stars, floating crystals, reflective water, celestial dust, subtle nebulae.
- Materials: translucent amethyst, frosted glass, pearlescent surfaces, silver linework, tactile cards. Destiny Palace adds jade, muted gold, and astronomical geometry — not festival red-and-gold.
- Lighting: soft moonlight, gentle bloom, atmospheric depth, controlled highlights.
- Typography: Cormorant Garamond / Noto Serif SC (`font-serif`) for titles; Inter / Noto Sans SC (`font-sans`) for controls and body.
- Motion: slow environmental movement, smooth camera, elegant flips, subtle hover. UI durations 150 / 250 / 400 ms (`--duration-*`); animate transform/opacity only; ease-out on entrances.
- Layout: full-screen canvas, minimal floating HTML. Frosted `bg-panel` + `backdrop-blur` only on small control surfaces.
- **No literal colors in components** — use Tailwind token utilities (`text-text-muted`, `bg-panel`…) or `var(--token)`; WebGL uses `PALETTE`.
- **Avoid:** neon cyberpunk, glow-everything, particle overload, lens flares, dashboard look, many floating panels, distracting random animation, emoji as assets, long text in canvas, fake functionality (screenshots, decorative buttons, prerecorded animation).
- **Reduced motion:** CSS durations collapse globally; 3D code reads `useReducedMotion()` and stops nonessential motion.
- Every interactive control needs rest / hover / active / focus-visible / disabled (+ selected/loading where relevant).

## Content and ethics

Readings are symbolic exploration and entertainment, not predictions. No deterministic claims about relationships, others' feelings, death, illness, or finances. Tarot and Bazi are distinct systems — never imply one validates the other. Bazi pillars come from a documented calculation engine, never from an LLM. Tarot artwork must be original, licensed, or public-domain.

## Engineering workflow (every phase)

1. Inspect repo, `git diff`, relevant source, scripts, tests; read this file.
2. Write a short plan, risks, and how each requirement will be verified.
3. Implement incrementally, scoped to the phase. No `any`, no silenced errors, no weakened tests, no placeholders for required functionality.
4. Self-review: read the diff (complexity, dead code, unsafe types, cleanup, lifecycle, re-render loops, a11y, error handling).
5. Run `npm run check` and `npm run test:e2e`; add tests for new logic. Never claim a check passed unless it ran.
6. Runtime-verify in a browser (Playwright screenshots + console/network errors). For 3D: rendering, camera, interaction, cleanup.
7. Report: features, acceptance checklist (PASS / FAIL / BLOCKED with evidence), commands and real outcomes, known issues, files changed, manual tests remaining, readiness.
8. **Stop after each phase and wait for approval.** Do not start the next phase automatically.

## Phase boundaries

| Phase | Scope | Out of scope |
|---|---|---|
| 0–6 | All phases implemented (2026-10-17). See git history / final report for status. | |
| 0 | Foundation: toolchain, tokens, shell, i18n, WebGL host + fallback, tests | Full scene |
| 1 | 3D sanctuary: moon, stars, crystals, islands, water, Tarot Garden + Destiny Palace destinations, parallax camera, hover/click, sound toggle (no autoplay) | Tarot/Bazi logic, AI, auth, DB |
| 2 | Tarot: typed deck data, unique draw w/ orientation, 3-card spread, flip/reveal, interpretation panel, restart | AI |
| 3 | Destiny: birth form + validation, documented Bazi engine + reference tests, armillary/Five Elements visualization | AI-derived pillars |
| 4 | AI interpretations (Anthropic, server-side, schema-validated, timeouts, error/retry) | Recalculating charts in the model |
| 5 | Polish: audio opt-in, transitions, share card + image export (no private birth data), responsive, reduced motion, fallbacks | Accounts, payments, multiplayer, cloud history |
| 6 | QA and launch readiness only — no new features | Public deploys or paid services without authorization |
