import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Given a recurring parent task, generate missing instances for the next `daysAhead` days.
 * Skips dates that already have an instance (checked via parentTaskId + dueDate).
 */
export async function generateInstances(daysAhead = 14) {
  const parents = await prisma.task.findMany({
    where: { isRecurringParent: true },
  });

  if (parents.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Get all existing instances in the window for all parents at once
  const existingInstances = await prisma.task.findMany({
    where: {
      parentTaskId: { in: parents.map((p) => p.id) },
      dueDate: { gte: today, lte: endDate },
    },
    select: { parentTaskId: true, dueDate: true },
  });

  // Build a set of "parentId|date" for quick lookup
  const existingSet = new Set(
    existingInstances.map(
      (i) => `${i.parentTaskId}|${i.dueDate!.toISOString().slice(0, 10)}`,
    ),
  );

  const toCreate: Prisma.TaskCreateManyInput[] = [];

  for (const parent of parents) {
    const dates = getOccurrences(
      parent.recurrence,
      parent.recurrenceDays,
      today,
      endDate,
    );

    for (const date of dates) {
      const key = `${parent.id}|${date.toISOString().slice(0, 10)}`;
      if (existingSet.has(key)) continue;

      // Apply recurrenceTime to the date
      if (parent.recurrenceTime) {
        const [h, m] = parent.recurrenceTime.split(":").map(Number);
        date.setHours(h || 0, m || 0, 0, 0);
      }

      toCreate.push({
        title: parent.title,
        description: parent.description,
        priority: parent.priority,
        status: "TODO",
        dueDate: date,
        recurrence: parent.recurrence,
        taskType: parent.taskType,
        mealType: parent.mealType,
        isHabit: parent.isHabit,
        parentTaskId: parent.id,
        recurrenceTime: parent.recurrenceTime,
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.task.createMany({ data: toCreate });
  }
}

/**
 * Calculate all occurrence dates between `start` and `end` for a given recurrence pattern.
 */
function getOccurrences(
  recurrence: string,
  recurrenceDays: string,
  start: Date,
  end: Date,
): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);

  switch (recurrence) {
    case "DAILY":
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      break;

    case "WEEKLY": {
      const daySet = new Set(
        recurrenceDays
          .toLowerCase()
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      );
      while (current <= end) {
        const dayName = DAY_NAMES[current.getDay()];
        if (daySet.has(dayName)) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case "MONTHLY": {
      const monthDays = recurrenceDays
        .split(",")
        .map((d) => parseInt(d.trim()))
        .filter((n) => !isNaN(n));
      while (current <= end) {
        if (monthDays.includes(current.getDate())) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
      break;
    }
  }

  return dates;
}
