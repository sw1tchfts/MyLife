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

const ROUTINE_INCLUDE = {
  days: {
    orderBy: { dayOrder: "asc" as const },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" as const },
        include: { exercise: true },
      },
    },
  },
};

// GET /api/gym/routines — list all routines with days and exercises
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routines = await prisma.workoutRoutine.findMany({
      include: ROUTINE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routines);
  } catch (error) {
    console.error("Failed to fetch routines:", error);
    return NextResponse.json(
      { error: "Failed to fetch routines" },
      { status: 500 },
    );
  }
}

// POST /api/gym/routines — create a routine with days and exercises
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const routine = await prisma.workoutRoutine.create({
      data: {
        name: body.name.trim(),
        description: body.description || "",
        goal: body.goal || "hypertrophy",
        level: body.level || "beginner",
        daysPerWeek: body.daysPerWeek || 3,
        days: body.days
          ? {
              create: body.days.map(
                (
                  day: {
                    name: string;
                    dayOrder: number;
                    scheduledDay?: string;
                    exercises?: {
                      exerciseId: string;
                      sets?: number;
                      repsMin?: number;
                      repsMax?: number;
                      restSeconds?: number;
                      sortOrder?: number;
                      notes?: string;
                    }[];
                  },
                  i: number,
                ) => ({
                  name: day.name,
                  dayOrder: day.dayOrder ?? i,
                  scheduledDay: day.scheduledDay || null,
                  exercises: day.exercises
                    ? {
                        create: day.exercises.map((ex, j) => ({
                          exerciseId: ex.exerciseId,
                          sets: ex.sets ?? 3,
                          repsMin: ex.repsMin ?? 8,
                          repsMax: ex.repsMax ?? 12,
                          restSeconds: ex.restSeconds ?? 90,
                          sortOrder: ex.sortOrder ?? j,
                          notes: ex.notes ?? "",
                        })),
                      }
                    : undefined,
                }),
              ),
            }
          : undefined,
      },
      include: ROUTINE_INCLUDE,
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error("Failed to create routine:", error);
    return NextResponse.json(
      { error: "Failed to create routine" },
      { status: 500 },
    );
  }
}
