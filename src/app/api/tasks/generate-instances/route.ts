import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateInstances } from "@/lib/recurrence";

/**
 * POST /api/tasks/generate-instances
 *
 * Ensures the tracker parent task exists (if tracker is enabled)
 * and generates recurring task instances for the next 14 days.
 *
 * Call once on app startup — NOT on every task list fetch.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-create tracker parent task if tracker is enabled and none exists
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    if (settings?.trackerEnabled !== false) {
      const existingTracker = await prisma.task.findFirst({
        where: { taskType: "TRACKER", isRecurringParent: true },
      });
      if (!existingTracker) {
        await prisma.task.create({
          data: {
            title: "Daily Log",
            description: "Log your daily metrics",
            status: "TODO",
            priority: "MEDIUM",
            recurrence: "DAILY",
            taskType: "TRACKER",
            isRecurringParent: true,
          },
        });
      }
    }

    // Generate recurring task instances for the next 14 days
    await generateInstances(14);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to generate instances:", error);
    return NextResponse.json(
      { error: "Failed to generate instances" },
      { status: 500 },
    );
  }
}
