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
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const routineId = searchParams.get("routineId");

    const where: Record<string, unknown> = {};

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    if (routineId) where.routineId = routineId;

    const logs = await prisma.workoutLog.findMany({
      where,
      include: {
        routine: { select: { id: true, name: true } },
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
      orderBy: { date: "desc" },
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const log = await prisma.$transaction(async (tx: any) => {
      const created = await tx.workoutLog.create({
        data: {
          routineId: body.routineId ?? null,
          routineDayId: body.routineDayId ?? null,
          date: new Date(body.date),
          durationMinutes: body.durationMinutes ?? 0,
          notes: body.notes ?? "",
        },
      });

      if (body.exercises && Array.isArray(body.exercises)) {
        for (const exercise of body.exercises) {
          const logExercise = await tx.workoutLogExercise.create({
            data: {
              logId: created.id,
              exerciseId: exercise.exerciseId,
              sortOrder: exercise.sortOrder ?? 0,
            },
          });

          if (exercise.sets && Array.isArray(exercise.sets)) {
            for (const set of exercise.sets) {
              await tx.workoutLogSet.create({
                data: {
                  logExerciseId: logExercise.id,
                  setNumber: set.setNumber ?? 1,
                  reps: set.reps ?? 0,
                  weight: set.weight ?? 0,
                  unit: set.unit ?? "lbs",
                  completed: true,
                },
              });
            }
          }
        }
      }

      return tx.workoutLog.findUnique({
        where: { id: created.id },
        include: {
          routine: { select: { id: true, name: true } },
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: {
              exercise: true,
              sets: { orderBy: { setNumber: "asc" } },
            },
          },
        },
      });
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
