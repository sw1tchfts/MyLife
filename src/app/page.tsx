"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TaskData } from "@/components/TaskCard";
import type { Status, Priority } from "@/generated/prisma/client";
import ListView from "@/components/views/ListView";
import CalendarView from "@/components/views/CalendarView";
import TimelineView from "@/components/views/TimelineView";
import DashboardView from "@/components/views/DashboardView";
import FocusView from "@/components/views/FocusView";

const VIEW_TITLES: Record<string, string> = {
  list: "List",
  calendar: "Calendar",
  timeline: "Timeline",
  dashboard: "Dashboard",
  focus: "Focus",
};

const STATUS_FILTERS: { label: string; value: Status }[] = [
  { label: "To Do", value: "TODO" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Done", value: "DONE" },
];

const PRIORITY_FILTERS: { label: string; value: Priority }[] = [
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "list";

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, search, statusFilter, priorityFilter]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = async (
    id: string,
    status: "TODO" | "IN_PROGRESS" | "DONE",
  ) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const hasFilters = search || statusFilter || priorityFilter;

  return (
    <div>
      {/* View header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {VIEW_TITLES[view] || "Tasks"}
        </h1>
        <Link
          href="/tasks/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Task
        </Link>
      </div>

      {/* Search + filters */}
      <div className="mb-4 space-y-2">
        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Status:</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() =>
                setStatusFilter((prev) => (prev === f.value ? null : f.value))
              }
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-2 text-xs text-gray-400">Priority:</span>
          {PRIORITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() =>
                setPriorityFilter((prev) => (prev === f.value ? null : f.value))
              }
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                priorityFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {f.label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter(null);
                setPriorityFilter(null);
              }}
              className="ml-1 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* View content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      ) : (
        <>
          {view === "list" && (
            <ListView tasks={filtered} onDelete={handleDelete} />
          )}
          {view === "calendar" && <CalendarView tasks={filtered} />}
          {view === "timeline" && <TimelineView tasks={filtered} />}
          {view === "dashboard" && <DashboardView tasks={filtered} />}
          {view === "focus" && (
            <FocusView tasks={filtered} onStatusChange={handleStatusChange} />
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
