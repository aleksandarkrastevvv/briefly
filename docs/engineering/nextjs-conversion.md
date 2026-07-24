# Next.js Conversion

## Status

In progress on `develop`.

## What Changed

- Added a Next.js, TypeScript and React project scaffold.
- Preserved the static Phase 1 prototype in `prototype/static-phase-1/`.
- Moved seed data into `src/lib/seed-data.ts`.
- Added app helpers in `src/lib/briefly.ts`.
- Rebuilt the Briefly UI as `src/app/page.tsx`.
- Moved visual assets to `public/assets/`.
- Added Supabase client placeholder in `src/lib/supabase.ts`.

## Environment Variables

Copy `.env.example` to `.env.local` later and fill values after the Supabase project exists.

Do not commit real secrets.

## Next Steps

- Install dependencies.
- Run typecheck and build.
- Connect Supabase after the project exists.
- Replace seed data with database-backed records phase by phase.
