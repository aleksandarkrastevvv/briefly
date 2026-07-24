# Decision 0001: Use Codex As Main Builder

## Status

Accepted

## Decision

Briefly will follow Option B:

```text
Codex -> GitHub -> Hosting -> Supabase -> OpenAI API
```

Lovable remains useful as a work-in-progress visual reference, but it is not the long-term source of truth.

## Why

- Briefly needs a real backend, ingestion, AI pipeline, editorial controls, tests and release discipline.
- GitHub gives durable project memory and collaboration workflow.
- Codex can work directly on production-quality code, docs and tests.

## Consequences

- The production repo must be organised like a real software product.
- Lovable code should be imported only when useful.
- All future features should go through product, design, engineering and testing review.
