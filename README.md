# Moonlit Sanctuary · 月影圣所

An immersive 3D sanctuary for tarot readings and Chinese Bazi (八字) exploration. Built with Next.js, React Three Fiber, and Tailwind CSS.

## Getting started

Requires Node 22, which is pinned for this directory in `mise.toml`.

```bash
mise install            # once, if Node 22 isn't installed
mise exec -- npm install
mise exec -- npm run dev
```

Open http://127.0.0.1:3000 (the dev server listens on localhost only).

## AI reflections (optional)

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Without a key, readings still work with curated meanings and the reflection panel says AI isn't configured. `INTERPRETATION_PROVIDER=mock` gives deterministic placeholder text for local development.

## Checks

```bash
mise exec -- npm run check      # lint, typecheck, unit tests, production build
mise exec -- npx playwright install chromium   # once
mise exec -- npm run test:e2e   # browser tests against a production build
```

See [CLAUDE.md](./CLAUDE.md) for architecture, the design system, and phase boundaries.
