# Test Plan

## Test Types

- unit tests for data rules and helpers
- integration tests for ingestion and deduplication
- end-to-end tests for Daily Brief flow
- accessibility checks for keyboard and contrast
- visual checks for mobile and desktop
- AI output contract tests

## Phase 1 Tests

Current local checks:

```bash
/Users/aleksandar.krastev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check app.js
/Users/aleksandar.krastev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/phase1.test.js
```

## Release Gate

A release is not ready until:

- tests pass
- sources are verified
- UI is checked on mobile and desktop
- AI refusal behavior works
- no secrets are exposed
- release notes are written
