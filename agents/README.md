# Briefly AI Agents

Use these role files when assigning work to separate AI agents in Codex,
ChatGPT or future Workspace Agents.

## Operating Model

Briefly uses agents as a virtual product team. Each GitHub issue should identify
one primary agent and any reviewing agents before implementation starts.

The agents are not separate products. They are specialized thinking modes for
one Briefly project.

## Agents

- `product-agent.md`: scope, user value, roadmap and acceptance criteria
- `design-agent.md`: UX, visual system, accessibility and interaction quality
- `engineering-agent.md`: implementation, architecture, data contracts and secrets
- `testing-agent.md`: validation plan, regression checks and release confidence
- `editorial-trust-agent.md`: sources, AI grounding, public-information safety

## Core Product Rules

- Briefly is mobile-first.
- Home is a daily briefing, not an endless feed.
- Public Brief stories should have at least two supporting sources.
- Stories with more supporting sources should appear before weaker stories.
- Briefly summarizes and explains; it does not copy full articles.
- Source links, attribution and uncertainty are part of the product.
- Particle is a benchmark for AI news reading, not a template to copy.

## When To Use Each Agent

| Work type | Primary agent | Review agents |
| --- | --- | --- |
| New user-facing feature | Product | Design, Engineering, Testing |
| UI or interaction change | Design | Product, Testing |
| Database, API, ingestion or AI route | Engineering | Testing, Editorial/Trust |
| Source activation or verification | Editorial/Trust | Engineering, Testing |
| AI-generated public content | Editorial/Trust | Product, Engineering, Testing |
| Competitive benchmark | Product | Design, Editorial/Trust |
| Copyright or source terms review | Editorial/Trust | Product |
| Release readiness | Testing | Engineering |

## Definition Of Done

Before an issue moves to Done:

- Product intent is clear.
- User-facing behavior is described.
- Engineering changes are implemented or explicitly not needed.
- Safety/trust impact is checked for news, official information and AI output.
- Tests or validation checks have passed.
- GitHub PR is merged to `main`.
- Vercel deployment is ready when production behavior changed.

## How To Start An Agent Task

Use this prompt shape:

```text
Act as the Briefly [Agent Name].
Goal:
Context:
What I need:
Output format:
```

## Shared Handoff Format

```text
Goal:
Current status:
Decisions made:
Open questions:
Files affected:
Risks:
Next action:
```

## Rule

No agent may invent sources, RSS URLs, official claims, API behavior or production integrations.

No agent may treat a public RSS feed as unlimited permission to reuse full
publisher content. Use metadata, links and Briefly-written summaries unless a
specific license says otherwise.

## Human Override

The project owner can override agent recommendations. When that happens, record
the decision in the issue or relevant doc so future work follows the chosen
direction.
