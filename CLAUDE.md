@AGENTS.md

# MyLife — Task Tracker

## Overview

Personal task tracking web app. Single user (no sharing/collaboration features).

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL via Supabase (transaction pooler, port 6543)
- **Styling**: Tailwind CSS v4
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
prisma.config.ts               # Prisma connection config
src/
  lib/prisma.ts                # Prisma client singleton
  lib/types.ts                 # Validation + shared types
  app/
    page.tsx                   # Home (view switcher via ?view= param)
    layout.tsx                 # Root layout (sidebar for authed, plain for login)
    api/tasks/route.ts         # GET + POST tasks
    api/tasks/[id]/route.ts    # GET + PUT + DELETE single task
    api/categories/route.ts    # GET + POST categories
    api/categories/[id]/route.ts # PUT + DELETE single category
    api/settings/app/route.ts  # GET + PUT app-wide settings
    api/settings/user/route.ts # GET + PUT user preferences
    tasks/new/page.tsx         # Create task page
    tasks/[id]/edit/page.tsx   # Edit task page
    admin/page.tsx             # Admin settings (categories, defaults, stats)
    settings/page.tsx          # User settings (theme, account, notifications)
  components/
    Sidebar.tsx                # Left navigation sidebar (Notion-style)
    TaskCard.tsx               # Task card display + getDueStatus helper
    TaskForm.tsx               # Shared create/edit form
    TaskList.tsx               # Legacy task list (kept for reference)
    StatusBadge.tsx            # Status pill
    PriorityBadge.tsx          # Priority pill
    DeleteConfirmDialog.tsx    # Delete confirmation modal
    SignOutButton.tsx           # Sign-out button (used by Sidebar)
    views/
      ListView.tsx             # Table/list view with sortable columns
      CalendarView.tsx         # Monthly calendar with tasks on due dates
      TimelineView.tsx         # Horizontal timeline/Gantt view
      DashboardView.tsx        # Summary stats and breakdowns
      FocusView.tsx            # Overdue + due-today/soon focus mode
```

## Navigation

- Left sidebar (Notion-style) with view switcher and manage links
- Views selected via `?view=` query param: `list`, `calendar`, `timeline`, `dashboard`, `focus`
- Default view: `list`
- Sidebar only shown for authenticated users; login page gets plain layout

## Authentication

- **Supabase Auth** with email/password sign-in
- Packages: `@supabase/supabase-js`, `@supabase/ssr`
- Browser client: `src/lib/supabase/client.ts` (uses `createBrowserClient`)
- Server client: `src/lib/supabase/server.ts` (uses `createServerClient`, async `cookies()`)
- Session management: `src/proxy.ts` (Next.js 16 renamed middleware to proxy)
- Login page: `src/app/login/page.tsx`
- Auth callback: `src/app/auth/callback/route.ts`
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
- Environment variables in Vercel: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Framework Preset must be set to "Next.js" in Vercel settings
- Database tables were created via Supabase SQL Editor (not Prisma migrate)
- Merge feature branch to `main` and push to trigger deploy

## Feature Backlog (GitHub Issues)

- #1 Authentication (Supabase Auth) — DONE
- #2 Categories/Tags — DONE
- #3 Subtasks/Checklists
- #4 Highlight overdue tasks — DONE
- #5 Search and sort
- #6 Recurring tasks
- #7 Dark mode
- #8 Calendar view
- #9 Admin settings page — DONE
- #10 User settings page — DONE

## Development Workflow (ALWAYS follow these)

1. **Before starting a new feature**: Create a GitHub issue for it if one doesn't exist
2. **After completing a feature**: Update this CLAUDE.md file — add new files to File Structure, update Feature Backlog, document any new patterns or env vars
3. **Database changes**: Can't run Prisma migrations from Claude Code (network restricted) — provide SQL for user to run in Supabase SQL Editor
4. **Deploying**: Merge feature branch to `main` and push to trigger Vercel auto-deploy
5. **Testing**: Run `npm test` before committing. Add tests for new validation logic or utilities
6. **Code quality**: Run `npm run lint` and `npm run format:check` before committing

## User Notes

- Single-user app — no sharing/collaboration features
- User is new to development — be explicit with instructions
- Always merge to `main` and push for Vercel to deploy
