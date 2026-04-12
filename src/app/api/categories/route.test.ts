import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockSupabase,
  mockPrisma,
  getPrisma,
  resetPrismaMocks,
  setAuthed,
  setUnauthed,
  buildRequest,
} from "@/test/api-helpers";

vi.mock("@/lib/supabase/server", () => mockSupabase());
vi.mock("@/lib/prisma", () => mockPrisma());

import { GET, POST } from "./route";

const prisma = getPrisma();

beforeEach(() => {
  resetPrismaMocks();
  setAuthed();
});

/* ── GET /api/categories ─────────────────────────────── */

describe("GET /api/categories", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns categories sorted by name", async () => {
    const cats = [
      { id: "1", name: "Health", color: "#22c55e" },
      { id: "2", name: "Work", color: "#3b82f6" },
    ];
    prisma.category.findMany.mockResolvedValue(cats);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(cats);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
  });
});

/* ── POST /api/categories ────────────────────────────── */

describe("POST /api/categories", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await POST(
      buildRequest("/api/categories", {
        method: "POST",
        body: { name: "Test" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a category with default color", async () => {
    const created = { id: "1", name: "Fitness", color: "#6B7280" };
    prisma.category.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/categories", {
        method: "POST",
        body: { name: "Fitness" },
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: "Fitness", color: "#6B7280" },
    });
  });

  it("creates a category with custom color", async () => {
    const created = { id: "1", name: "Work", color: "#ff0000" };
    prisma.category.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/categories", {
        method: "POST",
        body: { name: "Work", color: "#ff0000" },
      }),
    );

    expect(res.status).toBe(201);
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: "Work", color: "#ff0000" },
    });
  });

  it("returns 400 for missing name", async () => {
    const res = await POST(
      buildRequest("/api/categories", { method: "POST", body: {} }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty name", async () => {
    const res = await POST(
      buildRequest("/api/categories", { method: "POST", body: { name: "  " } }),
    );
    expect(res.status).toBe(400);
  });
});
