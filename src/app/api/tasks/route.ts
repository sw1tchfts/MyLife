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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.getAll("status") as Status[];
    const includeParents = searchParams.get("includeParents") === "true";
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const where: Record<string, unknown> = {};
    if (statusFilter.length > 0) where.status = { in: statusFilter };
    // By default, hide parent templates from the task list
    if (!includeParents) where.isRecurringParent = false;

    const include = {
      subtasks: { orderBy: { sortOrder: "asc" as const } },
      taskFoods: {
        include: {
          foodItem: {
            select: {
              id: true,
              name: true,
              calories: true,
              protein: true,
              servingSize: true,
              servingUnit: true,
            },
          },
        },
      },
      taskMeds: {
        include: {
          medicationItem: {
            select: { id: true, name: true, dosageForm: true },
          },
        },
      },
      blockedBy: {
        include: {
          blocker: { select: { id: true, title: true, status: true } },
        },
      },
    };

    // Paginate if limit is provided; otherwise return all (backward compatible)
    if (limitParam) {
      const limit = Math.min(parseInt(limitParam) || 50, 200);
      const page = Math.max(parseInt(pageParam ?? "1") || 1, 1);
      const skip = (page - 1) * limit;

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
        }),
        prisma.task.count({ where }),
      ]);

      return NextResponse.json({ tasks, total, page, limit });
    }

    const tasks = await prisma.task.findMany({
      where,
      include,
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
