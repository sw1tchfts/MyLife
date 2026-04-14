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

/* ── GET /api/journal ────────────────────────────────── */

describe("GET /api/journal", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await GET(buildRequest("/api/journal"));
    expect(res.status).toBe(401);
  });

  it("returns all entries", async () => {
    const entries = [
      {
        id: "1",
        title: "Day one",
        content: "Hello",
        journalEntryTags: [{ tag: { name: "work" } }],
      },
    ];
    prisma.journalEntry.findMany.mockResolvedValue(entries);

    const res = await GET(buildRequest("/api/journal"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { id: "1", title: "Day one", content: "Hello", tags: ["work"] },
    ]);
  });

  it("filters by mood", async () => {
    prisma.journalEntry.findMany.mockResolvedValue([]);

    await GET(buildRequest("/api/journal?mood=GREAT"));

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mood: "GREAT" }),
      }),
    );
  });

  it("filters by search term", async () => {
    prisma.journalEntry.findMany.mockResolvedValue([]);

    await GET(buildRequest("/api/journal?search=vacation"));

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: "vacation", mode: "insensitive" } },
            { content: { contains: "vacation", mode: "insensitive" } },
            {
              journalEntryTags: {
                some: {
                  tag: { name: { contains: "vacation", mode: "insensitive" } },
                },
              },
            },
          ]),
        }),
      }),
    );
  });

  it("filters by date range", async () => {
    prisma.journalEntry.findMany.mockResolvedValue([]);

    await GET(buildRequest("/api/journal?from=2026-01-01&to=2026-01-31"));

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date("2026-01-01"),
            lte: new Date("2026-01-31"),
          },
        }),
      }),
    );
  });
});

/* ── POST /api/journal ───────────────────────────────── */

describe("POST /api/journal", () => {
  it("returns 401 when unauthenticated", async () => {
    setUnauthed();
    const res = await POST(
      buildRequest("/api/journal", {
        method: "POST",
        body: { content: "Hello" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a journal entry", async () => {
    const created = {
      id: "1",
      title: "",
      content: "My entry",
      mood: null,
      journalEntryTags: [],
    };
    prisma.journalEntry.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/journal", {
        method: "POST",
        body: { content: "My entry" },
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: "1",
      title: "",
      content: "My entry",
      mood: null,
      tags: [],
    });
  });

  it("creates with mood and title", async () => {
    const created = {
      id: "1",
      title: "Good day",
      content: "Was great",
      mood: "GREAT",
      journalEntryTags: [],
    };
    prisma.journalEntry.create.mockResolvedValue(created);

    const res = await POST(
      buildRequest("/api/journal", {
        method: "POST",
        body: { title: "Good day", content: "Was great", mood: "GREAT" },
      }),
    );

    expect(res.status).toBe(201);
    expect(prisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Good day",
          content: "Was great",
          mood: "GREAT",
        }),
      }),
    );
  });

  it("returns 400 for missing content", async () => {
    const res = await POST(
      buildRequest("/api/journal", {
        method: "POST",
        body: { title: "No content" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty content", async () => {
    const res = await POST(
      buildRequest("/api/journal", { method: "POST", body: { content: "  " } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid mood", async () => {
    const res = await POST(
      buildRequest("/api/journal", {
        method: "POST",
        body: { content: "Test", mood: "ECSTATIC" },
      }),
    );
    expect(res.status).toBe(400);
  });
});
