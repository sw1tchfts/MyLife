"use client";

import { useEffect, useState, useCallback } from "react";
import TaskForm from "./TaskForm";
import type { TaskFormData } from "./TaskForm";
import TrackerForm from "./TrackerForm";
import { MODAL_TITLES } from "@/lib/screens";
import SubtaskList from "./SubtaskList";
import type {
  SubtaskData,
  TaskFoodData,
  TaskMedData,
  FoodItemData,
  MedicationItemData,
} from "./TaskCard";
import type {
  Status,
  Priority,
  Recurrence,
  TaskType,
  MealType,
} from "@/generated/prisma/client";

interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  recurrence: Recurrence;
  taskType: TaskType;
  mealType: MealType | null;
  isHabit: boolean;
  recurrenceDays: string;
  recurrenceTime: string;
  subtasks?: SubtaskData[];
  taskFoods?: TaskFoodData[];
  taskMeds?: TaskMedData[];
}

interface TaskModalProps {
  mode: "create" | "edit";
  taskId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskModal({
  mode,
  taskId,
  onClose,
  onSaved,
}: TaskModalProps) {
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(mode === "edit");

  const fetchTask = useCallback(() => {
    if (!taskId) return;
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setLoading(false);
      });
  }, [taskId]);

  useEffect(() => {
    if (mode === "edit" && taskId) fetchTask();
  }, [mode, taskId, fetchTask]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const initialData: TaskFormData | undefined =
    mode === "edit" && task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          recurrence: task.recurrence || "NONE",
          taskType: task.taskType || "TASK",
          mealType: task.mealType || null,
          isHabit: task.isHabit ?? false,
          recurrenceDays: task.recurrenceDays ?? "",
          recurrenceTime: task.recurrenceTime ?? "",
        }
      : undefined;

  const handleSubmit = async (data: TaskFormData) => {
    if (mode === "create") {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
    } else {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update task");
    }
    onSaved();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {mode === "edit" && task?.taskType === "TRACKER"
              ? MODAL_TITLES.dailyLog
              : mode === "create"
                ? MODAL_TITLES.newTask
                : MODAL_TITLES.editTask}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : mode === "edit" && task?.taskType === "TRACKER" ? (
            /* Tracker tasks get the tracker form instead of the normal edit form */
            <TrackerForm
              taskId={taskId!}
              taskStatus={task.status}
              onComplete={() => {
                onSaved();
                onClose();
              }}
            />
          ) : (
            <div className="space-y-6">
              <TaskForm
                initialData={initialData}
                submitLabel={mode === "create" ? "Create Task" : "Save Changes"}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />

              {/* Edit-only sections */}
              {mode === "edit" && task && (
                <>
                  {task.taskType === "MEAL" && (
                    <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                      <TaskFoodManager
                        taskId={taskId!}
                        taskFoods={task.taskFoods || []}
                        onUpdate={fetchTask}
                      />
                    </div>
                  )}

                  {task.taskType === "MEDICATION" && (
                    <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                      <TaskMedManager
                        taskId={taskId!}
                        taskMeds={task.taskMeds || []}
                        onUpdate={fetchTask}
                      />
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                    <SubtaskList
                      taskId={taskId!}
                      subtasks={task.subtasks || []}
                      onUpdate={fetchTask}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Task Food Manager ─────────────────────────────── */

function TaskFoodManager({
  taskId,
  taskFoods,
  onUpdate,
}: {
  taskId: string;
  taskFoods: TaskFoodData[];
  onUpdate: () => void;
}) {
  const [foods, setFoods] = useState<FoodItemData[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then(setFoods);
  }, []);

  const addFood = async () => {
    if (!selectedFoodId) return;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addFood: {
          foodItemId: selectedFoodId,
          quantity: parseFloat(quantity) || 1,
        },
      }),
    });
    if (res.ok) {
      setSelectedFoodId("");
      setQuantity("1");
      onUpdate();
    }
  };

  const removeFood = async (taskFoodId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeFood: taskFoodId }),
    });
    onUpdate();
  };

  const totalCal = Math.round(
    taskFoods.reduce((s, tf) => s + tf.foodItem.calories * tf.quantity, 0),
  );
  const totalPro = Math.round(
    taskFoods.reduce((s, tf) => s + tf.foodItem.protein * tf.quantity, 0),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Foods
        </h3>
        {taskFoods.length > 0 && (
          <span className="text-xs text-green-600 dark:text-green-400">
            {totalCal} cal · {totalPro}g protein
          </span>
        )}
      </div>
      {taskFoods.map((tf) => (
        <div
          key={tf.id}
          className="group mt-1 flex items-center justify-between rounded-md px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {tf.foodItem.name}{" "}
            <span className="text-xs text-gray-400">x{tf.quantity}</span>
          </span>
          <button
            onClick={() => removeFood(tf.id)}
            className="text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
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
      <div className="mt-2 flex gap-2">
        <select
          value={selectedFoodId}
          onChange={(e) => setSelectedFoodId(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">Select food...</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.5"
          min="0.5"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          onClick={addFood}
          disabled={!selectedFoodId}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ── Task Medication Manager ──────────────────────── */

function TaskMedManager({
  taskId,
  taskMeds,
  onUpdate,
}: {
  taskId: string;
  taskMeds: TaskMedData[];
  onUpdate: () => void;
}) {
  const [meds, setMeds] = useState<MedicationItemData[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [dosage, setDosage] = useState("");

  useEffect(() => {
    fetch("/api/medications")
      .then((r) => r.json())
      .then(setMeds);
  }, []);

  const addMed = async () => {
    if (!selectedMedId) return;
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addMedication: { medicationItemId: selectedMedId, dosage },
      }),
    });
    setSelectedMedId("");
    setDosage("");
    onUpdate();
  };

  const removeMed = async (taskMedId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMedication: taskMedId }),
    });
    onUpdate();
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Medications
      </h3>
      {taskMeds.map((tm) => (
        <div
          key={tm.id}
          className="group mt-1 flex items-center justify-between rounded-md px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {tm.medicationItem.name}{" "}
            {tm.dosage && (
              <span className="text-xs text-gray-400">{tm.dosage}</span>
            )}
          </span>
          <button
            onClick={() => removeMed(tm.id)}
            className="text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
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
      <div className="mt-2 flex gap-2">
        <select
          value={selectedMedId}
          onChange={(e) => setSelectedMedId(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">Select medication...</option>
          {meds.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.strength ? ` (${m.strength})` : ""}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="Dosage"
          className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          onClick={addMed}
          disabled={!selectedMedId}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
