# Supabase Setup

## Project

Project URL:

```text
https://iilkirlndpliiwuesbzr.supabase.co
```

## Local Environment

The local `.env.local` file is ignored by Git and contains:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

The publishable key can be used by browser-side Supabase code. The service role key is sensitive and must only be used server-side.

## Apply Database SQL

In Supabase:

1. Open the project.
2. Go to SQL Editor.
3. Run `database/001_foundation.sql`.
4. Run `database/002_seed_markets_sources.sql`.

## Current App Wiring

- Browser client: `src/lib/supabase.ts`
- Server/service client: `src/lib/supabase-server.ts`
- Type scaffold: `src/lib/database.types.ts`

## Next Checks

- Confirm `markets` contains `BG` and `RS`.
- Confirm `sources` contains inactive initial records.
- Confirm no source is active until verified.
- Do not paste `SUPABASE_SERVICE_ROLE_KEY` into GitHub issues or public chat.
