# Briefly Architecture

## Target Stack

- Next.js, TypeScript, React and Tailwind CSS for the product app.
- Supabase PostgreSQL for relational data, Supabase Auth for accounts and Supabase Storage for approved media.
- Server routes or backend functions for ingestion, clustering, ranking, Q&A and social-content generation.
- OpenAI API calls stay server-side and use structured outputs with strict schemas.
- Scheduled jobs ingest configured feeds, write logs and never bypass paywalls.

## Phase 1 Local Build

This workspace currently ships as a dependency-free static app:

- `index.html` defines the mobile-first Briefly shell.
- `data.js` stores market config, seed briefs, source records and setup decisions.
- `app.js` handles market switching, progress, saved stories, profile context, source additions, analytics events and AI Studio draft output.
- `styles.css` contains the design tokens, responsive layout and animated wordmark.
- `database/001_foundation.sql` defines the Supabase/PostgreSQL foundation.

The sample daily briefs are explicit seed data. They are not live news and do not represent verified reporting.

## Market Model

Markets are configuration records. Stories, sources, briefs, generated social content and ranking logs carry `market_code`, keeping Bulgaria and Serbia separated while sharing application code.

Initial markets:

- Bulgaria: `BG`, `bg-BG`, Bulgarian, `Europe/Sofia`.
- Serbia: `RS`, `sr-RS`, Serbian Latin, `Europe/Belgrade`.

## External Inputs Needed

- Supabase project credentials and storage bucket decisions.
- OpenAI API key, model choices and spending limits.
- Verified RSS or official page URLs for every source before activation.
- Editorial access rules for protected workspace routes.
- Analytics provider, or approval to continue with a provider-agnostic event layer.

## Phase Plan

1. Phase 1: foundation, market config, schema, shell, Home, market switcher, seed Daily Brief and animated logo.
2. Phase 2: full story UX, save/share depth, source citations and responsive finishing.
3. Phase 3: source dashboard, RSS ingestion, deduplication and logs.
4. Phase 4: clustering, summaries, ranking and editorial review.
5. Phase 5: profile setup, interests and personal relevance.
6. Phase 6: grounded Q&A with citations and feedback.
7. Phase 7: social asset generation and publishing queue.
8. Phase 8: Serbian source verification, Serbian outputs and QA.
