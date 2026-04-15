"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import type { TaskData, TaskType } from "@/components/TaskCard";
import type { Status, Priority } from "@/generated/prisma/client";
import ListView from "@/components/views/ListView";
import TaskModal from "@/components/TaskModal";
import {
  sectionTitle,
  btnPrimary,
  btnSecondary,
  pillActive,
  pillInactive,
  emptyState,
} from "@/lib/styles";

// Lazy-load tab components that aren't shown by default
const DashboardView = dynamic(() => import("@/components/views/DashboardView"));
const DailyLogSection = dynamic(
  () => import("@/components/views/DailyLogSection"),
);
const RecurringConfig = dynamic(
  () => import("@/components/views/RecurringConfig"),
);

type Tab = "dashboard" | "tasks" | "adhoc-config" | "recurring-config";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "tasks", label: "Tasks" },
  { key: "adhoc-config", label: "Ad-Hoc Config" },
  { key: "recurring-config", label: "Recurring Config" },
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

const TYPE_FILTERS: { label: string; value: TaskType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Tasks", value: "TASK" },
  { label: "Meals", value: "MEAL" },
  { label: "Meds", value: "MEDICATION" },
];

function TasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "tasks";

  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [typeFilter, setTypeFilter] = useState<TaskType | "ALL">("ALL");

  const TASKS_PER_PAGE = 50;

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback((page = 1, append = false) => {
    if (append) setLoadingMore(true);
    fetch(`/api/tasks?limit=${TASKS_PER_PAGE}&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        const { tasks: newTasks, total, page: p } = data;
        setTasks((prev) => (append ? [...prev, ...newTasks] : newTasks));
        setTotalTasks(total);
        setCurrentPage(p);
        setLoading(false);
        setLoadingMore(false);
      });
  }, []);

  const loadMore = useCallback(() => {
    fetchTasks(currentPage + 1, true);
  }, [fetchTasks, currentPage]);

  useEffect(() => {
    // Generate recurring instances once on initial load (fire-and-forget),
    // then fetch the task list. This avoids running expensive recurrence
    // logic on every GET /api/tasks call.
    fetch("/api/tasks/generate-instances", { method: "POST" }).finally(() => {
      fetchTasks();
    });
  }, [fetchTasks]);

  const setTab = (t: Tab) => router.push(`/tasks?tab=${t}`);

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
    if (typeFilter !== "ALL") {
      result = result.filter((t) => t.taskType === typeFilter);
    }
    return result;
  }, [tasks, search, statusFilter, priorityFilter, typeFilter]);

  const handleDelete = (id: string) => {
    const deleted = tasks.find((t) => t.id === id);
    if (!deleted) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast({
      message: `Deleted "${deleted.title}"`,
      onUndo: () => setTasks((prev) => [...prev, deleted]),
      onExpire: () => {
        fetch(`/api/tasks/${id}`, { method: "DELETE" });
      },
    });
  };

  const handleBulkDelete = (ids: string[]) => {
    const deleted = tasks.filter((t) => ids.includes(t.id));
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    showToast({
      message: `Deleted ${deleted.length} task${deleted.length !== 1 ? "s" : ""}`,
      onUndo: () => setTasks((prev) => [...prev, ...deleted]),
      onExpire: () => {
        Promise.all(
          ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" })),
        );
      },
    });
  };

  const handleTaskClick = (id: string) => {
    setEditTaskId(id);
    setModalMode("edit");
  };

  const hasFilters =
    search || statusFilter || priorityFilter || typeFilter !== "ALL";

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">Tasks</h1>
        {tab === "tasks" && (
          <button
            onClick={() => setModalMode("create")}
            className={`inline-flex items-center shadow-sm ${btnPrimary}`}
          >
            + New Task
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-t-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-elevated"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "dashboard" && (
        <div className="space-y-8">
          <DailyLogSection />
          <div className="border-t border-border pt-6">
            <h2 className={`mb-4 ${sectionTitle}`}>Task Stats</h2>
            <DashboardView tasks={tasks} />
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <>
          {/* Search + filters */}
          <div className="mb-4 space-y-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
                className="w-full rounded-md border border-input-border bg-card py-2 pl-10 pr-3 text-sm text-heading placeholder-faint focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </div>

            <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
              <div className="flex items-center gap-2 whitespace-nowrap pb-1">
                <span className="text-xs text-muted">Type:</span>
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTypeFilter(f.value)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      typeFilter === f.value ? pillActive : pillInactive
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="ml-2 text-xs text-muted">Status:</span>
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() =>
                      setStatusFilter((prev) =>
                        prev === f.value ? null : f.value,
                      )
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === f.value ? pillActive : pillInactive
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="ml-2 text-xs text-muted">Priority:</span>
                {PRIORITY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() =>
                      setPriorityFilter((prev) =>
                        prev === f.value ? null : f.value,
                      )
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      priorityFilter === f.value ? pillActive : pillInactive
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
                      setTypeFilter("ALL");
                    }}
                    className="ml-1 text-xs text-muted hover:text-body"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted">Loading tasks...</p>
            </div>
          ) : (
            <>
              <ListView
                tasks={filtered}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onTaskClick={handleTaskClick}
                onRefresh={() => fetchTasks()}
              />
              {tasks.length < totalTasks && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={`disabled:opacity-50 ${btnSecondary}`}
                  >
                    {loadingMore
                      ? "Loading..."
                      : `Load more (${tasks.length} of ${totalTasks})`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "adhoc-config" && (
        <div>
          <p className="text-sm text-muted">
            Create ad-hoc task templates that you can quickly add to your task
            list.
          </p>
          <div className={`mt-4 ${emptyState}`}>
            <p className="text-muted">
              Coming soon — task templates for quick creation
            </p>
          </div>
        </div>
      )}

      {tab === "recurring-config" && <RecurringConfig />}

      {/* Task modal */}
      {modalMode && (
        <TaskModal
          mode={modalMode}
          taskId={editTaskId ?? undefined}
          onClose={() => {
            setModalMode(null);
            setEditTaskId(null);
          }}
          onSaved={() => fetchTasks()}
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
          <p className="text-muted">Loading...</p>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
