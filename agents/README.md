# Briefly AI Agents

Use these role files when assigning work to separate AI agents.

## Operating Model

Briefly uses agents as a virtual product team. Each issue should identify a
primary agent and any reviewing agents before implementation starts.

## Agents

- `product-agent.md`: scope, user value, roadmap and acceptance criteria
- `design-agent.md`: UX, visual system, accessibility and interaction quality
- `engineering-agent.md`: implementation, architecture, data contracts and secrets
- `testing-agent.md`: validation plan, regression checks and release confidence
- `editorial-trust-agent.md`: sources, AI grounding, public-information safety

## When To Use Each Agent

| Work type | Primary agent | Review agents |
| --- | --- | --- |
| New user-facing feature | Product | Design, Engineering, Testing |
| UI or interaction change | Design | Product, Testing |
| Database, API, ingestion or AI route | Engineering | Testing, Editorial/Trust |
| Source activation or verification | Editorial/Trust | Engineering, Testing |
| AI-generated public content | Editorial/Trust | Product, Engineering, Testing |
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

## Human Override

The project owner can override agent recommendations. When that happens, record
the decision in the issue or relevant doc so future work follows the chosen
direction.
