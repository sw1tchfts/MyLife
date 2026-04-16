import { vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Shared mock factories for API route tests.
 *
 * Usage:
 *   vi.mock("@/lib/supabase/server", () => mockSupabase());
 *   vi.mock("@/lib/prisma",          () => mockPrisma());
 *
 * Then in each test call `setAuthed()` / `setUnauthed()` and
 * configure prisma stubs via `getPrisma()`.
 */

/* ── Supabase auth mock ─────────────────────────────── */

let _authed = true;

export function setAuthed() {
  _authed = true;
}
export function setUnauthed() {
  _authed = false;
}

export function mockSupabase() {
  return {
    createClient: vi.fn().mockImplementation(async () => ({
      auth: {
        getUser: async () => ({
          data: {
            user: _authed
              ? { id: "test-user-id", email: "test@test.com" }
              : null,
          },
        }),
      },
    })),
  };
}

/* ── Prisma mock ────────────────────────────────────── */

const _prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};

function ensureModel(model: string) {
  if (!_prisma[model]) {
    _prisma[model] = {};
  }
  return _prisma[model];
}

function ensureMethod(model: string, method: string) {
  const m = ensureModel(model);
  if (!m[method]) {
    m[method] = vi.fn();
  }
  return m[method];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Get the mock prisma object — configure stubs with `.mockResolvedValue()` */
export function getPrisma(): any {
  return new Proxy(
    {},
    {
      get(_target, model: string) {
        return new Proxy(
          {},
          {
            get(_t, method: string) {
              return ensureMethod(model, method);
            },
          },
        );
      },
    },
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function mockPrisma() {
  return { prisma: getPrisma() };
}

/** Reset all prisma mock implementations between tests */
export function resetPrismaMocks() {
  for (const model of Object.keys(_prisma)) {
    for (const method of Object.keys(_prisma[model])) {
      _prisma[model][method].mockReset();
    }
  }
}

/* ── Request builder ────────────────────────────────── */

export function buildRequest(
  path: string,
  options?: { method?: string; body?: unknown },
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const init: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  } = {
    method: options?.method ?? "GET",
  };
  if (options?.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return new NextRequest(url, init);
}
