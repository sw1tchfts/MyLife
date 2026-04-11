"use client";

import { useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { getDueStatus } from "@/components/TaskCard";
import type { TaskData } from "@/components/TaskCard";

interface FocusViewProps {
  tasks: TaskData[];
  onStatusChange: (id: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

export default function FocusView({ tasks, onStatusChange }: FocusViewProps) {
  const { overdue, today, soon, inProgress } = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "DONE");
    return {
      overdue: active.filter((t) => getDueStatus(t.dueDate) === "overdue"),
      today: active.filter((t) => getDueStatus(t.dueDate) === "today"),
      soon: active.filter((t) => getDueStatus(t.dueDate) === "soon"),
      inProgress: active.filter(
        (t) =>
          t.status === "IN_PROGRESS" &&
          getDueStatus(t.dueDate) !== "overdue" &&
          getDueStatus(t.dueDate) !== "today" &&
          getDueStatus(t.dueDate) !== "soon",
      ),
    };
  }, [tasks]);

  const totalFocus =
    overdue.length + today.length + soon.length + inProgress.length;

  if (totalFocus === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 text-5xl">&#10003;</div>
        <h2 className="text-lg font-semibold text-gray-700">
          You&apos;re all caught up!
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          No overdue, due today, or upcoming tasks need attention.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4">
        {overdue.length > 0 && (
          <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            {overdue.length} overdue
          </div>
        )}
        {today.length > 0 && (
          <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {today.length} due today
          </div>
        )}
        {soon.length > 0 && (
          <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            {soon.length} due soon
          </div>
        )}
      </div>

      {overdue.length > 0 && (
        <FocusSection
          title="Overdue"
          subtitle="These need immediate attention"
          tasks={overdue}
          borderColor="border-l-red-500"
          onStatusChange={onStatusChange}
        />
      )}

      {today.length > 0 && (
        <FocusSection
          title="Due Today"
          subtitle="Finish these before end of day"
          tasks={today}
          borderColor="border-l-amber-500"
          onStatusChange={onStatusChange}
        />
      )}

      {soon.length > 0 && (
        <FocusSection
          title="Due Soon"
          subtitle="Coming up in the next 3 days"
          tasks={soon}
          borderColor="border-l-yellow-500"
          onStatusChange={onStatusChange}
        />
      )}

      {inProgress.length > 0 && (
        <FocusSection
          title="In Progress"
          subtitle="Keep the momentum going"
          tasks={inProgress}
          borderColor="border-l-blue-500"
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}

function FocusSection({
  title,
  subtitle,
  tasks,
  borderColor,
  onStatusChange,
}: {
  title: string;
  subtitle: string;
  tasks: TaskData[];
  borderColor: string;
  onStatusChange: (id: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mb-2 text-xs text-gray-400">{subtitle}</p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between rounded-lg border border-l-4 border-gray-200 bg-white p-3 ${borderColor}`}
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/tasks/${task.id}/edit`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {task.title}
              </Link>
              {task.description && (
                <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                  {task.description}
                </p>
              )}
              <div className="mt-1.5 flex gap-1">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            <button
              onClick={() => onStatusChange(task.id, "DONE")}
              className="ml-3 shrink-0 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              Mark Done
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
