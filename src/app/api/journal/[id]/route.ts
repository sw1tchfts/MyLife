import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateUpdateJournalInput } from "@/lib/types";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { journalEntryTags: { include: { tag: true } } },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { journalEntryTags, ...rest } = entry;
    return NextResponse.json({
      ...rest,
      tags: journalEntryTags.map((jt) => jt.tag.name),
    });
  } catch (error) {
    console.error("Failed to fetch journal entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entry" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = validateUpdateJournalInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    const { parsed } = validation;
    const data: Record<string, unknown> = {};

    if (parsed!.title !== undefined) data.title = parsed!.title;
    if (parsed!.content !== undefined) data.content = parsed!.content;
    if (parsed!.mood !== undefined) data.mood = parsed!.mood;
    if (parsed!.date !== undefined) data.date = new Date(parsed!.date);

    // Handle tags: replace all associations
    if (parsed!.tags !== undefined) {
      const tagNames = parsed!.tags;
      data.journalEntryTags = {
        deleteMany: {},
        create: tagNames.map((name: string) => ({
          tag: {
            connectOrCreate: { where: { name }, create: { name } },
          },
        })),
      };
    }

    const entry = await prisma.journalEntry.update({
      where: { id },
      data,
      include: { journalEntryTags: { include: { tag: true } } },
    });

    const { journalEntryTags, ...rest } = entry;
    return NextResponse.json({
      ...rest,
      tags: journalEntryTags.map((jt) => jt.tag.name),
    });
  } catch (error) {
    console.error("Failed to update journal entry:", error);
    return NextResponse.json(
      { error: "Failed to update journal entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.journalEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete journal entry:", error);
    return NextResponse.json(
      { error: "Failed to delete journal entry" },
      { status: 500 },
    );
  }
}
