# K-Budget

Minimal, effortless personal budgeting. Log a transaction in under five seconds, split your money into
independent categories ("My son", "Vinted", …), tag what matters, share a budget with someone and read
clear KPIs. Installable as a PWA.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · MongoDB + Mongoose ·
Auth.js v5 (credentials, bcrypt) · Zod (shared client/server) · Recharts

## Features

- **Quick-add**: amount, optional description, date and tags, then one tap on Income or Expense — with Undo
- **Categories**: independent budgets, each with its own tags
- **Sharing**: share a category with another user by username or email; every transaction shows who added it
- **History**: grouped by day, filters by type, tag and date range, edit and delete
- **KPIs**: week / month / year / custom periods, % change vs the previous period, income vs expenses,
  cumulative balance, breakdown and in/out per tag, largest transactions
- **PWA**: installable on Android and iOS

## Getting started

Requirements: Node.js ≥ 20.9 and a MongoDB database (Atlas free tier or local).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable          | Description                                                                       |
| ----------------- | --------------------------------------------------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string, including the database name                            |
| `AUTH_SECRET`     | Random secret for session tokens — `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` when running behind a proxy or in production                               |

Never commit `.env.local` — it is git-ignored. Use your host's environment settings in production.

### Scripts

| Command                       | What it does                                                          |
| ----------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                 | Dev server                                                            |
| `npm run build` / `npm start` | Production build / server                                             |
| `npm run lint`                | ESLint                                                                |
| `npm run typecheck`           | Generates route types and runs `tsc --noEmit`                         |
| `npm run icons`               | Regenerates the PWA icons                                             |
| `npm run seed:demo -- <user>` | Adds ~14 months of random demo data to an existing account (dev only) |

### Deploying

Any Node.js host works (Netlify, Vercel, a VPS…). Set the three environment variables above, and allow your
host to reach your MongoDB cluster (on Atlas: _Network Access_). The app must be served over HTTPS.

## Project structure

```
src/
  app/
    (auth)/login, signup        public pages
    (app)/                      protected app: home, transactions, kpis, categories, tags, profile
    onboarding/                 first-category screen
    api/auth/[...nextauth]      Auth.js handlers
  proxy.ts                      route protection (Next 16 "proxy", formerly middleware)
  auth.ts / auth.config.ts      Auth.js (full instance / edge-safe config)
  models/                       Mongoose models: User, Category, Tag, Transaction, RateLimit
  server/
    actions/                    server actions (mutations)
    queries/                    read side (aggregations for summary, history, KPIs)
    access.ts                   access rules (owner or member of a category)
    session.ts                  current user, session revocation
    rateLimit.ts                brute-force protection
  lib/                          money (cents ↔ display), dates, periods, palette, Zod schemas
  components/                   ui primitives + feature components (home, transactions, kpis…)
```

## Design notes

- **Money is stored in cents** (integers) and formatted with `Intl.NumberFormat`; a shared category uses its
  owner's currency.
- **Dates** are calendar dates stored at UTC midnight and exchanged as `yyyy-mm-dd`.
- **Quick-add** is optimistic: the transaction appears instantly, with an Undo toast.
- Tag/category colors follow a colorblind-safe categorical order so charts stay readable.

## Security

- Every query is scoped to categories the user owns or is a member of; ids sent by the client are re-checked
  server-side. All input is validated with Zod.
- Passwords are hashed with bcrypt (cost 12). Login is rate-limited per account and per IP, sign-up per IP.
- Changing the password revokes every existing session.
- Security headers (CSP, `X-Frame-Options`, HSTS…) are set in `next.config.ts`.

Found a vulnerability? Please follow [SECURITY.md](SECURITY.md) — don't open a public issue.

## License

[GNU AGPL-3.0](LICENSE). You can use, modify and self-host K-Budget; if you run a modified version as a
service for others, you must publish your changes under the same license.
