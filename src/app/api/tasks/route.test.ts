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

/* ── GET /api/tasks ──────────────────────────────────── */

describe("GET /api/tasks", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await GET(buildRequest("/api/tasks"));
    expect(res.status).toBe(401);
  });

  it("returns all tasks", async () => {
    const tasks = [
      { id: "1", title: "Task 1", status: "TODO" },
      { id: "2", title: "Task 2", status: "DONE" },
    ];
    prisma.task.findMany.mockResolvedValue(tasks);

    const res = await GET(buildRequest("/api/tasks"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(tasks);
  });

  it("filters by status query param", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await GET(buildRequest("/api/tasks?status=TODO&status=IN_PROGRESS"));

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ["TODO", "IN_PROGRESS"] } },
      }),
    );
  });

  it("returns 500 on database error", async () => {
    prisma.task.findMany.mockRejectedValue(new Error("DB down"));

    const res = await GET(buildRequest("/api/tasks"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch tasks" });
  });
});

/* ── POST /api/tasks ─────────────────────────────────── */

describe("POST /api/tasks", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await POST(
      buildRequest("/api/tasks", { method: "POST", body: { title: "Test" } }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a task with defaults", async () => {
    const created = {
      id: "1",
      title: "New task",
      status: "TODO",
      priority: "MEDIUM",
    };
    prisma.task.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/tasks", {
        method: "POST",
        body: { title: "New task" },
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "New task",
        status: "TODO",
        priority: "MEDIUM",
      }),
    });
  });

  it("creates a task with all fields", async () => {
    const created = {
      id: "1",
      title: "Full task",
      status: "IN_PROGRESS",
      priority: "HIGH",
    };
    prisma.task.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/tasks", {
        method: "POST",
        body: {
          title: "Full task",
          status: "IN_PROGRESS",
          priority: "HIGH",
          description: "A description",
          dueDate: "2026-05-01",
          recurrence: "WEEKLY",
        },
      }),
    );

    expect(res.status).toBe(201);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Full task",
        status: "IN_PROGRESS",
        priority: "HIGH",
        description: "A description",
        recurrence: "WEEKLY",
      }),
    });
  });

  it("returns 400 for missing title", async () => {
    const res = await POST(
      buildRequest("/api/tasks", { method: "POST", body: {} }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty title", async () => {
    const res = await POST(
      buildRequest("/api/tasks", { method: "POST", body: { title: "  " } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    const res = await POST(
      buildRequest("/api/tasks", {
        method: "POST",
        body: { title: "Test", status: "INVALID" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid priority", async () => {
    const res = await POST(
      buildRequest("/api/tasks", {
        method: "POST",
        body: { title: "Test", priority: "URGENT" },
      }),
    );
    expect(res.status).toBe(400);
  });
});
