# Vercel Setup

## Project

Hosting provider:

```text
Vercel
```

GitHub repo:

```text
aleksandarkrastevvv/briefly
```

Production branch:

```text
main
```

Preview branch:

```text
develop
```

Production domain:

```text
everything-important-briefly.today
```

## Create The Vercel Project

1. Go to `https://vercel.com`.
2. Sign in with GitHub.
3. Click `Add New...`.
4. Click `Project`.
5. Import `aleksandarkrastevvv/briefly`.
6. Framework preset should be `Next.js`.
7. Build command should be:

```text
pnpm build
```

8. Install command should be:

```text
pnpm install
```

9. Output directory should stay empty/default for Next.js.

## Environment Variables

Add these in Vercel Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

Use the Supabase publishable key for:

```text
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Keep these private:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

## Deployment Flow

- Push to `develop`: Preview deployment.
- Pull request from `develop` to `main`: Preview deployment and review.
- Merge to `main`: Production deployment.

## Domain Setup

After the first production deploy works:

1. Open Vercel project.
2. Go to `Settings`.
3. Go to `Domains`.
4. Add:

```text
everything-important-briefly.today
```

5. Follow the DNS instructions Vercel shows.
6. Add `www.everything-important-briefly.today` if you want the `www` version too.

## Validation

Before connecting the domain, confirm:

- Vercel build succeeds.
- Preview URL loads.
- Production URL loads.
- No service role key appears in browser code.
- Supabase tables exist.
