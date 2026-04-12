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

// GET /api/tasks/:id/dependencies — list what blocks this task and what it blocks
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

    const [blockedBy, blocking] = await Promise.all([
      prisma.taskDependency.findMany({
        where: { blockedId: id },
        include: {
          blocker: { select: { id: true, title: true, status: true } },
        },
      }),
      prisma.taskDependency.findMany({
        where: { blockerId: id },
        include: {
          blocked: { select: { id: true, title: true, status: true } },
        },
      }),
    ]);

    return NextResponse.json({ blockedBy, blocking });
  } catch (error) {
    console.error("Failed to fetch dependencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch dependencies" },
      { status: 500 },
    );
  }
}

// POST /api/tasks/:id/dependencies — add a dependency
// body: { blockerId: string } — the task that blocks this one
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
    const { blockerId } = await request.json();

    if (!blockerId || typeof blockerId !== "string") {
      return NextResponse.json(
        { error: "blockerId is required" },
        { status: 400 },
      );
    }

    if (blockerId === id) {
      return NextResponse.json(
        { error: "A task cannot block itself" },
        { status: 400 },
      );
    }

    const dep = await prisma.taskDependency.create({
      data: { blockerId, blockedId: id },
      include: { blocker: { select: { id: true, title: true, status: true } } },
    });

    return NextResponse.json(dep, { status: 201 });
  } catch (error) {
    console.error("Failed to create dependency:", error);
    return NextResponse.json(
      { error: "Failed to create dependency" },
      { status: 500 },
    );
  }
}

// DELETE /api/tasks/:id/dependencies — remove a dependency
// body: { dependencyId: string }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params; // consume params
    const { dependencyId } = await request.json();

    if (!dependencyId || typeof dependencyId !== "string") {
      return NextResponse.json(
        { error: "dependencyId is required" },
        { status: 400 },
      );
    }

    await prisma.taskDependency.delete({ where: { id: dependencyId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete dependency:", error);
    return NextResponse.json(
      { error: "Failed to delete dependency" },
      { status: 500 },
    );
  }
}
