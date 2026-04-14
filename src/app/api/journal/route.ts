import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateCreateJournalInput } from "@/lib/types";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const mood = searchParams.get("mood");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (mood) {
      where.mood = mood;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        {
          journalEntryTags: {
            some: {
              tag: { name: { contains: search, mode: "insensitive" } },
            },
          },
        },
      ];
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: { journalEntryTags: { include: { tag: true } } },
    });

    const result = entries.map(({ journalEntryTags, ...rest }) => ({
      ...rest,
      tags: journalEntryTags.map((jt) => jt.tag.name),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateCreateJournalInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    const { parsed } = validation;
    const tagNames = parsed!.tags ?? [];

    const entry = await prisma.journalEntry.create({
      data: {
        title: parsed!.title ?? "",
        content: parsed!.content,
        mood: parsed!.mood ?? null,
        date: parsed!.date ? new Date(parsed!.date) : new Date(),
        journalEntryTags: {
          create: tagNames.map((name) => ({
            tag: {
              connectOrCreate: { where: { name }, create: { name } },
            },
          })),
        },
      },
      include: { journalEntryTags: { include: { tag: true } } },
    });

    const { journalEntryTags, ...rest } = entry;
    return NextResponse.json(
      { ...rest, tags: journalEntryTags.map((jt) => jt.tag.name) },
      { status: 201 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to create journal entry:", msg);
    return NextResponse.json(
      { error: "Failed to create journal entry", detail: msg },
      { status: 500 },
    );
  }
}
