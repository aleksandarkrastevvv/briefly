# Ingestion

## Supported Source Types

- RSS
- Atom
- XML
- HTML pages
- APIs later

## First Implementation

Prioritise RSS. Do not scrape full article content when RSS metadata is enough.

## Ingestion Skeleton

The first code layer lives in `src/lib/ingestion/rss.ts`.

It does three things only:

1. Plans eligible ingestion runs from configured source rows.
2. Parses basic RSS/Atom metadata from feed XML or configured links from HTML pages.
3. Normalizes parsed feed items into `raw_articles` insert records.

## Article Normalization

Before records are saved, ingestion normalizes:

- title and excerpt whitespace
- XML entities
- publication dates into ISO timestamps when possible
- category labels into stable lowercase identifiers
- original URLs by removing common tracking parameters
- duplicate feed items within the same run

This keeps `raw_articles` predictable enough for review, clustering, and later
AI summarization.

It does not yet:

- run on a schedule
- activate sources automatically
- scrape article bodies
- call AI models

## Eligibility Rule

A source can enter the ingestion plan in one of two ways.

For RSS, Atom, or XML:

- `active = true`
- `feed_or_page_url` is present
- `source_type` is `rss`, `atom` or `xml`
- `verification_status = verified_feed`

For HTML or official pages:

- `active = true`
- `feed_or_page_url` is present
- `source_type` is `html` or `official`
- `verification_status = configured_html_parser`
- `parser_config` limits which same-site links can be imported

This keeps blocked feeds and unconfigured pages out of automatic ingestion until
they have an intentional parser or access strategy.

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
2. Fetches each feed or configured page with a short timeout.
3. Parses, normalizes, and deduplicates candidate article links.
4. Upserts `raw_articles` by `(source_id, original_url)` or `(source_id, guid)`.
5. Writes one `ingestion_logs` row for each source run.

The request uses browser-style headers because some verified publisher endpoints,
including Capital and Dnevnik, reject generic server fetches.

## Operator Control

The app includes an `Operator` tab for manual runs.

The operator enters `INGESTION_API_TOKEN` in a password field and clicks
`Run RSS ingestion`. The token is sent only with that request and is not saved
in local storage or committed to the repository.

After articles are imported, the same tab can run `Generate daily stories`.
That calls the protected AI story endpoint for the selected market, saves
Briefly-style story drafts, and refreshes the app so Home and Brief show the
latest generated stories.

This is intended for controlled manual operation until a scheduled job is added.
In production, Vercel must have these environment variables set before the
button can work:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INGESTION_API_TOKEN`
- `OPENAI_API_KEY`

## Next Implementation Step

Tune source-specific HTML parser configs for official pages that import too few
or too many links, then add scheduling for the protected endpoint.
