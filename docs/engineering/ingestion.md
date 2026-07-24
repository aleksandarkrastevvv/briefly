# Ingestion

## Supported Source Types

- RSS
- Atom
- XML
- HTML pages
- APIs later

## First Implementation

Prioritise RSS. Do not scrape full article content when RSS metadata is enough.

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
