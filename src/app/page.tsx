"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TaskData } from "@/components/TaskCard";
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

function HomeContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "list";

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      {/* View header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {VIEW_TITLES[view] || "Tasks"}
        </h1>
        <Link
          href="/tasks/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Task
        </Link>
      </div>

      {/* View content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      ) : (
        <>
          {view === "list" && (
            <ListView tasks={tasks} onDelete={handleDelete} />
          )}
          {view === "calendar" && <CalendarView tasks={tasks} />}
          {view === "timeline" && <TimelineView tasks={tasks} />}
          {view === "dashboard" && <DashboardView tasks={tasks} />}
          {view === "focus" && (
            <FocusView tasks={tasks} onStatusChange={handleStatusChange} />
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
