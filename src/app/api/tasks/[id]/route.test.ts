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

import { GET, PUT, DELETE } from "./route";

const prisma = getPrisma();

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const TASK = {
  id: "task-1",
  title: "Existing task",
  description: "desc",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: null,
  recurrence: "NONE",
  taskType: "TASK",
  mealType: null,
};

beforeEach(() => {
  resetPrismaMocks();
  setAuthed();
});

/* ── GET /api/tasks/:id ──────────────────────────────── */

describe("GET /api/tasks/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await GET(
      buildRequest("/api/tasks/task-1"),
      makeParams("task-1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns the task", async () => {
    prisma.task.findUnique.mockResolvedValue(TASK);

    const res = await GET(
      buildRequest("/api/tasks/task-1"),
      makeParams("task-1"),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(TASK);
  });

  it("returns 404 for non-existent task", async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await GET(buildRequest("/api/tasks/nope"), makeParams("nope"));
    expect(res.status).toBe(404);
  });
});

/* ── PUT /api/tasks/:id ──────────────────────────────── */

describe("PUT /api/tasks/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await PUT(
      buildRequest("/api/tasks/task-1", {
        method: "PUT",
        body: { title: "X" },
      }),
      makeParams("task-1"),
    );
    expect(res.status).toBe(401);
  });

  it("updates task title", async () => {
    prisma.task.findUnique.mockResolvedValue(TASK);
    prisma.task.update.mockResolvedValue({ ...TASK, title: "Updated" });

    const res = await PUT(
      buildRequest("/api/tasks/task-1", {
        method: "PUT",
        body: { title: "Updated" },
      }),
      makeParams("task-1"),
    );

    expect(res.status).toBe(200);
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: expect.objectContaining({ title: "Updated" }),
    });
  });

  it("updates task status", async () => {
    prisma.task.findUnique.mockResolvedValue(TASK);
    prisma.task.update.mockResolvedValue({ ...TASK, status: "DONE" });

    const res = await PUT(
      buildRequest("/api/tasks/task-1", {
        method: "PUT",
        body: { status: "DONE" },
      }),
      makeParams("task-1"),
    );

    expect(res.status).toBe(200);
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: expect.objectContaining({ status: "DONE" }),
    });
  });

  it("returns 404 for non-existent task", async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await PUT(
      buildRequest("/api/tasks/nope", { method: "PUT", body: { title: "X" } }),
      makeParams("nope"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid status", async () => {
    const res = await PUT(
      buildRequest("/api/tasks/task-1", {
        method: "PUT",
        body: { status: "NOPE" },
      }),
      makeParams("task-1"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty title", async () => {
    const res = await PUT(
      buildRequest("/api/tasks/task-1", { method: "PUT", body: { title: "" } }),
      makeParams("task-1"),
    );
    expect(res.status).toBe(400);
  });
});

/* ── DELETE /api/tasks/:id ───────────────────────────── */

describe("DELETE /api/tasks/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await DELETE(
      buildRequest("/api/tasks/task-1", { method: "DELETE" }),
      makeParams("task-1"),
    );
    expect(res.status).toBe(401);
  });

  it("deletes an existing task", async () => {
    prisma.task.findUnique.mockResolvedValue(TASK);
    prisma.task.delete.mockResolvedValue(TASK);

    const res = await DELETE(
      buildRequest("/api/tasks/task-1", { method: "DELETE" }),
      makeParams("task-1"),
    );
    expect(res.status).toBe(204);
    expect(prisma.task.delete).toHaveBeenCalledWith({
      where: { id: "task-1" },
    });
  });

  it("returns 404 for non-existent task", async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await DELETE(
      buildRequest("/api/tasks/nope", { method: "DELETE" }),
      makeParams("nope"),
    );
    expect(res.status).toBe(404);
  });
});
