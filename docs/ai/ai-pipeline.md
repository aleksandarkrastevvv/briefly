# AI Pipeline

## Current Milestone

Move from imported articles to Briefly-style story drafts that can power the
current reader experience. Formal approval workflow is deferred until the
article-to-story experience works end to end.

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
8. Show generated drafts in the existing Home, Brief and AI Studio experience.

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

Generated stories can appear in the current Briefly experience as source-grounded
drafts. The app keeps confidence and editorial status visible while approval
workflow is deferred.

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
- `daily_briefs` and `daily_brief_stories` are used later when scheduled daily
  editions and approval workflow are introduced.

## Protected Manual Endpoint

The first protected story generation route is:

```text
POST /api/ai/stories
Authorization: Bearer <INGESTION_API_TOKEN>
```

Optional JSON body:

```json
{ "marketCode": "BG" }
```

The endpoint:

1. Loads recent eligible `raw_articles` for the market.
2. Builds a grounded story-generation prompt.
3. Calls OpenAI through the Responses API.
4. Validates the structured response.
5. Saves generated stories to `story_clusters` with `editorial_status = draft`.
6. Links each draft to source articles through `story_sources`.
7. Returns generated draft counts.

## Reader Display

The homepage data loader reads recent `story_clusters`, attaches source names
through `story_sources`, and adapts them into the same story shape used by the
Briefly reader. When generated stories exist for the selected market, Home,
Brief and AI Studio use them instead of seed demo stories. When no generated
stories exist, the seed stories remain as a safe fallback.

Required environment variables:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INGESTION_API_TOKEN`

Optional environment variable:

- `STORY_GENERATION_MODEL`

Default model:

- `gpt-5-mini`

## Next Implementation Step

Add daily ranking and scheduling so Briefly can select the best 5 to 8 generated
stories per market automatically.
