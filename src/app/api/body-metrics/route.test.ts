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

/* ── GET /api/body-metrics ───────────────────────────── */

describe("GET /api/body-metrics", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await GET(buildRequest("/api/body-metrics"));
    expect(res.status).toBe(401);
  });

  it("returns all metrics", async () => {
    const metrics = [{ id: "1", type: "WEIGHT", value: 180, unit: "lbs" }];
    prisma.bodyMetric.findMany.mockResolvedValue(metrics);

    const res = await GET(buildRequest("/api/body-metrics"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(metrics);
  });

  it("filters by type", async () => {
    prisma.bodyMetric.findMany.mockResolvedValue([]);

    await GET(buildRequest("/api/body-metrics?type=WEIGHT"));

    expect(prisma.bodyMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: "WEIGHT" },
      }),
    );
  });
});

/* ── POST /api/body-metrics ──────────────────────────── */

describe("POST /api/body-metrics", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await POST(
      buildRequest("/api/body-metrics", {
        method: "POST",
        body: { date: "2026-04-12", type: "WEIGHT", value: 180, unit: "lbs" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a body metric", async () => {
    const created = { id: "1", type: "WEIGHT", value: 180, unit: "lbs" };
    prisma.bodyMetric.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/body-metrics", {
        method: "POST",
        body: {
          date: "2026-04-12T00:00:00Z",
          type: "WEIGHT",
          value: 180,
          unit: "lbs",
        },
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
  });

  it("defaults unit to empty string", async () => {
    prisma.bodyMetric.create.mockResolvedValue({});

    await POST(
      buildRequest("/api/body-metrics", {
        method: "POST",
        body: { date: "2026-04-12T00:00:00Z", type: "BMI", value: 24.5 },
      }),
    );

    expect(prisma.bodyMetric.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ unit: "" }),
    });
  });
});
