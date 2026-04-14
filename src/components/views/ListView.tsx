"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import TrackerForm from "@/components/TrackerForm";
import { getDueStatus } from "@/components/TaskCard";
import type { TaskData } from "@/components/TaskCard";

type SortField = "title" | "status" | "priority" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_ORDER = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ListViewProps {
  tasks: TaskData[];
  onDelete: (id: string) => void;
  onTaskClick?: (id: string) => void;
  onRefresh?: () => void;
}

export default function ListView({
  tasks,
  onDelete,
  onTaskClick,
  onRefresh,
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteTarget, setDeleteTarget] = useState<TaskData | null>(null);

  // Separate tracker tasks from regular tasks
  const trackerTasks = tasks.filter((t) => t.taskType === "TRACKER");
  const regularTasks = tasks.filter((t) => t.taskType !== "TRACKER");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...regularTasks].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      case "status":
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "priority":
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case "dueDate": {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = aDate - bDate;
        break;
      }
      case "createdAt":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Find today's tracker task (the one due today or most recent)
  const todayTracker = trackerTasks.find((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    return (
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate()
    );
  });

  if (regularTasks.length === 0 && !todayTracker) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Create a new task to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Tracker task renders as a special card above the table */}
      {todayTracker && (
        <div className="mb-4">
          <TrackerForm
            taskId={todayTracker.id}
            taskStatus={todayTracker.status}
            onComplete={() => onRefresh?.()}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {(
                [
                  ["title", "Title"],
                  ["status", "Status"],
                  ["priority", "Priority"],
                  ["dueDate", "Due Date"],
                  ["createdAt", "Created"],
                ] as const
              ).map(([field, label]) => (
                <th key={field} className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400 uppercase hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {label}
                    {sortField === field && (
                      <span className="text-blue-600">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.map((task) => {
              const due = getDueStatus(task.dueDate);
              const showDue = task.status !== "DONE" ? due : null;
              const rowBg =
                showDue === "overdue"
                  ? "bg-red-50"
                  : showDue === "today"
                    ? "bg-amber-50"
                    : showDue === "soon"
                      ? "bg-yellow-50/50"
                      : "";

              return (
                <tr
                  key={task.id}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${rowBg}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onTaskClick ? onTaskClick(task.id) : undefined
                        }
                        className="text-left text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100"
                      >
                        {task.title}
                      </button>
                      {task.taskType === "MEAL" && (
                        <span className="inline-flex items-center rounded bg-green-100 px-1 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Meal
                        </span>
                      )}
                      {task.taskType === "MEDICATION" && (
                        <span className="inline-flex items-center rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Med
                        </span>
                      )}
                      {task.recurrence && task.recurrence !== "NONE" && (
                        <span
                          className="inline-flex items-center rounded bg-purple-100 px-1 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          title={`Repeats ${task.recurrence.toLowerCase()}`}
                        >
                          ↻{" "}
                          {task.recurrence.charAt(0) +
                            task.recurrence.slice(1).toLowerCase()}
                        </span>
                      )}
                      {task.recurrenceTime && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {task.recurrenceTime}
                        </span>
                      )}
                      {task.blockedBy &&
                        task.blockedBy.some(
                          (d) => d.blocker.status !== "DONE",
                        ) && (
                          <span
                            className="inline-flex items-center rounded bg-red-100 px-1 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            title={`Blocked by: ${task.blockedBy
                              .filter((d) => d.blocker.status !== "DONE")
                              .map((d) => d.blocker.title)
                              .join(", ")}`}
                          >
                            Blocked
                          </span>
                        )}
                    </div>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-gray-400 line-clamp-1 dark:text-gray-500">
                        {task.description}
                      </p>
                    )}
                    {task.taskFoods &&
                      task.taskFoods.length > 0 &&
                      (() => {
                        const totalCal = Math.round(
                          task.taskFoods.reduce(
                            (s, tf) => s + tf.foodItem.calories * tf.quantity,
                            0,
                          ),
                        );
                        const totalPro = Math.round(
                          task.taskFoods.reduce(
                            (s, tf) => s + tf.foodItem.protein * tf.quantity,
                            0,
                          ),
                        );
                        return (
                          <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                            {totalCal} cal · {totalPro}g protein ·{" "}
                            {task.taskFoods.length} food
                            {task.taskFoods.length !== 1 ? "s" : ""}
                          </p>
                        );
                      })()}
                    {task.taskMeds && task.taskMeds.length > 0 && (
                      <p className="mt-0.5 text-xs text-blue-500 dark:text-blue-400">
                        {task.taskMeds
                          .map((tm) => tm.medicationItem.name)
                          .join(", ")}
                      </p>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        {task.subtasks.filter((s) => s.done).length}/
                        {task.subtasks.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate ? (
                      <span
                        className={`text-sm ${
                          showDue === "overdue"
                            ? "font-medium text-red-600"
                            : showDue === "today"
                              ? "font-medium text-amber-600"
                              : showDue === "soon"
                                ? "text-yellow-600"
                                : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {showDue === "overdue"
                          ? "Overdue"
                          : showDue === "today"
                            ? "Today"
                            : formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300 dark:text-gray-600">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                    {formatDate(task.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="rounded p-1 text-gray-300 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={true}
          taskTitle={deleteTarget.title}
          onConfirm={() => {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
