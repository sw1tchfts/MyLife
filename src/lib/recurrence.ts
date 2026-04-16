import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Given a recurring parent task, generate missing instances for the next `daysAhead` days.
 * Skips dates that already have an instance (checked via parentTaskId + dueDate).
 * Copies food and medication associations from parent to instances.
 */
export async function generateInstances(daysAhead = 14) {
  const parents = await prisma.task.findMany({
    where: { isRecurringParent: true },
    include: {
      taskFoods: true,
      taskMeds: true,
    },
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

  // Track which parents need food/med copying
  const parentsNeedingCopy: {
    parentId: string;
    foods: { foodItemId: string; quantity: number }[];
    meds: { medicationItemId: string; dosage: string }[];
  }[] = [];

  const toCreate: Prisma.TaskCreateManyInput[] = [];

  for (const parent of parents) {
    const dates = getOccurrences(
      parent.recurrence,
      parent.recurrenceDays,
      today,
      endDate,
    );

    let createdForParent = false;

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
        recurrence: "NONE",
        taskType: parent.taskType,
        mealType: parent.mealType,
        isHabit: parent.isHabit,
        parentTaskId: parent.id,
        recurrenceTime: parent.recurrenceTime,
      });

      createdForParent = true;
    }

    // If we created new instances and the parent has food/med associations, queue for copying
    if (
      createdForParent &&
      (parent.taskFoods.length > 0 || parent.taskMeds.length > 0)
    ) {
      parentsNeedingCopy.push({
        parentId: parent.id,
        foods: parent.taskFoods.map((f) => ({
          foodItemId: f.foodItemId,
          quantity: f.quantity,
        })),
        meds: parent.taskMeds.map((m) => ({
          medicationItemId: m.medicationItemId,
          dosage: m.dosage,
        })),
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.task.createMany({ data: toCreate });

    // Copy food/med associations to newly created instances
    if (parentsNeedingCopy.length > 0) {
      await copyAssociationsToNewInstances(parentsNeedingCopy, today, endDate);
    }
  }
}

/**
 * Copy food and medication associations from parents to their newly created instances
 * that don't yet have associations.
 */
async function copyAssociationsToNewInstances(
  parents: {
    parentId: string;
    foods: { foodItemId: string; quantity: number }[];
    meds: { medicationItemId: string; dosage: string }[];
  }[],
  from: Date,
  to: Date,
) {
  // Single batched query for ALL parents' instances (avoids N+1)
  const allInstances = await prisma.task.findMany({
    where: {
      parentTaskId: { in: parents.map((p) => p.parentId) },
      dueDate: { gte: from, lte: to },
    },
    include: {
      taskFoods: { select: { id: true } },
      taskMeds: { select: { id: true } },
    },
  });

  // Group by parentTaskId
  const instancesByParent = new Map<string, typeof allInstances>();
  for (const instance of allInstances) {
    const key = instance.parentTaskId!;
    const list = instancesByParent.get(key) ?? [];
    list.push(instance);
    instancesByParent.set(key, list);
  }

  const foodsToCreate: Prisma.TaskFoodCreateManyInput[] = [];
  const medsToCreate: Prisma.TaskMedicationCreateManyInput[] = [];

  for (const parent of parents) {
    const instances = instancesByParent.get(parent.parentId) ?? [];
    for (const instance of instances) {
      if (instance.taskFoods.length === 0 && parent.foods.length > 0) {
        for (const food of parent.foods) {
          foodsToCreate.push({
            taskId: instance.id,
            foodItemId: food.foodItemId,
            quantity: food.quantity,
          });
        }
      }
      if (instance.taskMeds.length === 0 && parent.meds.length > 0) {
        for (const med of parent.meds) {
          medsToCreate.push({
            taskId: instance.id,
            medicationItemId: med.medicationItemId,
            dosage: med.dosage,
          });
        }
      }
    }
  }

  // Two bulk inserts instead of 2N
  const writes: Promise<unknown>[] = [];
  if (foodsToCreate.length > 0) {
    writes.push(prisma.taskFood.createMany({ data: foodsToCreate }));
  }
  if (medsToCreate.length > 0) {
    writes.push(prisma.taskMedication.createMany({ data: medsToCreate }));
  }
  await Promise.all(writes);
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
