"use client";

import { useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { getDueStatus } from "@/components/TaskCard";
import type { TaskData } from "@/components/TaskCard";

interface DashboardViewProps {
  tasks: TaskData[];
}

export default function DashboardView({ tasks }: DashboardViewProps) {
  const stats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === "TODO").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const overdue = tasks.filter(
      (t) => t.status !== "DONE" && getDueStatus(t.dueDate) === "overdue",
    ).length;
    const dueToday = tasks.filter(
      (t) => t.status !== "DONE" && getDueStatus(t.dueDate) === "today",
    ).length;
    const dueSoon = tasks.filter(
      (t) => t.status !== "DONE" && getDueStatus(t.dueDate) === "soon",
    ).length;
    const high = tasks.filter(
      (t) => t.status !== "DONE" && t.priority === "HIGH",
    ).length;
    const noDueDate = tasks.filter(
      (t) => t.status !== "DONE" && !t.dueDate,
    ).length;

    return {
      todo,
      inProgress,
      done,
      overdue,
      dueToday,
      dueSoon,
      high,
      noDueDate,
      total: tasks.length,
    };
  }, [tasks]);

  const completionPct =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const upcomingTasks = tasks
    .filter((t) => t.status !== "DONE" && t.dueDate)
    .sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="To Do" value={stats.todo} color="text-gray-600" />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          color="text-blue-600"
        />
        <StatCard label="Done" value={stats.done} color="text-green-600" />
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.overdue > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/30">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-red-500">Overdue</p>
          </div>
        )}
        {stats.dueToday > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/30">
            <p className="text-2xl font-bold text-amber-600">
              {stats.dueToday}
            </p>
            <p className="text-xs text-amber-500">Due Today</p>
          </div>
        )}
        {stats.dueSoon > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/30">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.dueSoon}
            </p>
            <p className="text-xs text-yellow-500">Due Soon</p>
          </div>
        )}
        {stats.high > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-900/30">
            <p className="text-2xl font-bold text-red-600">{stats.high}</p>
            <p className="text-xs text-red-400">High Priority</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Completion
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {completionPct}%
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>
            {stats.done} done / {stats.total} total
          </span>
          {stats.noDueDate > 0 && (
            <span>{stats.noDueDate} without due date</span>
          )}
        </div>
      </div>

      {/* Status breakdown bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Status Breakdown
        </p>
        {stats.total > 0 ? (
          <div className="flex h-6 overflow-hidden rounded-full">
            {stats.done > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(stats.done / stats.total) * 100}%` }}
                title={`Done: ${stats.done}`}
              />
            )}
            {stats.inProgress > 0 && (
              <div
                className="bg-blue-500"
                style={{
                  width: `${(stats.inProgress / stats.total) * 100}%`,
                }}
                title={`In Progress: ${stats.inProgress}`}
              />
            )}
            {stats.todo > 0 && (
              <div
                className="bg-gray-300"
                style={{ width: `${(stats.todo / stats.total) * 100}%` }}
                title={`To Do: ${stats.todo}`}
              />
            )}
          </div>
        ) : (
          <div className="h-6 rounded-full bg-gray-100 dark:bg-gray-700" />
        )}
        <div className="mt-2 flex gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Done (
            {stats.done})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> In Progress (
            {stats.inProgress})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-300" /> To Do (
            {stats.todo})
          </span>
        </div>
      </div>

      {/* Two column: recent + upcoming */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recently created */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Recently Created
          </p>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No tasks yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}/edit`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {task.title}
                  </span>
                  <StatusBadge status={task.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming due dates */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Upcoming Due
          </p>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No upcoming tasks with due dates
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const due = getDueStatus(task.dueDate);
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}/edit`}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {task.title}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${
                        due === "overdue"
                          ? "font-medium text-red-600"
                          : due === "today"
                            ? "font-medium text-amber-600"
                            : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {due === "overdue"
                        ? "Overdue"
                        : due === "today"
                          ? "Today"
                          : new Date(task.dueDate!).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-gray-900 dark:text-gray-100",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}
