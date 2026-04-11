"use client";

import TaskCard, { type TaskData, getDueStatus } from "./TaskCard";

interface TaskListProps {
  tasks: TaskData[];
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
        <p className="text-gray-500">No tasks found</p>
        <p className="mt-1 text-sm text-gray-400">
          Create a new task to get started
        </p>
      </div>
    );
  }

  const duePriority = { overdue: 0, today: 1, soon: 2 } as const;

  const sorted = [...tasks].sort((a, b) => {
    const aStatus = a.status !== "DONE" ? getDueStatus(a.dueDate) : null;
    const bStatus = b.status !== "DONE" ? getDueStatus(b.dueDate) : null;
    const aVal = aStatus ? duePriority[aStatus] : 3;
    const bVal = bStatus ? duePriority[bStatus] : 3;
    return aVal - bVal;
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((task) => (
        <TaskCard key={task.id} task={task} onDelete={onDelete} />
      ))}
    </div>
  );
}
