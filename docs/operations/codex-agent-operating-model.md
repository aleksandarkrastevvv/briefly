# Codex Agent Operating Model

Briefly uses Codex agents as a virtual product team. The agents are not separate
apps yet; they are repeatable roles and checklists that guide how work moves
from idea to release.

## Agent Roster

| Agent | Owns | Use when |
| --- | --- | --- |
| Product Agent | product direction, roadmap, acceptance criteria | deciding what to build and what success means |
| Design Agent | UX, visual quality, accessibility | changing screens, cards, flows or interaction states |
| Engineering Agent | architecture, implementation, data, secrets | changing Next.js, Supabase, Vercel, ingestion or AI endpoints |
| Testing Agent | release confidence and regression checks | validating a feature before merge or production release |
| Editorial And Trust Agent | source integrity, AI grounding, public-information safety | activating sources or publishing AI-generated news output |

## Standard Issue Flow

1. Product Agent frames the issue in plain language.
2. Design Agent reviews the experience when the work affects the UI.
3. Engineering Agent implements the code, data model or configuration.
4. Editorial And Trust Agent reviews source or AI risks when the work touches news content.
5. Testing Agent validates the user flow, error states and release risk.
6. The owner merges the pull request to `main` after the preview is green.

## GitHub Issues

Each meaningful issue should include:

- primary agent
- review agents
- goal
- acceptance criteria
- files or areas likely affected
- risks
- test or validation notes

Small documentation or setup issues can use one primary agent only.

## Handoff Template

```text
Goal:
Current status:
Decisions made:
Open questions:
Files affected:
Risks:
Next action:
```

## Trust Rules

- Do not invent sources, RSS URLs, official claims or production integrations.
- Do not bypass paywalls.
- Do not expose service keys in browser code.
- AI-generated stories must be grounded in imported source articles.
- Weak source support should produce a refusal or uncertainty label, not a confident story.
- The owner can override an agent recommendation, but the decision should be recorded.

## Current Priority

The next product direction is to combine imported articles into Briefly-style
daily stories and present them in the existing calm briefing interface. Approval
workflow is intentionally deferred until the core article-to-story experience
works end to end.
