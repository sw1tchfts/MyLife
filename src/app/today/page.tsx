"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { TaskData } from "@/components/TaskCard";
import TrackerForm from "@/components/TrackerForm";

type TaskGroup = "overdue" | "today" | "upcoming";

const GROUP_META: Record<
  TaskGroup,
  { label: string; color: string; emptyMsg: string }
> = {
  overdue: {
    label: "Overdue",
    color:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
    emptyMsg: "Nothing overdue",
  },
  today: {
    label: "Due Today",
    color:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
    emptyMsg: "No tasks due today",
  },
  upcoming: {
    label: "Coming Up (Next 3 Days)",
    color:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    emptyMsg: "Nothing coming up",
  },
};

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const upcomingEnd = new Date(todayStart);
  upcomingEnd.setDate(upcomingEnd.getDate() + 4); // next 3 days beyond today

  // Categorize tasks
  const overdue: TaskData[] = [];
  const today: TaskData[] = [];
  const upcoming: TaskData[] = [];
  let trackerTask: TaskData | null = null;

  for (const t of tasks) {
    if (t.status === "DONE") continue;
    if (!t.dueDate) continue;

    const due = new Date(t.dueDate);

    // Pull out today's tracker task separately
    if (t.taskType === "TRACKER" && due >= todayStart && due < todayEnd) {
      trackerTask = t;
      continue;
    }

    if (due < todayStart) {
      overdue.push(t);
    } else if (due < todayEnd) {
      today.push(t);
    } else if (due < upcomingEnd) {
      upcoming.push(t);
    }
  }

  // Sort each group by due date, then by priority
  const PRIO_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sortGroup = (a: TaskData, b: TaskData) => {
    const da = new Date(a.dueDate!).getTime();
    const db = new Date(b.dueDate!).getTime();
    if (da !== db) return da - db;
    return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority];
  };
  overdue.sort(sortGroup);
  today.sort(sortGroup);
  upcoming.sort(sortGroup);

  // Count completed today
  const completedToday = tasks.filter((t) => {
    if (t.status !== "DONE" || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due >= todayStart && due < todayEnd;
  });

  const handleStatusToggle = async (task: TaskData) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 dark:text-gray-500">Loading...</p>
      </div>
    );
  }

  const totalActive = overdue.length + today.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Today
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            {totalActive > 0 ? (
              <span>
                {totalActive} task{totalActive !== 1 ? "s" : ""} to do
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400">
                All clear!
              </span>
            )}
            {completedToday.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {" · "}
                {completedToday.length} done
              </span>
            )}
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          All Tasks
        </Link>
      </div>

      {/* Tracker card */}
      {trackerTask && (
        <div className="mt-4">
          <TrackerForm
            taskId={trackerTask.id}
            taskStatus={trackerTask.status}
            onComplete={fetchTasks}
          />
        </div>
      )}

      {/* Task groups */}
      <div className="mt-6 space-y-6">
        {(
          [
            ["overdue", overdue],
            ["today", today],
            ["upcoming", upcoming],
          ] as [TaskGroup, TaskData[]][]
        ).map(([key, groupTasks]) => {
          const meta = GROUP_META[key];
          return (
            <div key={key}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${meta.color}`}
                >
                  {meta.label}
                  {groupTasks.length > 0 && (
                    <span className="font-normal opacity-70">
                      ({groupTasks.length})
                    </span>
                  )}
                </span>
              </div>
              {groupTasks.length === 0 ? (
                <p className="py-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  {meta.emptyMsg}
                </p>
              ) : (
                <div className="space-y-1">
                  {groupTasks.map((task) => (
                    <TodayTaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => handleStatusToggle(task)}
                      showDate={key === "overdue" || key === "upcoming"}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed today (collapsible) */}
      {completedToday.length > 0 && (
        <CompletedSection tasks={completedToday} />
      )}
    </div>
  );
}

function TodayTaskRow({
  task,
  onToggle,
  showDate,
}: {
  task: TaskData;
  onToggle: () => void;
  showDate: boolean;
}) {
  const isDone = task.status === "DONE";
  const badge = TYPE_BADGES[task.taskType];
  const time = task.dueDate ? formatTime(task.dueDate) : "";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        isDone
          ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          isDone
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 hover:border-green-400 dark:border-gray-600"
        }`}
      >
        {isDone && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/tasks/${task.id}/edit`}
            className={`text-sm font-medium ${
              isDone
                ? "text-gray-400 line-through dark:text-gray-500"
                : "text-gray-900 hover:text-blue-600 dark:text-gray-100"
            }`}
          >
            {task.title}
          </Link>
          {badge && (
            <span
              className={`inline-flex rounded px-1 py-0.5 text-[10px] font-medium ${badge.cls}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        {/* Food/med details */}
        {task.taskFoods && task.taskFoods.length > 0 && (
          <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
            {Math.round(
              task.taskFoods.reduce(
                (s, tf) => s + tf.foodItem.calories * tf.quantity,
                0,
              ),
            )}{" "}
            cal · {task.taskFoods.length} food
            {task.taskFoods.length !== 1 ? "s" : ""}
          </p>
        )}
        {task.taskMeds && task.taskMeds.length > 0 && (
          <p className="mt-0.5 text-xs text-blue-500 dark:text-blue-400">
            {task.taskMeds.map((tm) => tm.medicationItem.name).join(", ")}
          </p>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <span>
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}{" "}
              subtasks
            </span>
          </div>
        )}
      </div>

      {/* Right side: time / date + priority + status */}
      <div className="flex shrink-0 items-center gap-2">
        {time && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {time}
          </span>
        )}
        {showDate && task.dueDate && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatShortDate(task.dueDate)}
          </span>
        )}
        <StatusBadge status={task.status} />
      </div>
    </div>
  );
}

function CompletedSection({ tasks }: { tasks: TaskData[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        {tasks.length} completed today
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500 text-white">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-sm text-gray-400 line-through dark:text-gray-500">
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
