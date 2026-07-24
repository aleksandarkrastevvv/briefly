# Engineering Architecture

## Option B Architecture

```text
Codex -> GitHub -> Hosting -> Supabase -> OpenAI API
```

## Responsibilities

- Codex: builds and maintains the production app.
- GitHub: source of truth for code, docs, issues and releases.
- Hosting: public deployment for `everything-important-briefly.today`.
- Supabase: database, auth and storage.
- OpenAI API: clustering, summaries, ranking, Q&A and social generation.
- Lovable: visual reference/prototype only unless explicitly reconnected.

## Preferred Stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- server routes or backend functions
- OpenAI API with structured outputs
- scheduled ingestion jobs
- unit and end-to-end tests

## Security Rules

- Keep all secrets server-side.
- Do not expose OpenAI or Supabase service-role keys in browser code.
- Use RLS for user-owned data.
- Store AI requests and responses needed for audits.
- Fail closed when source support is insufficient.
