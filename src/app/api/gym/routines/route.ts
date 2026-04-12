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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preset = searchParams.get("preset");

    const where: Record<string, unknown> = {};
    if (preset === "true") where.isPreset = true;
    if (preset === "false") where.isPreset = false;

    const routines = await prisma.workoutRoutine.findMany({
      where,
      include: {
        _count: { select: { days: true } },
      },
      orderBy: [{ isPreset: "desc" }, { name: "asc" }],
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routine = await prisma.$transaction(async (tx: any) => {
      const created = await tx.workoutRoutine.create({
        data: {
          name: body.name,
          description: body.description ?? "",
          goal: body.goal ?? "hypertrophy",
          level: body.level ?? "beginner",
          daysPerWeek: body.daysPerWeek ?? 3,
          isPreset: false,
        },
      });

      if (body.days && Array.isArray(body.days)) {
        for (const day of body.days) {
          const createdDay = await tx.workoutRoutineDay.create({
            data: {
              routineId: created.id,
              name: day.name,
              dayOrder: day.dayOrder ?? 0,
            },
          });

          if (day.exercises && Array.isArray(day.exercises)) {
            for (const exercise of day.exercises) {
              await tx.routineDayExercise.create({
                data: {
                  routineDayId: createdDay.id,
                  exerciseId: exercise.exerciseId,
                  sets: exercise.sets ?? 3,
                  repsMin: exercise.repsMin ?? 8,
                  repsMax: exercise.repsMax ?? 12,
                  restSeconds: exercise.restSeconds ?? 90,
                  sortOrder: exercise.sortOrder ?? 0,
                  notes: exercise.notes ?? "",
                },
              });
            }
          }
        }
      }

      return tx.workoutRoutine.findUnique({
        where: { id: created.id },
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
