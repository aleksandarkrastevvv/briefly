# Option B Rollout

## Chosen Direction

Briefly will be built as a proper engineered product:

```text
Codex -> GitHub -> Hosting -> Supabase -> OpenAI API -> everything-important-briefly.today
```

Lovable remains a work-in-progress reference. Use it for inspiration or comparison, but do not let it become the only project memory.

## Step 1: Create Or Choose The GitHub Repo

Create a repo named `briefly` or use your existing repo.

Recommended branches:

- `main`: production-ready
- `develop`: integration
- feature branches: one task at a time

Enable:

- pull requests
- branch protection on `main`
- required reviews when collaborators exist
- GitHub Projects board

## Step 2: Push This Codex Workspace

This workspace now contains:

- working Phase 1 static foundation
- Supabase schema foundation
- product/design/engineering/testing docs
- agent role files
- GitHub issue and PR templates

Push it to GitHub as the starting production workspace.

## Step 3: Import Useful Lovable Work

Do not blindly replace this repo with Lovable output.

Instead:

1. Export or sync the Lovable project to GitHub.
2. Compare its UI/components with this repo.
3. Move useful UI ideas into the production app deliberately.
4. Keep Lovable as `prototype/lovable-reference/` only if needed.

## Step 4: Choose Hosting

Chosen hosting path:

- Vercel for fastest Next.js deployment.

Your production domain:

`https://everything-important-briefly.today`

Point the domain to Vercel after the first deploy is healthy.

## Step 5: Create Supabase Project

Set up:

- PostgreSQL database
- Auth
- Storage bucket for story/social images
- RLS policies
- service role key stored only server-side

Apply `database/001_foundation.sql` after reviewing it for the chosen auth model.

## Step 6: Convert Static Phase 1 To App Framework

Target:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase client/server helpers
- test framework

Move current Phase 1 behavior into real components:

- Home
- market selector
- Daily Brief
- story card
- full story
- source management
- AI Studio

## Step 7: Build Backend In Phases

1. source management
2. RSS ingestion
3. raw article deduplication
4. clustering
5. daily ranking
6. editorial review
7. AI Q&A
8. AI Studio exports

## Step 8: Launch Discipline

Every release needs:

- accepted PR
- passing tests
- mobile and desktop UI check
- source/trust review
- release note
- no exposed secrets

## Immediate Next Actions

1. Create GitHub repo.
2. Push this workspace.
3. Create GitHub Project board with these columns:
   - Backlog
   - Ready
   - Design
   - Engineering
   - Review
   - Testing
   - Done
4. Create Supabase project.
5. Set up Vercel project.
6. Begin framework conversion.
