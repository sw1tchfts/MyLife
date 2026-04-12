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

    const routine = await prisma.workoutRoutine.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayOrder: "asc" },
          include: {
            exercises: {
              orderBy: { sortOrder: "asc" },
              include: { exercise: true },
            },
          },
        },
      },
    });

    if (!routine) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(routine);
  } catch (error) {
    console.error("Failed to fetch routine:", error);
    return NextResponse.json(
      { error: "Failed to fetch routine" },
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

    const existing = await prisma.workoutRoutine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 },
      );
    }

    if (existing.isPreset) {
      return NextResponse.json(
        { error: "Cannot update preset routines" },
        { status: 403 },
      );
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.goal !== undefined) data.goal = body.goal;
    if (body.level !== undefined) data.level = body.level;
    if (body.daysPerWeek !== undefined) data.daysPerWeek = body.daysPerWeek;

    const routine = await prisma.workoutRoutine.update({
      where: { id },
      data,
    });

    return NextResponse.json(routine);
  } catch (error) {
    console.error("Failed to update routine:", error);
    return NextResponse.json(
      { error: "Failed to update routine" },
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

    const existing = await prisma.workoutRoutine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Routine not found" },
        { status: 404 },
      );
    }

    if (existing.isPreset) {
      return NextResponse.json(
        { error: "Cannot delete preset routines" },
        { status: 403 },
      );
    }

    await prisma.workoutRoutine.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete routine:", error);
    return NextResponse.json(
      { error: "Failed to delete routine" },
      { status: 500 },
    );
  }
}
