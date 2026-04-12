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

import { PUT, DELETE } from "./route";

const prisma = getPrisma();

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  resetPrismaMocks();
  setAuthed();
});

/* ── PUT /api/categories/:id ─────────────────────────── */

describe("PUT /api/categories/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await PUT(
      buildRequest("/api/categories/cat-1", {
        method: "PUT",
        body: { name: "X" },
      }),
      makeParams("cat-1"),
    );
    expect(res.status).toBe(401);
  });

  it("updates category name", async () => {
    const updated = { id: "cat-1", name: "Renamed", color: "#000" };
    prisma.category.update.mockResolvedValue(updated);

    const res = await PUT(
      buildRequest("/api/categories/cat-1", {
        method: "PUT",
        body: { name: "Renamed" },
      }),
      makeParams("cat-1"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
  });

  it("updates category color", async () => {
    const updated = { id: "cat-1", name: "Work", color: "#ff0000" };
    prisma.category.update.mockResolvedValue(updated);

    const res = await PUT(
      buildRequest("/api/categories/cat-1", {
        method: "PUT",
        body: { color: "#ff0000" },
      }),
      makeParams("cat-1"),
    );

    expect(res.status).toBe(200);
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: "cat-1" },
      data: { color: "#ff0000" },
    });
  });
});

/* ── DELETE /api/categories/:id ──────────────────────── */

describe("DELETE /api/categories/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await DELETE(
      buildRequest("/api/categories/cat-1", { method: "DELETE" }),
      makeParams("cat-1"),
    );
    expect(res.status).toBe(401);
  });

  it("deletes a category", async () => {
    prisma.category.delete.mockResolvedValue({});

    const res = await DELETE(
      buildRequest("/api/categories/cat-1", { method: "DELETE" }),
      makeParams("cat-1"),
    );

    expect(res.status).toBe(204);
    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: "cat-1" },
    });
  });
});
