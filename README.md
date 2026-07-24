# Briefly

Briefly is a mobile-first daily briefing app for important public information.

Briefly is following Option B: Codex is the main builder, GitHub is the source of truth, Supabase is the backend, and the public app will live at `https://everything-important-briefly.today`.

Start with [`docs/project-index.md`](/Users/aleksandar.krastev/Documents/New%20project/docs/project-index.md).

Phase 1 started as a static application and is now being converted into a Next.js production app on `develop`. The preserved static prototype lives in [`prototype/static-phase-1`](/Users/aleksandar.krastev/Documents/New%20project/prototype/static-phase-1). The target production architecture is documented in [`docs/engineering/architecture.md`](/Users/aleksandar.krastev/Documents/New%20project/docs/engineering/architecture.md), and the Supabase schema foundation lives in [`database/001_foundation.sql`](/Users/aleksandar.krastev/Documents/New%20project/database/001_foundation.sql).

## What Works

- Animated Briefly wordmark with reduced-motion support and first-visit persistence.
- Bulgaria and Serbia market switching.
- Market-separated seed Daily Briefs with 6 stories each.
- Home screen, brief progress, previous/next controls and mobile swipe support.
- Story cards with 16:9 images, category, headline, short description, three key points, why it matters, sources, save, share and full story expansion.
- Lightweight profile context for “what this means for me.”
- Configurable source records with unverified feeds inactive by default.
- Editorial architecture view and AI Studio draft content.
- Provider-agnostic analytics events stored locally.

## What Is Not Pretended

- No RSS feed is marked active until verified.
- No OpenAI, Supabase, auth, scheduling or publishing integration is presented as live.
- Seed stories are clearly labeled and are not real news reports.

## Open Locally

For the legacy static prototype, open [`prototype/static-phase-1/index.html`](/Users/aleksandar.krastev/Documents/New%20project/prototype/static-phase-1/index.html) in a browser.

For the Next.js app:

```bash
pnpm install
pnpm dev
```

## Validate

Use the bundled Node runtime:

```bash
/Users/aleksandar.krastev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check app.js
/Users/aleksandar.krastev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/phase1.test.cjs
```

## Decisions Needed

- Supabase project credentials and storage buckets.
- OpenAI API key, model choices and budget guardrails.
- Verified feed/page URLs for each source.
- Editorial access model.
- Analytics provider.
- Hosting provider for the production domain.
