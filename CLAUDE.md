@AGENTS.md

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
- **Region**: us-west-2
- Connection URL configured via `DATABASE_URL` env var
- Schema managed via Prisma migrations in `prisma/migrations/`
- Tables created directly via Supabase SQL Editor (initial setup)

## Key Patterns

- Prisma 7: connection URLs go in `prisma.config.ts`, NOT in `schema.prisma`
- Build script: `npx prisma generate && next build` (Vercel needs prisma generate before build)
- API routes at `src/app/api/tasks/` (GET, POST) and `src/app/api/tasks/[id]/` (GET, PUT, DELETE)
- Validation logic in `src/lib/types.ts`

## File Structure

```
prisma/schema.prisma          # Data model
prisma/seed.ts                 # Database seed script
prisma.config.ts               # Prisma connection config
next.config.ts                 # Next.js config (Sentry integration)
sentry.client.config.ts        # Sentry client-side config
sentry.server.config.ts        # Sentry server-side config
sentry.edge.config.ts          # Sentry edge runtime config
vitest.config.ts               # Vitest test config
src/
  test/setup.ts                # Vitest test setup
  test/api-helpers.ts          # Shared mocks (Supabase auth, Prisma, request builder)
  lib/prisma.ts                # Prisma client singleton
  lib/types.ts                 # Validation + shared types
  lib/elo.ts                   # Elo rating algorithm for pairwise ranking
  app/
    page.tsx                   # Home (view switcher via ?view= param)
    layout.tsx                 # Root layout (sidebar for authed, plain for login)
    api/tasks/route.ts         # GET + POST tasks
    api/tasks/[id]/route.ts    # GET + PUT + DELETE single task (auto-creates next for recurring)
    api/tasks/[id]/subtasks/route.ts # POST + PUT + DELETE subtasks
    api/tasks/[id]/dependencies/route.ts # GET + POST + DELETE task dependencies
    api/export/route.ts            # GET data export (CSV/JSON for tasks, journal, metrics)
    api/categories/route.ts    # GET + POST categories
    api/categories/[id]/route.ts # PUT + DELETE single category
    api/rankings/categories/route.ts     # GET + POST ranking categories
    api/rankings/categories/[id]/route.ts # GET + PUT + DELETE ranking category
    api/rankings/items/route.ts          # POST ranking items
    api/rankings/items/[id]/route.ts     # PUT + DELETE ranking items
    api/rankings/compare/route.ts        # GET next pair + POST comparison result
    api/foods/search/route.ts          # GET search USDA FoodData Central
    api/foods/route.ts                 # GET + POST saved foods
    api/foods/[id]/route.ts            # DELETE saved food
    api/medications/search/route.ts    # GET search OpenFDA drug labels
    api/medications/route.ts           # GET + POST saved medications
    api/medications/[id]/route.ts      # DELETE saved medication
    api/nutrition/route.ts             # GET nutrition logs (by date range)
    api/diagrams/route.ts              # GET + POST diagrams
    api/diagrams/[id]/route.ts         # GET + PUT + DELETE single diagram
    api/body-metrics/route.ts          # GET + POST body metrics
    api/body-metrics/[id]/route.ts     # DELETE body metric
    api/journal/route.ts               # GET + POST journal entries
    api/journal/[id]/route.ts          # GET + PUT + DELETE single journal entry
    api/gym/exercises/route.ts         # GET + POST exercises
    api/gym/routines/route.ts          # GET + POST workout routines
    api/gym/routines/[id]/route.ts     # GET + DELETE single routine
    api/gym/logs/route.ts              # GET + POST workout logs
    api/gym/logs/[id]/route.ts         # DELETE single workout log
    api/charges/route.ts               # GET + POST recurring charges
    api/charges/[id]/route.ts          # GET + PUT + DELETE single charge
    api/charges/[id]/occurrences/route.ts # GET + PUT charge occurrences
    api/settings/app/route.ts  # GET + PUT app-wide settings
    api/settings/user/route.ts # GET + PUT user preferences
    journal/page.tsx           # Journal (write, entries list, calendar view)
    rankings/page.tsx          # Pairwise ranking system (categories, items, compare, rankings, stats)
    diet/page.tsx              # Diet & nutrition (food library, nutrition log, body metrics)
    gym/page.tsx               # Gym (exercises, routines, log workout, history)
    finances/page.tsx          # Finances (recurring charges, bills, payment history)
    tasks/new/page.tsx         # Create task page
    tasks/[id]/edit/page.tsx   # Edit task page
    diagrams/page.tsx          # Diagram creator (flowcharts, process, swim lane, ER)
    auth/reset-password/page.tsx # Password reset page
    admin/page.tsx             # Admin settings (categories, defaults, stats)
    settings/page.tsx          # User settings (theme, account, notifications)
  components/
    Sidebar.tsx                # Left navigation sidebar (Notion-style)
    ThemeProvider.tsx           # Dark mode context + class toggle
    KeyboardShortcuts.tsx      # Global keyboard shortcuts (N, 1-5, /)
    QuickAddModal.tsx          # Quick task creation modal
    SubtaskList.tsx            # Subtask checklist with progress bar
    TaskCard.tsx               # Task card display + getDueStatus helper + types
    TaskForm.tsx               # Shared create/edit form (incl. recurrence)
    TaskList.tsx               # Legacy task list (kept for reference)
    StatusBadge.tsx            # Status pill
    PriorityBadge.tsx          # Priority pill
    DeleteConfirmDialog.tsx    # Delete confirmation modal
    TaskNotifications.tsx      # Browser notifications for overdue/due-today tasks
    diagrams/
      DiagramNodes.tsx         # Custom React Flow node types (process, decision, etc.)
    SignOutButton.tsx           # Sign-out button (used by Sidebar)
    views/
      ListView.tsx             # Table/list view with sortable columns
      CalendarView.tsx         # Monthly calendar with tasks on due dates
      TimelineView.tsx         # Horizontal timeline/Gantt view
      DashboardView.tsx        # Summary stats, charts, and breakdowns
      FocusView.tsx            # Overdue + due-today/soon focus mode
```

