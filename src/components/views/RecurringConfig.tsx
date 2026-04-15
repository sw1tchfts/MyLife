"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  inputSm,
  select,
  btnPrimary,
  btnSecondary,
  badgeSm,
  emptyState,
  pillActive,
  pillInactive,
} from "@/lib/styles";

interface RecurringTask {
  id: string;
  title: string;
  description: string;
  recurrence: string;
  recurrenceDays: string;
  recurrenceTime: string;
  taskType: string;
  mealType: string | null;
  isHabit: boolean;
  priority: string;
  createdAt: string;
}

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Every day",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  TASK: {
    label: "Task",
    cls: "bg-elevated text-body",
  },
  MEAL: {
    label: "Meal",
    cls: "bg-success-soft text-success-text",
  },
  MEDICATION: {
    label: "Med",
    cls: "bg-accent-soft text-accent-text",
  },
  TRACKER: {
    label: "Tracker",
    cls: "bg-info-soft text-info-text",
  },
};

function describeSchedule(task: RecurringTask): string {
  if (task.recurrence === "DAILY") {
    return task.recurrenceTime
      ? `Every day at ${task.recurrenceTime}`
      : "Every day";
  }
  if (task.recurrence === "WEEKLY") {
    const days = task.recurrenceDays
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean)
      .map((d) => WEEKDAY_LABELS[d] || d);
    const time = task.recurrenceTime ? ` at ${task.recurrenceTime}` : "";
    return days.length > 0
      ? `Every ${days.join(", ")}${time}`
      : `Weekly${time} (no days selected)`;
  }
  if (task.recurrence === "MONTHLY") {
    const days = task.recurrenceDays
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const time = task.recurrenceTime ? ` at ${task.recurrenceTime}` : "";
    return days.length > 0
      ? `Monthly on the ${days.map(ordinal).join(", ")}${time}`
      : `Monthly${time} (no days selected)`;
  }
  return task.recurrence;
}

