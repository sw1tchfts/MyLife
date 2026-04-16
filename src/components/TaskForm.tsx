"use client";

import { useState } from "react";
import type { Status, Priority, Recurrence } from "@/generated/prisma/client";
import {
  input,
  label as labelCls,
  btnPrimary,
  btnSecondary,
  pillActive,
  pillInactive,
  hint,
} from "@/lib/styles";

type TaskType = "TASK" | "MEAL" | "MEDICATION" | "TRACKER";
type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface TaskFormData {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  recurrence: Recurrence;
  taskType: TaskType;
  mealType: MealType | null;
  isHabit: boolean;
  recurrenceDays: string;
  recurrenceTime: string;
}

interface TaskFormProps {
  initialData?: TaskFormData;
  onSubmit: (data: TaskFormData) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}

const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export default function TaskForm({
  initialData,
  onSubmit,
  submitLabel,
  onCancel,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>(
    initialData ?? {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      recurrence: "NONE",
      taskType: "TASK",
      mealType: null,
      isHabit: false,
      recurrenceDays: "",
      recurrenceTime: "",
    },
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isRecurring = formData.recurrence !== "NONE";

  const selectedDays = new Set(
    formData.recurrenceDays
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
  );

  const toggleDay = (day: string) => {
    const next = new Set(selectedDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setFormData({ ...formData, recurrenceDays: Array.from(next).join(",") });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (
      formData.recurrence === "WEEKLY" &&
      formData.recurrenceDays.trim() === ""
    ) {
      setError("Select at least one day for weekly recurrence");
      return;
    }
    if (
      formData.recurrence === "MONTHLY" &&
      formData.recurrenceDays.trim() === ""
    ) {
      setError("Enter at least one day of month");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const TYPE_COLORS: Record<string, { active: string; inactive: string }> = {
    gray: {
      active: "border-input-border bg-elevated text-body",
      inactive: `border px-3 py-1.5 text-sm font-medium ${pillInactive}`,
    },
    green: {
      active: "border-green-600 bg-success-soft text-success-text",
      inactive: `border px-3 py-1.5 text-sm font-medium ${pillInactive}`,
    },
    blue: {
      active: `border-accent ${pillActive}`,
      inactive: `border px-3 py-1.5 text-sm font-medium ${pillInactive}`,
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger-text">
          {error}
        </div>
      )}

      {/* Task type selector */}
      <div>
        <label className={labelCls}>Type</label>
        <div className="mt-1 flex gap-2">
          {(
            [
              { value: "TASK", label: "Task", color: "gray" },
              { value: "MEAL", label: "Meal", color: "green" },
              { value: "MEDICATION", label: "Medication", color: "blue" },
            ] as const
          ).map((t) => {
            const colors = TYPE_COLORS[t.color];
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    taskType: t.value,
                    mealType: t.value === "MEAL" ? "LUNCH" : null,
                  })
                }
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  formData.taskType === t.value
                    ? colors.active
                    : colors.inactive
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meal type selector */}
      {formData.taskType === "MEAL" && (
        <div>
          <label htmlFor="mealType" className={labelCls}>
            Meal
          </label>
          <select
            id="mealType"
            value={formData.mealType || "LUNCH"}
            onChange={(e) =>
              setFormData({ ...formData, mealType: e.target.value as MealType })
            }
            className={input}
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACK">Snack</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelCls}>
          Title <span className="text-danger">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={input}
          placeholder={
            formData.taskType === "MEAL"
              ? "e.g. Meal 1: Chicken, Rice"
              : formData.taskType === "MEDICATION"
                ? "e.g. Morning vitamins"
                : "What needs to be done?"
          }
        />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className={input}
          placeholder="Add more details..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {!isRecurring && (
          <div>
            <label htmlFor="status" className={labelCls}>
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as Status })
              }
              className={input}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="priority" className={labelCls}>
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: e.target.value as Priority,
              })
            }
            className={input}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="recurrence" className={labelCls}>
            Repeat
          </label>
          <select
            id="recurrence"
            value={formData.recurrence}
            onChange={(e) =>
              setFormData({
                ...formData,
                recurrence: e.target.value as Recurrence,
                recurrenceDays:
                  e.target.value === "NONE" ? "" : formData.recurrenceDays,
                isHabit: e.target.value !== "NONE" ? formData.isHabit : false,
              })
            }
            className={input}
          >
            <option value="NONE">Never</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        {/* Due date — only for non-recurring tasks */}
        {!isRecurring && (
          <div>
            <label htmlFor="dueDate" className={labelCls}>
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className={input}
            />
          </div>
        )}
      </div>

      {/* Weekly day picker */}
      {formData.recurrence === "WEEKLY" && (
        <div>
          <label className={labelCls}>Days of Week</label>
          <div className="mt-1 flex gap-1">
            {WEEKDAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedDays.has(d.key)
                    ? "border-accent bg-accent text-white"
                    : pillInactive
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly day picker */}
      {formData.recurrence === "MONTHLY" && (
        <div>
          <label htmlFor="monthDays" className={labelCls}>
            Days of Month
          </label>
          <input
            id="monthDays"
            type="text"
            value={formData.recurrenceDays}
            onChange={(e) =>
              setFormData({ ...formData, recurrenceDays: e.target.value })
            }
            className={input}
            placeholder="e.g. 1,15 for the 1st and 15th"
          />
        </div>
      )}

      {/* Time of day for recurring */}
      {isRecurring && (
        <div>
          <label htmlFor="recurrenceTime" className={labelCls}>
            Time
          </label>
          <input
            id="recurrenceTime"
            type="time"
            value={formData.recurrenceTime}
            onChange={(e) =>
              setFormData({ ...formData, recurrenceTime: e.target.value })
            }
            className={input}
          />
          <p className={`mt-1 ${hint}`}>
            Optional — when this task should be done each day
          </p>
        </div>
      )}

      {/* Habit checkbox — show when recurring */}
      {isRecurring && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isHabit}
            onChange={(e) =>
              setFormData({ ...formData, isHabit: e.target.checked })
            }
            className="h-4 w-4 rounded border-input-border"
          />
          <span className="text-sm text-body">Track as habit on dashboard</span>
        </label>
      )}

      {formData.taskType !== "TASK" && (
        <p className={hint}>
          {formData.taskType === "MEAL"
            ? "Save the task first, then add foods from your library on the edit page."
            : "Save the task first, then add medications on the edit page."}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting} className={btnPrimary}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
