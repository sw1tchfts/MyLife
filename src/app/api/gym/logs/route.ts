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

const LOG_INCLUDE = {
  routine: { select: { id: true, name: true } },
  routineDay: { select: { id: true, name: true } },
  exercises: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          muscles: {
            where: { role: "target" },
            include: { muscle: true },
          },
        },
      },
      sets: { orderBy: { setNumber: "asc" as const } },
    },
  },
} as const;

// GET /api/gym/logs — list workout logs (most recent first)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const logs = await prisma.workoutLog.findMany({
      include: LOG_INCLUDE,
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch workout logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout logs" },
      { status: 500 },
    );
  }
}

// POST /api/gym/logs — log a workout session
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Look up routine/day names for snapshot fields
    let routineName = body.routineName || "";
    let routineDayName = body.routineDayName || "";

    if (body.routineId && !routineName) {
      const routine = await prisma.workoutRoutine.findUnique({
        where: { id: body.routineId },
        select: { name: true },
      });
      if (routine) routineName = routine.name;
    }
    if (body.routineDayId && !routineDayName) {
      const day = await prisma.workoutRoutineDay.findUnique({
        where: { id: body.routineDayId },
        select: { name: true },
      });
      if (day) routineDayName = day.name;
    }

    const log = await prisma.workoutLog.create({
      data: {
        date: new Date(body.date || new Date()),
        durationMinutes: body.durationMinutes || 0,
        notes: body.notes || "",
        routineId: body.routineId || null,
        routineDayId: body.routineDayId || null,
        routineName,
        routineDayName,
        exercises: body.exercises
          ? {
              create: body.exercises.map(
                (
                  ex: {
                    exerciseId: string;
                    sortOrder?: number;
                    sets?: {
                      setNumber?: number;
                      reps?: number;
                      weight?: number;
                      unit?: string;
                      completed?: boolean;
                    }[];
                  },
                  i: number,
                ) => ({
                  exerciseId: ex.exerciseId,
                  sortOrder: ex.sortOrder ?? i,
                  sets: ex.sets
                    ? {
                        create: ex.sets.map((s, j) => ({
                          setNumber: s.setNumber ?? j + 1,
                          reps: s.reps ?? 0,
                          weight: s.weight ?? 0,
                          unit: s.unit ?? "lbs",
                          completed: s.completed ?? true,
                        })),
                      }
                    : undefined,
                }),
              ),
            }
          : undefined,
      },
      include: LOG_INCLUDE,
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Failed to create workout log:", error);
    return NextResponse.json(
      { error: "Failed to create workout log" },
      { status: 500 },
    );
  }
}