function ordinal(n: string): string {
  const num = parseInt(n);
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function RecurringConfig() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<RecurringTask | null>(null);

  // Inline create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createRecurrence, setCreateRecurrence] = useState<string>("DAILY");
  const [createDays, setCreateDays] = useState("");
  const [createTime, setCreateTime] = useState("");
  const [createType, setCreateType] = useState("TASK");
  const [createPriority, setCreatePriority] = useState("MEDIUM");
  const [saving, setSaving] = useState(false);

  const fetchRecurring = useCallback(() => {
    fetch("/api/tasks?includeParents=true")
      .then((r) => r.json())
      .then((data) => {
        setTasks(
          data.filter(
            (t: RecurringTask & { isRecurringParent: boolean }) =>
              t.isRecurringParent,
          ),
        );
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const handleDelete = (task: RecurringTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    showToast({
      message: `Deleted "${task.title}"`,
      onUndo: () => setTasks((prev) => [...prev, task]),
      onExpire: () => {
        fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      },
    });
  };

  const handleCreate = async () => {
    if (!createTitle.trim()) return;
    setSaving(true);

    // Validate weekly days
    if (createRecurrence === "WEEKLY" && !createDays.trim()) {
      setSaving(false);
      return;
    }

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: createTitle.trim(),
        recurrence: createRecurrence,
        recurrenceDays: createDays,
        recurrenceTime: createTime,
        taskType: createType,
        priority: createPriority,
      }),
    });

    setCreateTitle("");
    setCreateDays("");
    setCreateTime("");
    setShowCreate(false);
    setSaving(false);
    fetchRecurring();
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    await fetch(`/api/tasks/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTarget.title,
        recurrenceDays: editTarget.recurrenceDays,
        recurrenceTime: editTarget.recurrenceTime,
        priority: editTarget.priority,
      }),
    });
    setSaving(false);
    setEditTarget(null);
    fetchRecurring();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Manage your repeating tasks, meals, and medications
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className={`${btnPrimary} inline-flex items-center shadow-sm`}
        >
          + New Recurring
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="mt-4 rounded-lg border border-accent bg-accent-soft/30 p-4">
          <h3 className="text-sm font-semibold text-heading">
            New Recurring Task
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted">
                Title
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g. Take Vitamins"
                className={inputSm}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Frequency
              </label>
              <select
                value={createRecurrence}
                onChange={(e) => {
                  setCreateRecurrence(e.target.value);
                  setCreateDays("");
                }}
                className={select}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Type
              </label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                className={select}
              >
                <option value="TASK">Task</option>
                <option value="MEAL">Meal</option>
                <option value="MEDICATION">Medication</option>
              </select>
            </div>
            {createRecurrence === "WEEKLY" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted">
                  Days
                </label>
                <div className="mt-1 flex gap-1">
                  {WEEKDAYS.map((day) => {
                    const active = createDays
                      .toLowerCase()
                      .split(",")
                      .map((d) => d.trim())
                      .includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const current = createDays
                            .toLowerCase()
                            .split(",")
                            .map((d) => d.trim())
                            .filter(Boolean);
                          const next = active
                            ? current.filter((d) => d !== day)
                            : [...current, day];
                          setCreateDays(next.join(","));
                        }}
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${
                          active
                            ? "border-accent bg-accent text-white"
                            : `${pillInactive}`
                        }`}
                      >
                        {WEEKDAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {createRecurrence === "MONTHLY" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted">
                  Days of month (comma-separated)
                </label>
                <input
                  type="text"
                  value={createDays}
                  onChange={(e) => setCreateDays(e.target.value)}
                  placeholder="1, 15"
                  className={inputSm}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted">
                Time (optional)
              </label>
              <input
                type="time"
                value={createTime}
                onChange={(e) => setCreateTime(e.target.value)}
                className={inputSm}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Priority
              </label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value)}
                className={select}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={
                saving ||
                !createTitle.trim() ||
                (createRecurrence === "WEEKLY" && !createDays.trim())
              }
              className={btnPrimary}
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Recurring tasks list */}
      {tasks.length === 0 && !showCreate ? (
        <div className={`mt-8 ${emptyState}`}>
          <p className="text-muted">
            No recurring tasks yet
          </p>
          <p className="mt-1 text-sm text-faint">
            Create one to get started
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {tasks.map((task) => {
            const badge = TYPE_BADGES[task.taskType] || TYPE_BADGES.TASK;
            const isEditing = editTarget?.id === task.id;

            return (
              <div
                key={task.id}
                className={`rounded-lg border bg-card p-4 ${
                  isEditing
                    ? "border-accent"
                    : "border-border"
                }`}
              >
                {isEditing ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTarget.title}
                      onChange={(e) =>
                        setEditTarget({ ...editTarget, title: e.target.value })
                      }
                      className={`${inputSm} font-medium`}
                    />
                    <div className="flex flex-wrap gap-3">
                      {task.recurrence === "WEEKLY" && (
                        <div>
                          <label className="block text-xs text-muted">
                            Days
                          </label>
                          <div className="mt-1 flex gap-1">
                            {WEEKDAYS.map((day) => {
                              const active = editTarget.recurrenceDays
                                .toLowerCase()
                                .split(",")
                                .map((d) => d.trim())
                                .includes(day);
                              return (
                                <button
                                  key={day}
                                  onClick={() => {
                                    const current = editTarget.recurrenceDays
                                      .toLowerCase()
                                      .split(",")
                                      .map((d) => d.trim())
                                      .filter(Boolean);
                                    const next = active
                                      ? current.filter((d) => d !== day)
                                      : [...current, day];
                                    setEditTarget({
                                      ...editTarget,
                                      recurrenceDays: next.join(","),
                                    });
                                  }}
                                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                    active
                                      ? "border-accent bg-accent text-white"
                                      : `${pillInactive}`
                                  }`}
                                >
                                  {WEEKDAY_LABELS[day]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {task.recurrence === "MONTHLY" && (
                        <div>
                          <label className="block text-xs text-muted">
                            Days of month
                          </label>
                          <input
                            type="text"
                            value={editTarget.recurrenceDays}
                            onChange={(e) =>
                              setEditTarget({
                                ...editTarget,
                                recurrenceDays: e.target.value,
                              })
                            }
                            className={`${inputSm} w-40`}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-muted">
                          Time
                        </label>
                        <input
                          type="time"
                          value={editTarget.recurrenceTime}
                          onChange={(e) =>
                            setEditTarget({
                              ...editTarget,
                              recurrenceTime: e.target.value,
                            })
                          }
                          className={inputSm}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted">
                          Priority
                        </label>
                        <select
                          value={editTarget.priority}
                          onChange={(e) =>
                            setEditTarget({
                              ...editTarget,
                              priority: e.target.value,
                            })
                          }
                          className={select}
                        >
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditTarget(null)}
                        className={btnSecondary}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        disabled={saving}
                        className={btnPrimary}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-heading">
                          {task.title}
                        </h3>
                        <span
                          className={`inline-flex rounded px-1 py-0.5 text-[10px] font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="inline-flex rounded bg-purple-soft px-1 py-0.5 text-[10px] font-medium text-purple-text">
                          ↻{" "}
                          {RECURRENCE_LABELS[task.recurrence] ||
                            task.recurrence}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {describeSchedule(task)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditTarget({ ...task })}
                        className="rounded p-1.5 text-muted hover:bg-elevated hover:text-body"
                        title="Edit"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
