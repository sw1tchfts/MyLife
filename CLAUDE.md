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
- **Recurrence generation**: `POST /api/tasks/generate-instances` is called once on app startup (fire-and-forget from the tasks page), NOT on every GET. Recurrence logic lives in `src/lib/recurrence.ts`.
- **Pagination**: API routes support opt-in pagination via `?limit=50&page=1`. When `limit` is provided, response is `{ items, total, page, limit }`. Without `limit`, returns all results (backward compatible). Used by tasks and journal APIs.
- **Dynamic imports**: Large tab components are extracted into `src/components/{feature}/` directories and loaded via `next/dynamic` to enable code splitting.
- **React.memo**: Applied to frequently-rendered components (`TaskCard`, `StatusBadge`, `PriorityBadge`) to skip unnecessary re-renders.
- **Centralized screen names**: All user-visible names (page titles, tab labels, modal titles, section headings, shared label maps like weekdays/meals/moods) live in `src/lib/screens.ts`. Import from there instead of hardcoding strings in components. This is the single source of truth for what anything in the UI is called.
- **Reusable analysis commands**: Slash commands in `.claude/commands/` for code health checks (`/scan-unused-code`, `/scan-dead-files`, `/audit-deps`, `/detect-circular-deps`, `/safe-cleanup-plan`).

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
  test/tdee.test.ts            # Adaptive TDEE algorithm tests
  lib/prisma.ts                # Prisma client singleton
  lib/types.ts                 # Validation + shared types
  lib/screens.ts               # Centralized screen, tab, modal, and shared label constants
  lib/tdee.ts                  # Adaptive TDEE algorithm (weight tracking + daily burn)
  lib/recurrence.ts            # Recurring task instance generation
  lib/gym-seed-data.ts         # Static exercise + muscle seed data (1128 exercises, 81 muscles)
  app/
    page.tsx                   # Home — redirects to /tasks
    layout.tsx                 # Root layout (sidebar for authed, plain for login)
    api/tasks/route.ts         # GET (paginated) + POST tasks
    api/tasks/[id]/route.ts    # GET + PUT + DELETE single task (auto-creates next for recurring)
    api/tasks/[id]/subtasks/route.ts # POST + PUT + DELETE subtasks
    api/tasks/[id]/dependencies/route.ts # GET + POST + DELETE task dependencies
    api/tasks/generate-instances/route.ts # POST — generate recurring task instances (called on app startup)
    api/tasks/notifications/route.ts     # GET — lightweight overdue/due-today counts
    api/foods/search/route.ts          # GET search USDA FoodData Central
    api/foods/route.ts                 # GET + POST saved foods
    api/foods/[id]/route.ts            # DELETE saved food
    api/medications/search/route.ts    # GET search OpenFDA drug labels
    api/medications/route.ts           # GET + POST saved medications
    api/medications/[id]/route.ts      # DELETE saved medication
    api/nutrition/route.ts             # GET nutrition logs (by date range)
    api/body-metrics/route.ts          # GET + POST body metrics
    api/body-metrics/[id]/route.ts     # DELETE body metric
    api/tracker/route.ts               # GET tracker dashboard data + POST daily log
    api/journal/route.ts               # GET (paginated) + POST journal entries
    api/journal/[id]/route.ts          # GET + PUT + DELETE single journal entry
    api/gym/exercises/route.ts         # GET + POST exercises (filter by muscle group, category, search)
    api/gym/exercises/seed/route.ts    # POST — seed exercises + muscles from static data (1128 exercises)
    api/gym/muscles/route.ts           # GET muscles (filter by group, includes hierarchy)
    api/gym/routines/route.ts          # GET + POST workout routines
    api/gym/routines/[id]/route.ts     # GET + DELETE single routine
    api/gym/logs/route.ts              # GET + POST workout logs
    api/gym/logs/[id]/route.ts         # DELETE single workout log
    api/settings/user/route.ts # GET + PUT user preferences
    tasks/page.tsx             # Tasks (tabs: dashboard, tasks, adhoc-config, recurring-config)
    tasks/loading.tsx          # Skeleton loading state for tasks page
    tasks/new/page.tsx         # Create task page
    tasks/[id]/edit/page.tsx   # Edit task page
    journal/page.tsx           # Journal (write, entries list, calendar view)
    journal/loading.tsx        # Skeleton loading state for journal page
    diet/page.tsx              # Diet & nutrition (food library, diet routines)
    diet/loading.tsx           # Skeleton loading state for diet page
    medications/page.tsx       # Medication tracking (search, saved meds, schedule)
    gym/page.tsx               # Gym (exercises, routines)
    auth/reset-password/page.tsx # Password reset page
    settings/page.tsx          # User settings (theme, account, notifications, tracker config)
  components/
    Sidebar.tsx                # Left navigation sidebar (Notion-style)
    SubtaskList.tsx            # Subtask checklist with progress bar
    TaskCard.tsx               # Task card display + getDueStatus helper + types (React.memo)
    TaskModal.tsx              # Task create/edit modal (food/med managers)
    TrackerForm.tsx            # Inline daily tracker form (weight, bf%, metrics + TDEE display)
    TaskForm.tsx               # Shared create/edit form (incl. recurrence)
    StatusBadge.tsx            # Status pill (React.memo)
    PriorityBadge.tsx          # Priority pill (React.memo)
    ToastProvider.tsx          # Toast notifications with undo support
    TaskNotifications.tsx      # Browser notifications using lightweight /api/tasks/notifications
    views/
      ListView.tsx             # Table/list view with sortable columns + mobile cards
      DashboardView.tsx        # Habit tracking grid, streaks, and weekly progress
      DailyLogSection.tsx      # Daily log dashboard (TDEE, weight, nutrition, meds)
      RecurringConfig.tsx      # Recurring task parent management
    gym/
      ExercisesTab.tsx         # Exercise library (search, filter, add)
      RoutinesTab.tsx          # Routine builder (days, exercises, activation)
    diet/
      FoodLibraryTab.tsx       # Food search + saved food library
      DietRoutineTab.tsx       # Meal planning with food assignments
