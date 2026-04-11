import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(
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
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const maxOrder = await prisma.subtask.aggregate({
      where: { taskId: id },
      _max: { sortOrder: true },
    });

    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId: id,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error("Failed to create subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
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
    await params;
    const body = await request.json();
    const { subtaskId, title, done } = body;

    if (!subtaskId) {
      return NextResponse.json(
        { error: "subtaskId is required" },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof title === "string") data.title = title.trim();
    if (typeof done === "boolean") data.done = done;

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data,
    });

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("Failed to update subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await params;
    const { searchParams } = new URL(request.url);
    const subtaskId = searchParams.get("subtaskId");

    if (!subtaskId) {
      return NextResponse.json(
        { error: "subtaskId is required" },
        { status: 400 },
      );
    }

    await prisma.subtask.delete({ where: { id: subtaskId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 },
    );
  }
}
