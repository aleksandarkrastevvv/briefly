# AI Pipeline

## Current Milestone

Move from imported articles to reviewable Briefly story drafts. This milestone
plans the AI layer only; it does not publish generated stories automatically.

## AI Jobs

- cluster raw articles into story clusters
- generate concise summaries
- extract three key facts
- explain why it matters
- explain what happens next
- rank daily importance
- answer story questions from sources
- generate social-native content

## Model Boundary

Do not score every raw article separately with AI. Rank completed story clusters once per market using compact metadata.

## Story Generation Flow

1. Select recent normalized `raw_articles` for one market.
2. Exclude articles without a title or source URL.
3. Send compact article metadata to the model.
4. Ask the model to cluster related articles into story drafts.
5. Require structured output that matches `storyGenerationOutputSchema`.
6. Store drafts in `story_clusters` with `editorial_status = draft`.
7. Attach source article ids through `story_sources`.
8. Show generated drafts in an editorial review view before publishing.

## Candidate Selection

The first implementation should use a conservative window:

- one market at a time
- latest 80 eligible raw articles
- articles with title and original URL only
- direct source attribution preserved
- no full-page scraping

Candidate selection lives in `src/lib/ai/story-generation.ts`.

## Structured Story Draft

Each generated story draft must include:

- canonical headline
- short summary
- exactly three key points
- why it matters
- what happens next, or `null`
- affected audiences
- category
- confidence status
- source article ids

The first allowed confidence statuses are:

- `needs_review`
- `insufficient_support`

Generated stories are never published directly. They must be reviewed first.

## Grounding Rules

- Q&A can only use sources attached to the current story.
- If the answer is not supported, say there is not enough information.
- Official information must not be presented as AI guidance.
- Generated explanations are not legal, tax, medical or financial advice.
- Story generation can only use supplied imported articles.
- Every generated story must preserve source article ids.
- Weak or conflicting support must be marked `insufficient_support`.

## Structured Output

Every production model call should use a strict schema and store enough request/response metadata for audit.

## Storage Plan

Generated drafts map to existing tables:

- `story_clusters` stores the generated story draft.
- `story_sources` links each story to its source `raw_articles`.
- `ranking_logs` can store later daily ranking request/response metadata.
- `daily_briefs` and `daily_brief_stories` are used only after editorial approval.

## First Implementation Step

Add a protected manual endpoint that:

1. Loads story generation candidates for one market.
2. Calls OpenAI with the strict story schema.
3. Saves draft story clusters and source links.
4. Returns generated draft counts and any validation errors.

Required environment variable:

- `OPENAI_API_KEY`
