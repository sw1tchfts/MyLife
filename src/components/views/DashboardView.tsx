"use client";

import { useMemo, useState } from "react";
import type { TaskData } from "@/components/TaskCard";
import { panel, emptyState } from "@/lib/styles";

function calcStreak(completions: Set<string>): {
  current: number;
  longest: number;
} {
  if (completions.size === 0) return { current: 0, longest: 0 };
  const sorted = Array.from(completions).sort();
  let longest = 1;
  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 1;
    }
  }

  // Check if current streak is still active (last completion is today or yesterday)
  const lastDate = new Date(sorted[sorted.length - 1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays =
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  const current = diffDays <= 1 ? streak : 0;

  return { current, longest };
}

interface DashboardViewProps {
  tasks: TaskData[];
}

export default function DashboardView({ tasks }: DashboardViewProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // Group habit instances by parentTaskId (or own id for legacy)
  const habitMap = useMemo(() => {
    const map = new Map<
      string,
      {
        title: string;
        recurrence: string;
        recurrenceTime: string;
        completions: Set<string>;
      }
    >();

    for (const t of tasks) {
      if (!t.isHabit || !t.recurrence || t.recurrence === "NONE") continue;

      const key = t.parentTaskId || t.id;

      if (!map.has(key)) {
        map.set(key, {
          title: t.title,
          recurrence: t.recurrence,
          recurrenceTime: t.recurrenceTime || "",
          completions: new Set(),
        });
      }

      if (t.status === "DONE" && t.dueDate) {
        const d = t.dueDate.slice(0, 10);
        const dDate = new Date(d);
        if (dDate.getMonth() === month && dDate.getFullYear() === year) {
          map.get(key)!.completions.add(d);
        }
      }
    }

    return Array.from(map.values());
  }, [tasks, month, year]);

  // Derived values memoized to avoid recalculating on every re-render
  const {
    daysInMonth,
    monthName,
    dayLabels,
    totalCompleted,
    overallPct,
    weeks,
  } = useMemo(() => {
    const dim = new Date(year, month + 1, 0).getDate();
    const mn = new Date(year, month).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const dl: string[] = [];
    for (let d = 1; d <= dim; d++) {
      const date = new Date(year, month, d);
      dl.push(date.toLocaleDateString("en-US", { weekday: "narrow" }));
    }

    const tp = habitMap.reduce((sum, h) => {
      if (h.recurrence === "DAILY") return sum + dim;
      if (h.recurrence === "WEEKLY") return sum + Math.ceil(dim / 7);
      if (h.recurrence === "MONTHLY") return sum + 1;
      return sum;
    }, 0);
    const tc = habitMap.reduce((sum, h) => sum + h.completions.size, 0);
    const op = tp > 0 ? Math.round((tc / tp) * 100) : 0;

    const wk: { label: string; start: number; end: number }[] = [];
    for (let d = 1; d <= dim; ) {
      const start = d;
      const end = Math.min(d + 6, dim);
      wk.push({ label: `Week ${wk.length + 1}`, start, end });
      d = end + 1;
    }

    return {
      daysInMonth: dim,
      monthName: mn,
      dayLabels: dl,
      totalCompleted: tc,
      overallPct: op,
      weeks: wk,
    };
  }, [habitMap, month, year]);

  // Nav
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  if (habitMap.length === 0) {
    return (
      <div className={emptyState}>
        <p className="text-lg font-medium text-muted">No habits tracked yet</p>
        <p className="mt-2 text-sm text-faint">
          Create a recurring task and check &quot;Track as habit on
          dashboard&quot; to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: month nav + overall progress ring */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Month selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="rounded-md p-1.5 text-muted hover:bg-elevated"
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
          <h2 className="text-lg font-bold text-heading">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="rounded-md p-1.5 text-muted hover:bg-elevated"
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

        {/* Stats cards */}
        <div className="flex gap-3">
          <div className={`flex-1 p-3 text-center ${panel}`}>
            <p className="text-2xl font-bold text-heading">{habitMap.length}</p>
            <p className="text-xs text-muted">Habits</p>
          </div>
          <div className={`flex-1 p-3 text-center ${panel}`}>
            <p className="text-2xl font-bold text-success-text">
              {totalCompleted}
            </p>
            <p className="text-xs text-muted">Completed</p>
          </div>
        </div>

        {/* Completion ring */}
        <div className="flex items-center justify-center">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className="stroke-border"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className="stroke-success"
                strokeWidth="3"
                strokeDasharray={`${overallPct}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-heading">
                {overallPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly progress bars */}
      <div className={`p-4 ${panel}`}>
        <p className="mb-3 text-sm font-medium text-body">Weekly Progress</p>
        <div className="grid gap-2 sm:grid-cols-5">
          {weeks.map((week) => {
            const weekDays: string[] = [];
            for (let d = week.start; d <= week.end; d++) {
              weekDays.push(
                `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
              );
            }
            const weekTotal = habitMap.reduce(
              (s, h) => s + weekDays.filter((d) => h.completions.has(d)).length,
              0,
            );
            const weekPossible = habitMap.length * weekDays.length;
            const weekPct =
              weekPossible > 0
                ? Math.round((weekTotal / weekPossible) * 100)
                : 0;

            return (
              <div key={week.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted">{week.label}</span>
                  <span className="font-medium text-heading">{weekPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${weekPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit grid — daily completions */}
      <div className={`overflow-x-auto p-4 ${panel}`}>
        <p className="mb-3 text-sm font-medium text-body">Daily Habits</p>
        <div className="min-w-[600px]">
          {/* Day numbers header */}
          <div className="mb-1 flex">
            <div className="w-32 shrink-0" />
            {Array.from({ length: daysInMonth }, (_, i) => (
              <div key={i} className="flex w-7 shrink-0 flex-col items-center">
                <span className="text-[9px] text-muted">{dayLabels[i]}</span>
                <span className="text-[10px] text-muted">{i + 1}</span>
              </div>
            ))}
            <div className="ml-2 w-16 shrink-0 text-center text-[10px] font-medium text-muted">
              Rate
            </div>
          </div>

          {/* Habit rows */}
          {habitMap.map((habit) => {
            const pct =
              daysInMonth > 0
                ? Math.round((habit.completions.size / daysInMonth) * 100)
                : 0;

            return (
              <div key={habit.title} className="flex items-center py-0.5">
                <div
                  className="w-32 shrink-0 truncate pr-2 text-xs font-medium text-body"
                  title={habit.title}
                >
                  {habit.title}
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                  const done = habit.completions.has(dayStr);
                  const isToday =
                    i + 1 === now.getDate() &&
                    month === now.getMonth() &&
                    year === now.getFullYear();

                  return (
                    <div
                      key={i}
                      className={`flex h-5 w-7 shrink-0 items-center justify-center ${isToday ? "rounded ring-1 ring-accent-text" : ""}`}
                    >
                      {done ? (
                        <div className="h-4 w-4 rounded-sm bg-success" />
                      ) : (
                        <div className="h-4 w-4 rounded-sm border border-input-border" />
                      )}
                    </div>
                  );
                })}
                <div className="ml-2 w-16 shrink-0 text-center text-[10px] font-medium text-success-text">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit stats table */}
      <div className={`p-4 ${panel}`}>
        <p className="mb-3 text-sm font-medium text-body">Habit Stats</p>
        <div className="space-y-2">
          {habitMap.map((habit) => {
            const { current, longest } = calcStreak(habit.completions);
            const pct =
              daysInMonth > 0
                ? Math.round((habit.completions.size / daysInMonth) * 100)
                : 0;

            return (
              <div
                key={habit.title}
                className="flex items-center justify-between rounded-md p-2 hover:bg-elevated"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-heading">
                    {habit.title}
                    {habit.recurrenceTime && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        {habit.recurrenceTime}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted capitalize">
                    {habit.recurrence.toLowerCase()}
                  </p>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-sm font-bold text-heading">
                      {habit.completions.size}
                    </p>
                    <p className="text-[10px] text-muted">Done</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-success-text">
                      {pct}%
                    </p>
                    <p className="text-[10px] text-muted">Rate</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-accent-text">
                      {current}
                    </p>
                    <p className="text-[10px] text-muted">Streak</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-text">
                      {longest}
                    </p>
                    <p className="text-[10px] text-muted">Best</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
