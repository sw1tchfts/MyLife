import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCreateInput } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { generateInstances } from "@/lib/recurrence";
import type { Status } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
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

    // Auto-generate instances for recurring tasks
    await generateInstances(14);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.getAll("status") as Status[];
    const includeParents = searchParams.get("includeParents") === "true";

    const where: Record<string, unknown> = {};
    if (statusFilter.length > 0) where.status = { in: statusFilter };
    // By default, hide parent templates from the task list
    if (!includeParents) where.isRecurringParent = false;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: { orderBy: { sortOrder: "asc" } },
        taskFoods: { include: { foodItem: true } },
        taskMeds: { include: { medicationItem: true } },
        blockedBy: {
          include: {
            blocker: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { valid, errors, parsed } = validateCreateInput(body);

    if (!valid || !parsed) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const isRecurring = body.recurrence && body.recurrence !== "NONE";

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description ?? "",
        status: isRecurring ? "TODO" : (parsed.status ?? "TODO"),
        priority: parsed.priority ?? "MEDIUM",
        dueDate: isRecurring
          ? null
          : parsed.dueDate
            ? new Date(parsed.dueDate)
            : null,
        recurrence: body.recurrence ?? "NONE",
        taskType: body.taskType ?? "TASK",
        mealType: body.mealType ?? null,
        isHabit: body.isHabit ?? false,
        isRecurringParent: isRecurring,
        recurrenceDays: body.recurrenceDays ?? "",
        recurrenceTime: body.recurrenceTime ?? "",
      },
    });

    // If recurring, immediately generate instances
    if (isRecurring) {
      await generateInstances(14);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
