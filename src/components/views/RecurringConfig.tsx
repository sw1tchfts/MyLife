"use client";

import { useEffect, useState, useCallback } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

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
    cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  },
  MEAL: {
    label: "Meal",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  MEDICATION: {
    label: "Med",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  TRACKER: {
    label: "Tracker",
    cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
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
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTask | null>(null);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/tasks/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchRecurring();
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
        <p className="text-gray-400 dark:text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your repeating tasks, meals, and medications
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Recurring
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            New Recurring Task
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Title
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g. Take Vitamins"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Frequency
              </label>
              <select
                value={createRecurrence}
                onChange={(e) => {
                  setCreateRecurrence(e.target.value);
                  setCreateDays("");
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Type
              </label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="TASK">Task</option>
                <option value="MEAL">Meal</option>
                <option value="MEDICATION">Medication</option>
              </select>
            </div>
            {createRecurrence === "WEEKLY" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
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
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
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
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Days of month (comma-separated)
                </label>
                <input
                  type="text"
                  value={createDays}
                  onChange={(e) => setCreateDays(e.target.value)}
                  placeholder="1, 15"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Time (optional)
              </label>
              <input
                type="time"
                value={createTime}
                onChange={(e) => setCreateTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Priority
              </label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Recurring tasks list */}
      {tasks.length === 0 && !showCreate ? (
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No recurring tasks yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
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
                className={`rounded-lg border bg-white p-4 dark:bg-gray-800 ${
                  isEditing
                    ? "border-blue-400 dark:border-blue-600"
                    : "border-gray-200 dark:border-gray-700"
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
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <div className="flex flex-wrap gap-3">
                      {task.recurrence === "WEEKLY" && (
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400">
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
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
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
                          <label className="block text-xs text-gray-500 dark:text-gray-400">
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
                            className="mt-1 w-40 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
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
                          className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
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
                          className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        disabled={saving}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {task.title}
                        </h3>
                        <span
                          className={`inline-flex rounded px-1 py-0.5 text-[10px] font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="inline-flex rounded bg-purple-100 px-1 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          ↻{" "}
                          {RECURRENCE_LABELS[task.recurrence] ||
                            task.recurrence}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {describeSchedule(task)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditTarget({ ...task })}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
                        onClick={() => setDeleteTarget(task)}
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

      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={true}
          taskTitle={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
