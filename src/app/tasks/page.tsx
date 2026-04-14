"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { TaskData } from "@/components/TaskCard";
import type { Status, Priority } from "@/generated/prisma/client";
import ListView from "@/components/views/ListView";
import CalendarView from "@/components/views/CalendarView";
import DashboardView from "@/components/views/DashboardView";
import FocusView from "@/components/views/FocusView";
import TaskModal from "@/components/TaskModal";

type View = "list" | "calendar" | "dashboard" | "focus";

const VIEWS: { key: View; label: string }[] = [
  { key: "list", label: "List" },
  { key: "calendar", label: "Calendar" },
  { key: "dashboard", label: "Dashboard" },
  { key: "focus", label: "Focus" },
];

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

function TasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = (searchParams.get("view") as View) || "list";

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const handler = () => fetchTasks();
    window.addEventListener("tasks-changed", handler);
    return () => window.removeEventListener("tasks-changed", handler);
  }, [fetchTasks]);

  const setView = (v: View) => router.push(`/tasks?view=${v}`);

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

  const handleTaskClick = (id: string) => {
    setEditTaskId(id);
    setModalMode("edit");
  };

  const hasFilters = search || statusFilter || priorityFilter;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Tasks
        </h1>
        <button
          onClick={() => setModalMode("create")}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      {/* View tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              view === v.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Search + filters (hide on dashboard) */}
      {view !== "dashboard" && (
        <div className="mb-4 space-y-2">
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
                  setPriorityFilter((prev) =>
                    prev === f.value ? null : f.value,
                  )
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
      )}

      {/* View content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      ) : (
        <>
          {view === "list" && (
            <ListView
              tasks={filtered}
              onDelete={handleDelete}
              onTaskClick={handleTaskClick}
              onRefresh={fetchTasks}
            />
          )}
          {view === "calendar" && <CalendarView tasks={filtered} />}
          {view === "dashboard" && <DashboardView tasks={tasks} />}
          {view === "focus" && (
            <FocusView tasks={filtered} onStatusChange={handleStatusChange} />
          )}
        </>
      )}

      {/* Task modal */}
      {modalMode && (
        <TaskModal
          mode={modalMode}
          taskId={editTaskId ?? undefined}
          onClose={() => {
            setModalMode(null);
            setEditTaskId(null);
          }}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
