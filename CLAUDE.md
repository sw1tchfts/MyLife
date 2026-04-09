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
    page.tsx                   # Home (task list + filters)
    layout.tsx                 # Root layout
    api/tasks/route.ts         # GET + POST tasks
    api/tasks/[id]/route.ts    # GET + PUT + DELETE single task
    tasks/new/page.tsx         # Create task page
    tasks/[id]/edit/page.tsx   # Edit task page
  components/
    TaskCard.tsx               # Task card display
    TaskForm.tsx               # Shared create/edit form
    TaskList.tsx               # Task list container
    StatusBadge.tsx            # Status pill
    PriorityBadge.tsx          # Priority pill
    DeleteConfirmDialog.tsx    # Delete confirmation modal
```

## Deployment Notes
- Vercel auto-deploys on push to `main`
- Environment variable `DATABASE_URL` must be set in Vercel project settings
- Framework Preset must be set to "Next.js" in Vercel settings
