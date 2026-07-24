# Database

The Phase 1 schema foundation is in `database/001_foundation.sql`.

## Core Tables

- markets
- user_profiles
- interests
- user_interests
- sources
- raw_articles
- story_clusters
- story_sources
- daily_briefs
- daily_brief_stories
- saved_stories
- ai_conversations
- ai_messages
- generated_social_content
- publishing_queue
- ingestion_logs
- ranking_logs

## Rules

- Every content table must include market separation where relevant.
- Raw articles preserve original source attribution.
- Duplicates are prevented by URL and GUID where possible.
- Source records start inactive until verified.
- User-owned data requires row-level security.
