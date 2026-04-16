"use client";

import { memo } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { card } from "@/lib/styles";
import type { Status, Priority } from "@/generated/prisma/client";

export interface SubtaskData {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
}

export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
export type TaskType = "TASK" | "MEAL" | "MEDICATION" | "TRACKER";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface FoodItemData {
  id: string;
  name: string;
  brand: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface TaskFoodData {
  id: string;
  foodItemId: string;
  quantity: number;
  foodItem: FoodItemData;
}

export interface MedicationItemData {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
}

export interface TaskMedData {
  id: string;
  medicationItemId: string;
  dosage: string;
  medicationItem: MedicationItemData;
}

export interface TaskDependencyData {
  id: string;
  blockerId: string;
  blocker: { id: string; title: string; status: Status };
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  recurrence: Recurrence;
  taskType: TaskType;
  mealType: MealType | null;
  isHabit: boolean;
  isRecurringParent: boolean;
  parentTaskId: string | null;
  recurrenceDays: string;
  recurrenceTime: string;
  createdAt: string;
  subtasks?: SubtaskData[];
  taskFoods?: TaskFoodData[];
  taskMeds?: TaskMedData[];
  blockedBy?: TaskDependencyData[];
}

interface TaskCardProps {
  task: TaskData;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDueStatus(
  dateStr: string | null,
): "overdue" | "today" | "soon" | null {
  if (!dateStr) return null;
  const today = new Date(new Date().toDateString());
  const due = new Date(new Date(dateStr).toDateString());
  const diffMs = due.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return null;
}

export default memo(function TaskCard({ task, onDelete }: TaskCardProps) {
  const dueStatus = task.status !== "DONE" ? getDueStatus(task.dueDate) : null;

  return (
    <>
      <div className={card}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-heading line-clamp-1">
            {task.title}
          </h3>
          <div className="flex shrink-0 gap-1">
            <Link
              href={`/tasks/${task.id}/edit`}
              className="rounded p-1 text-muted hover:bg-elevated hover:text-body"
              title="Edit task"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Link>
            <button
              onClick={() => onDelete(task.id)}
              className="rounded p-1 text-muted hover:bg-accent-soft hover:text-accent-text"
              title="Delete task"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {task.description && (
          <p className="mt-1 text-sm text-faint line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-muted">
              {dueStatus === "overdue"
                ? "Overdue"
                : dueStatus === "today"
                  ? "Due today"
                  : `Due ${formatDate(task.dueDate)}`}
            </span>
          )}
        </div>
      </div>
    </>
  );
});
