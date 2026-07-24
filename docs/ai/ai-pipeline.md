# AI Pipeline

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

## Grounding Rules

- Q&A can only use sources attached to the current story.
- If the answer is not supported, say there is not enough information.
- Official information must not be presented as AI guidance.
- Generated explanations are not legal, tax, medical or financial advice.

## Structured Output

Every production model call should use a strict schema and store enough request/response metadata for audit.
