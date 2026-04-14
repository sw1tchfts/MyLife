import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  buildDailyEntries,
  calculateAdaptiveTDEE,
  type TrackerProfile,
  type TrackerGoal,
} from "@/lib/tdee";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * GET /api/tracker
 *
 * Returns:
 * - tdee: the adaptive TDEE result
 * - todayEntry: today's logged metrics (if any)
 * - todayNutrition: today's calorie/macro totals from meal tasks
 * - todayMedications: today's completed medication tasks
 * - trackerTask: today's tracker task (if exists)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get("days") || "90", 10);

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch user settings for tracker config
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    const trackerConfig = (settings?.trackerConfig as Record<string, unknown>) || {};
    const profile = (trackerConfig.profile || {}) as TrackerProfile;
    const goal = (trackerConfig.goal || {
      goalWeight: null,
      goalBodyFat: null,
    }) as TrackerGoal;
    const units = (trackerConfig.units || { weight: "lbs" }) as {
      weight: "lbs" | "kg";
    };

    // Fetch weight data and nutrition logs in parallel
    const [weights, nutritionLogs, todayMetrics, todayNutrition, todayMedTasks, trackerTask] =
      await Promise.all([
        // All weight entries for TDEE calculation
        prisma.bodyMetric.findMany({
          where: { type: "WEIGHT", date: { gte: since } },
          orderBy: { date: "asc" },
          select: { date: true, value: true },
        }),
        // All nutrition logs for TDEE calculation
        prisma.nutritionLog.findMany({
          where: { date: { gte: since } },
          orderBy: { date: "asc" },
          select: {
            date: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
          },
        }),
        // Today's body metrics
        prisma.bodyMetric.findMany({
          where: { date: { gte: today, lt: tomorrow } },
          orderBy: { type: "asc" },
        }),
        // Today's nutrition from meal tasks
        prisma.nutritionLog.findMany({
          where: { date: { gte: today, lt: tomorrow } },
          select: {
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
            fiber: true,
            sugar: true,
            sodium: true,
          },
        }),
        // Today's completed medication tasks
        prisma.task.findMany({
          where: {
            taskType: "MEDICATION",
            status: "DONE",
            updatedAt: { gte: today, lt: tomorrow },
          },
          include: { taskMeds: { include: { medicationItem: true } } },
        }),
        // Today's tracker task
        prisma.task.findFirst({
          where: {
            taskType: "TRACKER",
            dueDate: { gte: today, lt: tomorrow },
          },
        }),
      ]);

    // Build daily entries and calculate TDEE
    const dailyEntries = buildDailyEntries(weights, nutritionLogs);
    const tdee = calculateAdaptiveTDEE(
      dailyEntries,
      profile,
      goal,
      units.weight,
    );

    // Aggregate today's nutrition
    const todayNutritionTotals = todayNutrition.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        fiber: acc.fiber + log.fiber,
        sugar: acc.sugar + log.sugar,
        sodium: acc.sodium + log.sodium,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
    );

    // Today's medications list
    const todayMedications = todayMedTasks.flatMap((t) =>
      t.taskMeds.map((tm) => ({
        name: tm.medicationItem.name,
        dosage: tm.dosage,
      })),
    );

    return NextResponse.json({
      tdee,
      todayMetrics,
      todayNutrition: todayNutritionTotals,
      todayMedications,
      trackerTask,
      dailyEntries,
    });
  } catch (error) {
    console.error("Failed to fetch tracker data:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracker data" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tracker
 *
 * Saves today's tracker data (weight, body fat, measurements).
 * Also marks the tracker task as DONE if provided.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { metrics, taskId, manualCalories } = body as {
      metrics: { type: string; value: number; unit: string }[];
      taskId?: string;
      manualCalories?: number;
    };

    const now = new Date();

    // Save each metric as a BodyMetric entry
    const created = [];
    for (const m of metrics) {
      if (m.value !== null && m.value !== undefined) {
        const entry = await prisma.bodyMetric.create({
          data: {
            date: now,
            type: m.type as "WEIGHT" | "BODY_FAT" | "WAIST" | "CHEST" | "HEIGHT" | "BMI",
            value: m.value,
            unit: m.unit || "",
          },
        });
        created.push(entry);
      }
    }

    // If manual calories provided, create a nutrition log entry
    if (manualCalories && taskId) {
      await prisma.nutritionLog.create({
        data: {
          date: now,
          taskId,
          calories: manualCalories,
        },
      });
    }

    // Mark tracker task as DONE
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "DONE" },
      });
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error("Failed to save tracker data:", error);
    return NextResponse.json(
      { error: "Failed to save tracker data" },
      { status: 500 },
    );
  }
}
