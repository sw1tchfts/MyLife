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
    const period = searchParams.get("period") ?? "all";

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | null = null;

    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;
    const logWhere = dateFilter ? { date: dateFilter } : {};

    // Fetch all logs in the period with exercises and sets
    const logs = await prisma.workoutLog.findMany({
      where: logWhere,
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });

    // Total workouts
    const totalWorkouts = logs.length;

    // Total volume (sets * reps * weight)
    let totalVolume = 0;
    const muscleGroupCounts: Record<string, number> = {};
    const personalRecords: Record<
      string,
      { exerciseName: string; maxWeight: number; unit: string }
    > = {};

    for (const log of logs) {
      for (const logExercise of log.exercises) {
        // Track muscle group frequency
        const mg = logExercise.exercise.muscleGroup;
        muscleGroupCounts[mg] = (muscleGroupCounts[mg] ?? 0) + 1;

        for (const set of logExercise.sets) {
          // Accumulate volume
          totalVolume += set.reps * set.weight;

          // Track personal records (max weight per exercise)
          const exId = logExercise.exerciseId;
          if (
            !personalRecords[exId] ||
            set.weight > personalRecords[exId].maxWeight
          ) {
            personalRecords[exId] = {
              exerciseName: logExercise.exercise.name,
              maxWeight: set.weight,
              unit: set.unit,
            };
          }
        }
      }
    }

    // Most trained muscle groups (sorted by count desc)
    const mostTrainedMuscleGroups = Object.entries(muscleGroupCounts)
      .map(([muscleGroup, count]) => ({ muscleGroup, count }))
      .sort((a, b) => b.count - a.count);

    // Personal records (sorted by exercise name)
    const prs = Object.values(personalRecords)
      .filter((pr) => pr.maxWeight > 0)
      .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

    // Workout frequency (workouts per week)
    let workoutsPerWeek = 0;
    if (totalWorkouts > 0) {
      if (period === "week") {
        workoutsPerWeek = totalWorkouts;
      } else if (period === "month") {
        workoutsPerWeek = Math.round((totalWorkouts / 4) * 100) / 100;
      } else {
        // For "all", calculate based on the range from first to last workout
        const dates = logs.map((l: { date: Date }) => new Date(l.date).getTime());
        const oldest = Math.min(...dates);
        const newest = Math.max(...dates);
        const weeks = Math.max(
          1,
          (newest - oldest) / (7 * 24 * 60 * 60 * 1000),
        );
        workoutsPerWeek = Math.round((totalWorkouts / weeks) * 100) / 100;
      }
    }

    return NextResponse.json({
      totalWorkouts,
      totalVolume,
      mostTrainedMuscleGroups,
      personalRecords: prs,
      workoutsPerWeek,
    });
  } catch (error) {
    console.error("Failed to fetch workout stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout stats" },
      { status: 500 },
    );
  }
}
