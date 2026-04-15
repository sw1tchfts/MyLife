"use client";

import { useState, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { getDueStatus } from "@/components/TaskCard";
import type { TaskData } from "@/components/TaskCard";
import {
  badgeSm,
  btnDangerSm,
  emptyState,
  deleteBtn,
  panel,
  pillActive,
  pillInactive,
} from "@/lib/styles";

type SortField = "title" | "status" | "priority" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_ORDER = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateGroup(dueDate: string | null): string {
  if (!dueDate) return "No Due Date";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  due.setHours(0, 0, 0, 0);

  if (due < today) return "Overdue";
  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (due < nextWeek) return "This Week";
  return formatDate(dueDate);
}

const GROUP_ORDER: Record<string, number> = {
  Overdue: 0,
  Today: 1,
  Tomorrow: 2,
  "This Week": 3,
};

interface ListViewProps {
  tasks: TaskData[];
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onTaskClick?: (id: string) => void;
  onRefresh?: () => void;
}

export default function ListView({
  tasks,
  onDelete,
  onBulkDelete,
  onTaskClick,
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [groupByDate, setGroupByDate] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const regularTasks = tasks;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...regularTasks].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case "priority":
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case "dueDate": {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
        case "createdAt":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [regularTasks, sortField, sortDir]);

  // Group tasks by due date
  const grouped = useMemo(() => {
    if (!groupByDate) return null;
    const groups = new Map<string, TaskData[]>();
    for (const task of sorted) {
      const group = getDateGroup(task.dueDate);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(task);
    }
    // Sort groups by predefined order, then alphabetically
    return [...groups.entries()].sort((a, b) => {
      const orderA = GROUP_ORDER[a[0]] ?? 100;
      const orderB = GROUP_ORDER[b[0]] ?? 100;
      if (orderA !== orderB) return orderA - orderB;
      return a[0].localeCompare(b[0]);
    });
  }, [sorted, groupByDate]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((t) => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selected.size > 0) {
      onBulkDelete([...selected]);
      setSelected(new Set());
    }
  };

  if (regularTasks.length === 0) {
    return (
      <div className={emptyState}>
        <p className="text-muted">No tasks found</p>
        <p className="mt-1 text-sm text-faint">
          Create a new task to get started
        </p>
      </div>
    );
  }

  const GROUP_COLORS: Record<string, string> = {
    Overdue: "border-danger-soft bg-danger-soft text-danger-text",
    Today: "border-amber-soft bg-amber-soft text-amber-text",
    Tomorrow: "border-accent-soft bg-accent-soft text-accent-text",
    "This Week": "border-purple-soft bg-purple-soft text-purple-text",
  };

  const defaultGroupColor = "border-border bg-elevated text-muted";

  return (
    <>
      {/* Toolbar: group toggle + bulk actions */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGroupByDate((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              groupByDate ? `${pillActive}` : `${pillInactive}`
            }`}
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Group by Date
          </button>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-xs text-muted">
                {selected.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className={`inline-flex items-center gap-1 ${btnDangerSm}`}
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete {selected.size}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted hover:text-body"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {groupByDate && grouped ? (
        // Grouped view
        <div className="space-y-4">
          {grouped.map(([groupName, groupTasks]) => (
            <div key={groupName}>
              <div
                className={`mb-1 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${GROUP_COLORS[groupName] || defaultGroupColor}`}
              >
                {groupName}
                <span className="font-normal opacity-70">
                  ({groupTasks.length})
                </span>
              </div>
              <TaskTable
                tasks={groupTasks}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                selected={selected}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={() => {
                  const groupIds = new Set(groupTasks.map((t) => t.id));
                  const allSelected = groupTasks.every((t) =>
                    selected.has(t.id),
                  );
                  setSelected((prev) => {
                    const next = new Set(prev);
                    for (const id of groupIds) {
                      if (allSelected) next.delete(id);
                      else next.add(id);
                    }
                    return next;
                  });
                }}
                allSelected={groupTasks.every((t) => selected.has(t.id))}
                onTaskClick={onTaskClick}
                onDeleteClick={(t) => onDelete(t.id)}
                showHeaders={false}
              />
            </div>
          ))}
        </div>
      ) : (
        // Flat view
        <TaskTable
          tasks={sorted}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelected={sorted.length > 0 && selected.size === sorted.length}
          onTaskClick={onTaskClick}
          onDeleteClick={(t) => onDelete(t.id)}
          showHeaders={true}
        />
      )}
    </>
  );
}

// ── Extracted table component (shared by flat + grouped views) ──

interface TaskTableProps {
  tasks: TaskData[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onTaskClick?: (id: string) => void;
  onDeleteClick: (task: TaskData) => void;
  showHeaders: boolean;
}

function TaskTable({
  tasks,
  sortField,
  sortDir,
  onSort,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onTaskClick,
  onDeleteClick,
  showHeaders,
}: TaskTableProps) {
  return (
    <>
      {/* ── Mobile card view ── */}
      <div className="space-y-2 lg:hidden">
        {tasks.map((task) => {
          const due = getDueStatus(task.dueDate);
          const showDue = task.status !== "DONE" ? due : null;
          const isSelected = selected.has(task.id);

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task.id)}
              className={`cursor-pointer rounded-xl border border-border bg-card p-3 transition-shadow active:bg-elevated ${isSelected ? "ring-2 ring-accent" : ""}`}
            >
              {/* Top row: checkbox + title + delete */}
              <div className="flex items-start gap-3">
                <div
                  className="flex shrink-0 items-center pt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(task.id)}
                    className="h-4 w-4 rounded border-input-border"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-heading">
                      {task.title}
                    </span>
                    <div
                      className="flex shrink-0 items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onDeleteClick(task)}
                        className={deleteBtn}
                        title="Delete"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="mt-0.5 text-xs text-faint line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  {/* Food / med / subtask info */}
                  {task.taskFoods &&
                    task.taskFoods.length > 0 &&
                    (() => {
                      const totalCal = Math.round(
                        task.taskFoods.reduce(
                          (s, tf) => s + tf.foodItem.calories * tf.quantity,
                          0,
                        ),
                      );
                      const totalPro = Math.round(
                        task.taskFoods.reduce(
                          (s, tf) => s + tf.foodItem.protein * tf.quantity,
                          0,
                        ),
                      );
                      return (
                        <p className="mt-0.5 text-xs text-success-text">
                          {totalCal} cal · {totalPro}g protein
                        </p>
                      );
                    })()}
                  {task.taskMeds && task.taskMeds.length > 0 && (
                    <p className="mt-0.5 text-xs text-accent-text">
                      {task.taskMeds
                        .map((tm) => tm.medicationItem.name)
                        .join(", ")}
                    </p>
                  )}

                  {/* Badges row */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.taskType === "MEAL" && (
                      <span
                        className={`${badgeSm} bg-success-soft text-success-text`}
                      >
                        Meal
                      </span>
                    )}
                    {task.taskType === "MEDICATION" && (
                      <span
                        className={`${badgeSm} bg-accent-soft text-accent-text`}
                      >
                        Med
                      </span>
                    )}
                    {task.taskType === "TRACKER" && (
                      <span
                        className={`${badgeSm} bg-info-soft text-info-text`}
                      >
                        Tracker
                      </span>
                    )}
                    {task.recurrence && task.recurrence !== "NONE" && (
                      <span
                        className={`${badgeSm} bg-purple-soft text-purple-text`}
                      >
                        ↻{" "}
                        {task.recurrence.charAt(0) +
                          task.recurrence.slice(1).toLowerCase()}
                      </span>
                    )}
                    {task.blockedBy &&
                      task.blockedBy.some(
                        (d) => d.blocker.status !== "DONE",
                      ) && (
                        <span
                          className={`${badgeSm} bg-danger-soft text-danger-text`}
                        >
                          Blocked
                        </span>
                      )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-faint">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        {task.subtasks.filter((s) => s.done).length}/
                        {task.subtasks.length}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="ml-auto text-xs text-muted">
                        {showDue === "overdue"
                          ? "Overdue"
                          : showDue === "today"
                            ? "Today"
                            : formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop table view ── */}
      <div className={`hidden overflow-x-auto lg:block ${panel}`}>
        <table className="min-w-full divide-y divide-border">
          {showHeaders && (
            <thead className="bg-elevated">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-input-border"
                  />
                </th>
                {(
                  [
                    ["title", "Title"],
                    ["status", "Status"],
                    ["priority", "Priority"],
                    ["dueDate", "Due Date"],
                    ["createdAt", "Created"],
                  ] as const
                ).map(([field, label]) => (
                  <th key={field} className="px-4 py-3 text-left">
                    <button
                      onClick={() => onSort(field)}
                      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted hover:text-body"
                    >
                      {label}
                      {sortField === field && (
                        <span className="text-accent">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                ))}
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const due = getDueStatus(task.dueDate);
              const showDue = task.status !== "DONE" ? due : null;
              const isSelected = selected.has(task.id);

              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  className={`cursor-pointer transition-colors hover:bg-elevated ${isSelected ? "ring-2 ring-inset ring-accent" : ""}`}
                >
                  <td
                    className="px-3 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(task.id)}
                      className="h-3.5 w-3.5 rounded border-input-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-left text-sm font-medium text-heading">
                        {task.title}
                      </span>
                      {task.taskType === "MEAL" && (
                        <span
                          className={`${badgeSm} bg-success-soft text-success-text`}
                        >
                          Meal
                        </span>
                      )}
                      {task.taskType === "MEDICATION" && (
                        <span
                          className={`${badgeSm} bg-accent-soft text-accent-text`}
                        >
                          Med
                        </span>
                      )}
                      {task.taskType === "TRACKER" && (
                        <span
                          className={`${badgeSm} bg-info-soft text-info-text`}
                        >
                          Tracker
                        </span>
                      )}
                      {task.recurrence && task.recurrence !== "NONE" && (
                        <span
                          className={`${badgeSm} bg-purple-soft text-purple-text`}
                          title={`Repeats ${task.recurrence.toLowerCase()}`}
                        >
                          ↻{" "}
                          {task.recurrence.charAt(0) +
                            task.recurrence.slice(1).toLowerCase()}
                        </span>
                      )}
                      {task.recurrenceTime && (
                        <span className="text-[10px] text-faint">
                          {task.recurrenceTime}
                        </span>
                      )}
                      {task.blockedBy &&
                        task.blockedBy.some(
                          (d) => d.blocker.status !== "DONE",
                        ) && (
                          <span
                            className={`${badgeSm} bg-danger-soft text-danger-text`}
                            title={`Blocked by: ${task.blockedBy
                              .filter((d) => d.blocker.status !== "DONE")
                              .map((d) => d.blocker.title)
                              .join(", ")}`}
                          >
                            Blocked
                          </span>
                        )}
                    </div>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-faint line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    {task.taskFoods &&
                      task.taskFoods.length > 0 &&
                      (() => {
                        const totalCal = Math.round(
                          task.taskFoods.reduce(
                            (s, tf) => s + tf.foodItem.calories * tf.quantity,
                            0,
                          ),
                        );
                        const totalPro = Math.round(
                          task.taskFoods.reduce(
                            (s, tf) => s + tf.foodItem.protein * tf.quantity,
                            0,
                          ),
                        );
                        return (
                          <p className="mt-0.5 text-xs text-success-text">
                            {totalCal} cal · {totalPro}g protein ·{" "}
                            {task.taskFoods.length} food
                            {task.taskFoods.length !== 1 ? "s" : ""}
                          </p>
                        );
                      })()}
                    {task.taskMeds && task.taskMeds.length > 0 && (
                      <p className="mt-0.5 text-xs text-accent-text">
                        {task.taskMeds
                          .map((tm) => tm.medicationItem.name)
                          .join(", ")}
                      </p>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-faint">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        {task.subtasks.filter((s) => s.done).length}/
                        {task.subtasks.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate ? (
                      <span className="text-sm text-muted">
                        {showDue === "overdue"
                          ? "Overdue"
                          : showDue === "today"
                            ? "Today"
                            : formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-sm text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-faint">
                    {formatDate(task.createdAt)}
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDeleteClick(task)}
                      className={deleteBtn}
                      title="Delete"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
