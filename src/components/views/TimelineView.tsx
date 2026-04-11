"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TaskData } from "@/components/TaskCard";

type Range = "week" | "2week" | "month";

const RANGE_DAYS: Record<Range, number> = { week: 7, "2week": 14, month: 30 };
const RANGE_LABELS: Record<Range, string> = {
  week: "7 days",
  "2week": "14 days",
  month: "30 days",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-green-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "border-l-red-500",
  MEDIUM: "border-l-yellow-500",
  LOW: "border-l-gray-300",
};

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TimelineViewProps {
  tasks: TaskData[];
}

export default function TimelineView({ tasks }: TimelineViewProps) {
  const [range, setRange] = useState<Range>("2week");
  const [offset, setOffset] = useState(0); // days offset from today

  const totalDays = RANGE_DAYS[range];
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [offset]);

  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + totalDays);
    return d;
  }, [startDate, totalDays]);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startDate, totalDays]);

  const todayStr = new Date().toDateString();

  // Filter tasks that have due dates within range, or are overdue
  const timelineTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate)
      .map((t) => ({
        ...t,
        dueMs: new Date(t.dueDate!).getTime(),
      }))
      .sort((a, b) => a.dueMs - b.dueMs);
  }, [tasks]);

  // Group: overdue (before range), in-range, future (after range)
  const overdueTasks = timelineTasks.filter(
    (t) => t.dueMs < startDate.getTime() && t.status !== "DONE",
  );
  const rangeTasks = timelineTasks.filter(
    (t) => t.dueMs >= startDate.getTime() && t.dueMs < endDate.getTime(),
  );

  const getPosition = (dueMs: number): number => {
    const rangeMs = endDate.getTime() - startDate.getTime();
    return ((dueMs - startDate.getTime()) / rangeMs) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o - RANGE_DAYS[range])}
            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Back
          </button>
          <button
            onClick={() => setOffset(0)}
            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Today
          </button>
          <button
            onClick={() => setOffset((o) => o + RANGE_DAYS[range])}
            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Forward →
          </button>
        </div>
        <div className="flex gap-1">
          {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2 py-1 text-xs ${
                range === r
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3">
          <p className="mb-2 text-xs font-semibold text-red-600 uppercase">
            Overdue ({overdueTasks.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {overdueTasks.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}/edit`}
                className="rounded border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Date headers */}
        <div className="relative flex border-b border-gray-200 dark:border-gray-700">
          {days.map((d, i) => {
            const isToday = d.toDateString() === todayStr;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={i}
                className={`flex-1 border-r border-gray-100 dark:border-gray-700 px-0.5 py-2 text-center last:border-r-0 ${isWeekend ? "bg-gray-50 dark:bg-gray-700" : ""}`}
              >
                <span
                  className={`block text-[10px] leading-tight ${isToday ? "font-bold text-blue-600" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className={`block text-xs ${isToday ? "font-bold text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Task rows */}
        {rangeTasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            No tasks with due dates in this range
          </div>
        ) : (
          <div className="relative min-h-[200px] p-4">
            {/* Today marker */}
            {offset <= 0 && offset + totalDays > 0 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-50"
                style={{
                  left: `${getPosition(new Date(todayStr).getTime())}%`,
                }}
              />
            )}

            <div className="space-y-2">
              {rangeTasks.map((task) => {
                const pos = Math.max(0, Math.min(95, getPosition(task.dueMs)));
                return (
                  <div key={task.id} className="relative h-8">
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      className={`absolute flex h-8 items-center rounded border-l-4 bg-white dark:bg-gray-800 px-2 shadow-sm transition-shadow hover:shadow-md ${PRIORITY_COLORS[task.priority]}`}
                      style={{
                        left: `${Math.max(0, pos - 10)}%`,
                        maxWidth: "200px",
                      }}
                      title={`${task.title} — due ${formatShortDate(new Date(task.dueDate!))}`}
                    >
                      <span
                        className={`mr-2 h-2 w-2 rounded-full ${STATUS_COLORS[task.status]}`}
                      />
                      <span className="truncate text-xs text-gray-700 dark:text-gray-300">
                        {task.title}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400" /> To Do
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Done
        </span>
        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-1 rounded bg-red-500" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-1 rounded bg-yellow-500" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-1 rounded bg-gray-300" /> Low
        </span>
      </div>
    </div>
  );
}
