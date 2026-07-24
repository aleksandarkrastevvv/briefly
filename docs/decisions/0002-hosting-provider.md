# Decision 0002: Use Vercel For Hosting

## Status

Accepted

## Decision

Briefly will use **Vercel** as the first production hosting provider.

Production domain:

```text
https://everything-important-briefly.today
```

## Why

- Briefly is now a Next.js app.
- Vercel is the native Next.js deployment path.
- GitHub integration creates Preview deployments from non-production branches and pull requests.
- Environment variables can be scoped to Production and Preview.
- Custom domains and HTTPS are built in.
- This keeps the first production launch simpler while backend complexity lives in Supabase.

## Alternatives Considered

## Netlify

Good general hosting platform, but Vercel is a cleaner first choice for a Next.js-first product.

## Cloudflare Pages

Strong edge platform, but full Next.js support can require more compatibility decisions. It may be revisited later if Briefly needs edge-specific deployment control.

## Consequences

- `main` should become the Vercel production branch.
- `develop` and pull requests should create Preview deployments.
- Secrets must be stored in Vercel project environment variables, not committed.
- Domain DNS will be configured after the first successful Vercel deploy.
