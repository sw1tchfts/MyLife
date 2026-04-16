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

// GET /api/gym/routines/:id
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
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    equipment: true,
                    muscles: {
                      where: { role: "target" },
                      include: { muscle: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
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

// DELETE /api/gym/routines/:id
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
