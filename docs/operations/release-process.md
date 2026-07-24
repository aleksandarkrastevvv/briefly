# Release Process

## Branches

- `main`: production-ready code
- `develop`: integration branch
- feature branches: one feature or fix at a time

## Pull Request Checklist

- Product acceptance criteria met
- Design reviewed
- Engineering reviewed
- Tests pass
- Trust review completed when relevant
- Screenshots or notes added
- Release note written

## Deployment

The target production domain is:

`https://everything-important-briefly.today`

Deployment should come from GitHub through Vercel. Lovable remains a reference unless the team decides to keep it in the deployment chain.

## Vercel Branch Flow

- `develop`: preview deployments
- pull requests: preview deployments
- `main`: production deployments
