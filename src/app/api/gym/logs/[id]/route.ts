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

    const log = await prisma.workoutLog.findUnique({
      where: { id },
      include: {
        routine: true,
        routineDay: true,
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json(
        { error: "Workout log not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Failed to fetch workout log:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout log" },
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

    const existing = await prisma.workoutLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Workout log not found" },
        { status: 404 },
      );
    }

    const data: Record<string, unknown> = {};
    if (body.durationMinutes !== undefined)
      data.durationMinutes = body.durationMinutes;
    if (body.notes !== undefined) data.notes = body.notes;

    const log = await prisma.workoutLog.update({
      where: { id },
      data,
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Failed to update workout log:", error);
    return NextResponse.json(
      { error: "Failed to update workout log" },
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

    const existing = await prisma.workoutLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Workout log not found" },
        { status: 404 },
      );
    }

    await prisma.workoutLog.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete workout log:", error);
    return NextResponse.json(
      { error: "Failed to delete workout log" },
      { status: 500 },
    );
  }
}
