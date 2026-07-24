# Ingestion

## Supported Source Types

- RSS
- Atom
- XML
- HTML pages
- APIs later

## First Implementation

Prioritise RSS. Do not scrape full article content when RSS metadata is enough.

## RSS Ingestion Skeleton

The first code layer lives in `src/lib/ingestion/rss.ts`.

It does three things only:

1. Plans eligible ingestion runs from configured source rows.
2. Parses basic RSS or Atom metadata from feed XML.
3. Normalizes parsed feed items into `raw_articles` insert records.

It does not yet:

- run on a schedule
- activate sources automatically
- scrape article bodies
- call AI models

## Eligibility Rule

A source can enter the RSS ingestion plan only when:

- `active = true`
- `feed_or_page_url` is present
- `source_type` is `rss`, `atom` or `xml`
- `verification_status = verified_feed`

This keeps official page candidates and blocked feeds out of automatic ingestion
until a parser or access strategy is reviewed.

## Source Record Fields

- market
- source name
- website URL
- feed or page URL
- source type
- language
- category
- active status
- parser configuration
- last checked
- last successful import
- last error

## Safety Rules

- Do not bypass paywalls.
- Do not invent RSS URLs.
- Keep inactive sources inactive until verified.
- Log every ingestion run.
- Preserve source attribution.

## Protected Manual Endpoint

The protected manual route is:

```text
POST /api/ingestion/rss
Authorization: Bearer <INGESTION_API_TOKEN>
```

Required production environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INGESTION_API_TOKEN`

The route:

1. Loads eligible sources from Supabase.
2. Fetches each feed with a short timeout.
3. Parses feed items.
4. Upserts `raw_articles` by `(source_id, original_url)` or `(source_id, guid)`.
5. Writes one `ingestion_logs` row for each source run.

## Next Implementation Step

Add a small operator UI or scheduled job that can call the protected endpoint
without exposing secrets to readers.
