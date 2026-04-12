import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateUpdateInput } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: { sortOrder: "asc" } },
        taskFoods: { include: { foodItem: true } },
        taskMeds: { include: { medicationItem: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { valid, errors, parsed } = validateUpdateInput(body);

    if (!valid || !parsed) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.description !== undefined) data.description = parsed.description;
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.priority !== undefined) data.priority = parsed.priority;
    if (parsed.dueDate !== undefined) {
      data.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
    }
    if (body.recurrence !== undefined) data.recurrence = body.recurrence;
    if (body.taskType !== undefined) data.taskType = body.taskType;
    if (body.mealType !== undefined) data.mealType = body.mealType;

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    // When a MEAL task is marked DONE, log its nutrition
    if (
      parsed.status === "DONE" &&
      existing.status !== "DONE" &&
      existing.taskType === "MEAL"
    ) {
      const taskFoods = await prisma.taskFood.findMany({
        where: { taskId: id },
        include: { foodItem: true },
      });

      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        vitaminA: 0,
        vitaminC: 0,
        vitaminD: 0,
        calcium: 0,
        iron: 0,
        potassium: 0,
      };

      for (const tf of taskFoods) {
        const q = tf.quantity;
        totals.calories += tf.foodItem.calories * q;
        totals.protein += tf.foodItem.protein * q;
        totals.carbs += tf.foodItem.carbs * q;
        totals.fat += tf.foodItem.fat * q;
        totals.fiber += tf.foodItem.fiber * q;
        totals.sugar += tf.foodItem.sugar * q;
        totals.sodium += tf.foodItem.sodium * q;
        totals.vitaminA += tf.foodItem.vitaminA * q;
        totals.vitaminC += tf.foodItem.vitaminC * q;
        totals.vitaminD += tf.foodItem.vitaminD * q;
        totals.calcium += tf.foodItem.calcium * q;
        totals.iron += tf.foodItem.iron * q;
        totals.potassium += tf.foodItem.potassium * q;
      }

      await prisma.nutritionLog.create({
        data: {
          date: new Date(),
          taskId: id,
          ...totals,
        },
      });
    }

    // Auto-create next occurrence for recurring tasks marked DONE
    if (
      parsed.status === "DONE" &&
      existing.status !== "DONE" &&
      existing.recurrence !== "NONE" &&
      existing.dueDate
    ) {
      const nextDue = new Date(existing.dueDate);
      switch (existing.recurrence) {
        case "DAILY":
          nextDue.setDate(nextDue.getDate() + 1);
          break;
        case "WEEKLY":
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case "MONTHLY":
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
      }

      await prisma.task.create({
        data: {
          title: existing.title,
          description: existing.description,
          priority: existing.priority,
          dueDate: nextDue,
          recurrence: existing.recurrence,
          taskType: existing.taskType,
          mealType: existing.mealType,
          status: "TODO",
        },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.task.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
