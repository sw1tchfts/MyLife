"use client";

import { useState } from "react";
import type { SubtaskData } from "./TaskCard";
import { useToast } from "@/components/ToastProvider";

interface SubtaskListProps {
  taskId: string;
  subtasks: SubtaskData[];
  onUpdate: () => void;
}

export default function SubtaskList({
  taskId,
  subtasks,
  onUpdate,
}: SubtaskListProps) {
  const { showToast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const visibleSubtasks = subtasks.filter((s) => !hiddenIds.has(s.id));
  const doneCount = visibleSubtasks.filter((s) => s.done).length;
  const total = visibleSubtasks.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const addSubtask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    setAdding(false);
    onUpdate();
  };

  const toggleDone = async (subtask: SubtaskData) => {
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtaskId: subtask.id, done: !subtask.done }),
    });
    onUpdate();
  };

  const deleteSubtask = (subtaskId: string) => {
    const deleted = subtasks.find((s) => s.id === subtaskId);
    if (!deleted) return;
    setHiddenIds((prev) => new Set(prev).add(subtaskId));
    showToast({
      message: `Deleted "${deleted.title}"`,
      onUndo: () => {
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(subtaskId);
          return next;
        });
      },
      onExpire: () => {
        fetch(`/api/tasks/${taskId}/subtasks?subtaskId=${subtaskId}`, {
          method: "DELETE",
        }).then(() => onUpdate());
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subtasks
        </h3>
        {total > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {doneCount}/{total} done
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Subtask items */}
      <div className="mt-2 space-y-1">
        {visibleSubtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <input
              type="checkbox"
              checked={subtask.done}
              onChange={() => toggleDone(subtask)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span
              className={`flex-1 text-sm ${
                subtask.done
                  ? "text-gray-400 line-through dark:text-gray-500"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => deleteSubtask(subtask.id)}
              className="rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-600"
              title="Remove"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new subtask */}
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          placeholder="Add a subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        <button
          onClick={addSubtask}
          disabled={adding || !newTitle.trim()}
          className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}
