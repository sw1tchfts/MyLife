import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tasks/notifications
 *
 * Lightweight endpoint that returns just overdue and due-today task counts.
 * Used by TaskNotifications instead of fetching the full task list.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [overdue, dueToday] = await Promise.all([
      prisma.task.count({
        where: {
          status: { not: "DONE" },
          dueDate: { lt: todayStart },
          isRecurringParent: false,
        },
      }),
      prisma.task.count({
        where: {
          status: { not: "DONE" },
          dueDate: { gte: todayStart, lte: todayEnd },
          isRecurringParent: false,
        },
      }),
    ]);

    return NextResponse.json({ overdue, dueToday });
  } catch (error) {
    console.error("Failed to fetch notification counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification counts" },
      { status: 500 },
    );
  }
}
