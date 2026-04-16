# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# MyLife — Task Tracker

## Overview

Personal task tracking web app. Single user (no sharing/collaboration features).

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL via Supabase (transaction pooler, port 6543)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest
- **Error Tracking**: Sentry (`@sentry/nextjs`)
- **Hosting**: Vercel (auto-deploys from `main`)

## Architecture

- Client components (`"use client"`) + API route handlers
- No external state management — `useState` + `fetch`
- Prisma client singleton in `src/lib/prisma.ts`
- Generated Prisma client in `src/generated/prisma/` (gitignored, built via `prisma generate`)

## Database

- **Supabase project ref**: `wvscbgcidgmvlitbobtt`
- Connection URL configured via `DATABASE_URL` env var
- Schema managed via Prisma migrations in `prisma/migrations/`

## Key Patterns

- Prisma 7: connection URLs go in `prisma.config.ts`, NOT in `schema.prisma`
- Build script: `npx prisma generate && next build` (Vercel needs prisma generate before build)
- API routes at `src/app/api/` — standard REST (GET, POST, PUT, DELETE)
- Validation logic in `src/lib/types.ts`
- **Recurrence generation**: `POST /api/tasks/generate-instances` is called once on app startup (fire-and-forget from the tasks page), NOT on every GET. Recurrence logic lives in `src/lib/recurrence.ts`.
- **Pagination**: API routes support opt-in pagination via `?limit=50&page=1`. When `limit` is provided, response is `{ items, total, page, limit }`. Without `limit`, returns all results (backward compatible).
- **Dynamic imports**: Large tab components are extracted into `src/components/{feature}/` directories and loaded via `next/dynamic` to enable code splitting.
- **React.memo**: Applied to frequently-rendered components (`TaskCard`, `StatusBadge`, `PriorityBadge`) to skip unnecessary re-renders.
- **Centralized screen names**: All user-visible names live in `src/lib/screens.ts`. Import from there instead of hardcoding strings in components.
- **Reusable analysis commands**: Slash commands in `.claude/commands/` for code health checks (`/scan-unused-code`, `/scan-dead-files`, `/audit-deps`, `/detect-circular-deps`, `/safe-cleanup-plan`).

## Authentication

- **Supabase Auth** with email/password sign-in
- Browser client: `src/lib/supabase/client.ts` — Server client: `src/lib/supabase/server.ts`
- Session management: `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`, export `proxy()` not `middleware()`)
- All API routes check auth via `supabase.auth.getUser()`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Next.js 16 Breaking Changes (important!)

- `middleware.ts` → `proxy.ts`, export `proxy()` not `middleware()`
- `cookies()` and `headers()` are **async** — must `await` them
- `params` in route handlers are `Promise` — must `await` them
- Proxy uses `nodejs` runtime (NOT edge)

## Deployment Notes

- Vercel auto-deploys on push to `main`
- Vercel URL: `my-life-phi-coral.vercel.app`
- Environment variables in Vercel: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SENTRY_DSN`
- Framework Preset must be set to "Next.js" in Vercel settings

## Development Workflow (ALWAYS follow these)

1. **Before starting a new feature**: Create a GitHub issue for it if one doesn't exist
2. **After completing a feature**: Update this CLAUDE.md file — add new patterns or env vars if relevant
3. **Database changes**: Use Supabase MCP `execute_sql` tool (project ref: `wvscbgcidgmvlitbobtt`) to run DDL/migrations directly. Update Prisma schema to match.
4. **Deploying**: Merge feature branch to `main` and push to trigger Vercel auto-deploy
5. **Testing**: Run `npm test` before committing. Add tests for new validation logic or utilities
6. **Code quality**: Run `npm run check` before committing (runs format, lint, typecheck, and tests in one command)
7. **Pre-commit hooks**: Husky + lint-staged auto-runs Prettier and ESLint on staged files at commit time

## User Notes

- Single-user app — no sharing/collaboration features
- User is new to development — be explicit with instructions
- Always merge to `main` and push for Vercel to deploy
- **Active development mode**: After committing to the feature branch, always merge to `main` and push immediately (unless told otherwise). This keeps Vercel deploys flowing continuously.
- **No keyboard shortcuts**: Do NOT add global keyboard shortcuts to the app. The user does not want them.
