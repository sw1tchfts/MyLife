"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import type { TaskData } from "@/components/TaskCard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface CalendarViewProps {
  tasks: TaskData[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskData[]> = {};
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = dateKey(new Date(task.dueDate));
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  // Calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const todayKey = dateKey(new Date());

  const prev = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const next = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(null);
  };

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Calendar grid */}
      <div className="flex-1">
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <button
              onClick={prev}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToday}
                className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Today
              </button>
            </div>
            <button
              onClick={next}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg
                className="h-5 w-5"
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
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-1 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div
                key={`pad-${i}`}
                className="h-24 border-b border-r border-gray-50 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-700/50"
              />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const key = dateKey(new Date(year, month, day));
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const dayTasks = tasksByDate[key] || [];
              const overdue = dayTasks.filter(
                (t) => t.status !== "DONE",
              ).length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`flex h-24 flex-col border-b border-r border-gray-100 p-1 text-left transition-colors hover:bg-blue-50/50 dark:border-gray-700 dark:hover:bg-blue-900/30 ${
                    isSelected
                      ? "bg-blue-50 ring-1 ring-inset ring-blue-300 dark:bg-blue-900/30 dark:ring-blue-700"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-blue-600 font-bold text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className={`block h-1.5 w-1.5 rounded-full ${
                            t.status === "DONE"
                              ? "bg-green-400"
                              : overdue > 0
                                ? "bg-red-400"
                                : "bg-blue-400"
                          }`}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[10px] leading-none text-gray-400 dark:text-gray-500">
                          +{dayTasks.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      <div className="w-full lg:w-72">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {selectedDate
              ? new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric" },
                )
              : "Select a date"}
          </h3>
          {selectedDate && selectedTasks.length === 0 && (
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              No tasks due this day
            </p>
          )}
          <div className="mt-3 space-y-2">
            {selectedTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}/edit`}
                className="block rounded-md border border-gray-100 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {task.title}
                </p>
                <div className="mt-1 flex gap-1">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
