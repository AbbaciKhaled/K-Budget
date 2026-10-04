# K-Budget

Minimal, effortless personal budgeting. Log a transaction in under five seconds, split your money into
independent categories ("My son", "Vinted", …), tag what matters and read clear KPIs.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · MongoDB + Mongoose ·
Auth.js v5 (credentials, bcrypt) · Zod (shared client/server) · Recharts

## Getting started

Requirements: Node.js ≥ 20.9 and a MongoDB database (Atlas free tier or local).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable          | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `MONGODB_URI`     | MongoDB connection string, including the database name             |
| `AUTH_SECRET`     | Random secret for session tokens — `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` when running behind a proxy or in production                 |

### Scripts

| Command                         | What it does                                          |
| ------------------------------- | ----------------------------------------------------- |
| `npm run dev`                   | Dev server                                            |
| `npm run build` / `npm start`   | Production build / server                             |
| `npm run lint`                  | ESLint                                                |
| `npm run typecheck`             | Generates route types and runs `tsc --noEmit`         |
| `npm run seed:demo -- <user>`   | Adds ~14 months of random demo data to an existing account (dev only) |

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
  models/                       Mongoose models: User, Category, Tag, Transaction
  server/
    actions/                    server actions (mutations) — always scoped to the session user
    queries/                    read side (aggregations for summary, history, KPIs)
    session.ts, ownership.ts    current user helpers, ownership checks
  lib/                          money (cents ↔ display), dates, periods, palette, Zod schemas
  components/                   ui primitives + feature components (home, transactions, kpis…)
```

## Design notes

- **Money is stored in cents** (integers) and formatted with `Intl.NumberFormat` in the user's currency.
- **Dates** are calendar dates stored at UTC midnight and exchanged as `yyyy-mm-dd`.
- **Security:** every query filters by the logged-in `userId`; category and tag ids sent by the client are
  re-checked server-side (tags must belong to the transaction's category).
- **Quick-add** is optimistic: the transaction appears instantly, with an Undo toast.
- Tag/category colors follow a colorblind-safe categorical order so charts stay readable.