```

## Navigation

- Left sidebar (Notion-style) with section links and manage links
- Sidebar links: Tasks, Diet, Gym, Medications, Journal
- Manage section: Settings
- `/` redirects to `/tasks`
- Sidebar only shown for authenticated users; login page gets plain layout
- Tasks page uses `?tab=` param: `dashboard`, `tasks`, `adhoc-config`, `recurring-config` (default: `tasks`)
- Search bar + status/priority/type filter pills on tasks page

## Dark Mode

- Class-based dark mode via Tailwind v4 `@variant dark`
- ThemeProvider manages `dark` class on `<html>`, persists to localStorage
- Settings page has light/dark/system toggle
- All components have `dark:` classes

## Recurring Tasks

- Tasks can have recurrence: NONE, DAILY, WEEKLY, MONTHLY
- When a recurring task is marked DONE, the API auto-creates the next occurrence with an updated due date
- Recurrence indicator shown as purple badge in list view

## Daily Tracker & TDEE

- **Task type**: `TRACKER` added to `TaskType` enum (alongside TASK, MEAL, MEDICATION)
- Auto-creates a daily recurring "Daily Log" task when tracker is enabled
- TRACKER tasks render as an inline form in the task list (via `TrackerForm.tsx`) with configurable input fields
- On completion, saves measurements to `BodyMetric` table
- Shows read-only calorie/macro totals from that day's meal tasks
- **Adaptive TDEE algorithm** (`src/lib/tdee.ts`): hybrid nSuns TDEE 3.0 + MacroFactor approach
  - EMA-smoothed daily weights (α = 0.1) → weekly averages → rolling 6-week TDEE
  - Seeded with Mifflin-St Jeor formula, transitions to real data over 3-4 weeks
  - Composition-adjusted energy constant (3500 cal/lb fat → 2800 cal/lb mixed)
  - Exercise implicitly captured via actual weight change
  - Confidence levels: low (<2 weeks), medium (2-4 weeks), high (4+ weeks)
- **User settings**: `trackerEnabled` (Boolean) + `trackerConfig` (JSON) on `UserSettings`
  - Metric toggles (weight, body fat, waist, chest, manual calories)
  - Units (lbs/kg, in/cm)
  - Profile (height, age, sex, activity level) for TDEE seed
  - Goal (maintenance/cut/bulk + weekly rate)
- **Daily Log Dashboard**: shown as the "Dashboard" tab on `/tasks?tab=dashboard` via `DailyLogSection.tsx` — displays TDEE estimate, weight trend chart, calorie intake vs TDEE chart, nutrition summary, medication log

## Gym & Workout Logs

- **Muscle database**: `Muscle` table with self-referencing hierarchy (`parentId`). Each muscle has a `group` (Arms, Back, Calves, Chest, Core, Forearms, Hips, Neck, Shoulders, Thighs) and optional parent (e.g., "Deltoid, Anterior" → parent "Deltoid"). ~81 muscles. Muscle group constants in `src/lib/screens.ts`.
- **Exercise-muscle relationships**: `ExerciseMuscle` junction table links exercises to muscles with a `role` field: `target`, `synergist`, `dynamic_stabilizer`, `stabilizer`, `antagonist_stabilizer`. Based on ExRx.net's classification system.
- **Exercise library**: Seeded from [MuscleBook](https://github.com/cfilipov/MuscleBook) exercises.yaml (1128 exercises from ExRx.net). Static seed data in `src/lib/gym-seed-data.ts`. Each exercise has: `utility` (Basic/Auxiliary), `mechanics` (Compound/Isolated), `force` (Push/Pull), `equipment`, plus detailed muscle role mappings. Seed via `POST /api/gym/exercises/seed`.
- **Routine creation**: Each `WorkoutRoutineDay` has an optional `scheduledDay` field (mon/tue/wed/thu/fri/sat/sun) so weekdays can be assigned during routine building
- **Activation**: Creates recurring tasks from routine days; pre-populates weekday assignments from saved `scheduledDay` values
- **Workout log persistence**: `WorkoutLog.routineId` and `routineDayId` use `onDelete: SetNull` — deleting a routine preserves all logged workouts
- **Snapshot fields**: `WorkoutLog` stores `routineName` and `routineDayName` at log creation time, so log history retains context even after routine deletion
- The logs API auto-looks up routine/day names when `routineId`/`routineDayId` are provided

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
- #2 Categories/Tags — REMOVED
- #3 Subtasks/Checklists — DONE
- #4 Highlight overdue tasks — DONE
- #5 Search and sort — DONE
- #6 Recurring tasks — DONE
- #7 Dark mode — DONE
- #8 Calendar view — DONE
- #9 Admin settings page — REMOVED (categories, default task settings, data export)
- #10 User settings page — DONE
- #12 Pairwise ranking system — REMOVED
- #14 Diet and medication tracking — DONE
- #15 Journal section — DONE
- #16 Diagram creator — REMOVED
- #19 Weight tracking & adaptive TDEE Daily Burn — DONE
- #20 Undo on delete (toast instead of confirmation dialog) — DONE
- #21 Landing page dashboard with today's overview
- #22 Weekly/monthly reports on dashboard
- #23 Journal insights and mood scale (1-10 numeric)
- #24 Optimistic UI updates
- #25 Error boundaries for all routes
- #26 PWA support (installable on mobile)
- #27 Pull-to-refresh on mobile
- #28 Swipe actions on task cards (mobile)
- #29 Task templates (Ad-Hoc Config)
- #30 Gym workout logging from tasks + auto-sync to gym logs

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
- **Active development mode**: After committing to the feature branch, always merge to `main` and push immediately (unless told otherwise). This keeps Vercel deploys flowing continuously.
- **No keyboard shortcuts**: Do NOT add global keyboard shortcuts to the app. The user does not want them.