## Navigation

- Left sidebar (Notion-style) with view switcher and manage links
- Views selected via `?view=` query param: `list`, `calendar`, `timeline`, `dashboard`, `focus`
- Default view: `list`
- Sidebar only shown for authenticated users; login page gets plain layout
- Search bar + status/priority filter pills on home page (apply across all views)

## Dark Mode

- Class-based dark mode via Tailwind v4 `@variant dark`
- ThemeProvider manages `dark` class on `<html>`, persists to localStorage
- Settings page has light/dark/system toggle
- All components have `dark:` classes

## Keyboard Shortcuts

- `N` — Open quick-add modal
- `1`–`5` — Switch views (list/calendar/timeline/dashboard/focus)
- `/` — Focus search bar
- `Escape` — Close quick-add modal
- Shortcuts disabled when typing in inputs

## Recurring Tasks

- Tasks can have recurrence: NONE, DAILY, WEEKLY, MONTHLY
- When a recurring task is marked DONE, the API auto-creates the next occurrence with an updated due date
- Recurrence indicator shown as purple badge in list view

## Recurring Charges / Bills

- Template + occurrence model: `RecurringCharge` (template) spawns `ChargeOccurrence` (per billing cycle)
- Frequencies: WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
- Categories: SUBSCRIPTION, UTILITY, INSURANCE, RENT, DEBT, OTHER
- Occurrence statuses: UPCOMING, DUE, PAID, LATE, SKIPPED
- Occurrences auto-generated 60 days ahead on charge creation
- Template updates regenerate unpaid future occurrences; paid history preserved
- Deactivating a charge removes unpaid future occurrences but keeps history
- Variable-amount charges pre-fill from template but allow per-occurrence editing
- Finances page at `/finances` with tabs: Overview, Manage Charges, Payment History

## Authentication

- **Supabase Auth** with email/password sign-in
- Packages: `@supabase/supabase-js`, `@supabase/ssr`
- Browser client: `src/lib/supabase/client.ts` (uses `createBrowserClient`)
- Server client: `src/lib/supabase/server.ts` (uses `createServerClient`, async `cookies()`)
- Session management: `src/proxy.ts` (Next.js 16 renamed middleware to proxy)
- Login page: `src/app/login/page.tsx`
- Auth callback: `src/app/auth/callback/route.ts`
- Password reset: `src/app/auth/reset-password/page.tsx`
- Sign-out button: `src/components/SignOutButton.tsx`
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
- Database tables were created via Supabase SQL Editor (not Prisma migrate)
- Merge feature branch to `main` and push to trigger deploy

## Feature Backlog (GitHub Issues)

- #1 Authentication (Supabase Auth) — DONE
- #2 Categories/Tags — DONE
- #3 Subtasks/Checklists — DONE
- #4 Highlight overdue tasks — DONE
- #5 Search and sort — DONE
- #6 Recurring tasks — DONE
- #7 Dark mode — DONE
- #8 Calendar view — DONE
- #9 Admin settings page — DONE
- #10 User settings page — DONE
- #12 Pairwise ranking system — DONE
- #14 Diet and medication tracking — DONE
- #15 Journal section — DONE
- #16 Diagram creator — DONE
- #18 Recurring charges / bills tracker — DONE

## Development Workflow (ALWAYS follow these)

1. **Before starting a new feature**: Create a GitHub issue for it if one doesn't exist
2. **After completing a feature**: Update this CLAUDE.md file — add new files to File Structure, update Feature Backlog, document any new patterns or env vars
3. **Database changes**: Use Supabase MCP `execute_sql` tool (project ref: `wvscbgcidgmvlitbobtt`) to run DDL/migrations directly. Update Prisma schema to match.
4. **Deploying**: Merge feature branch to `main` and push to trigger Vercel auto-deploy
5. **Testing**: Run `npm test` before committing. Add tests for new validation logic or utilities
6. **Code quality**: Run `npm run check` before committing (runs format, lint, typecheck, and tests in one command)
7. **Pre-commit hooks**: Husky + lint-staged auto-runs Prettier and ESLint on staged files at commit time

## User Notes

- Single-user app — no sharing/collaboration features
- User is new to development — be explicit with instructions
- Always merge to `main` and push for Vercel to deploy
