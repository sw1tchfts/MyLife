"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import type { TaskData } from "@/components/TaskCard";
import type { Status } from "@/generated/prisma/client";

const FILTERS: { label: string; value: Status | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "To Do", value: "TODO" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Done", value: "DONE" },
];

export default function HomePage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = filter === "ALL" ? "" : `?status=${filter}`;
    fetch(`/api/tasks${params}`)
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
  }, [filter]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">MyLife Tasks</h1>
        <Link
          href="/tasks/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Task
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            throw new Error("Sentry test error — safe to ignore");
          }}
          className="rounded-md bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200"
        >
          Test Sentry
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading tasks...</p>
        ) : (
          <TaskList tasks={tasks} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
