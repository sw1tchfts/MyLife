"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import type { TaskFormData } from "@/components/TaskForm";
import SubtaskList from "@/components/SubtaskList";
import type {
  Status,
  Priority,
  Recurrence,
  TaskType,
  MealType,
} from "@/generated/prisma/client";
import type {
  SubtaskData,
  TaskFoodData,
  TaskMedData,
  FoodItemData,
  MedicationItemData,
} from "@/components/TaskCard";

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
  subtasks?: SubtaskData[];
  taskFoods?: TaskFoodData[];
  taskMeds?: TaskMedData[];
}

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchTask = useCallback(() => {
    fetch(`/api/tasks/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setTask(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  if (loading) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading task...
      </p>
    );
  }

  if (notFound || !task) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Task Not Found
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          The task you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const initialData: TaskFormData = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    recurrence: task.recurrence || "NONE",
    taskType: task.taskType || "TASK",
    mealType: task.mealType || null,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Edit{" "}
        {task.taskType === "MEAL"
          ? "Meal"
          : task.taskType === "MEDICATION"
            ? "Medication"
            : "Task"}
      </h1>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <TaskForm
          initialData={initialData}
          submitLabel="Save Changes"
          onSubmit={async (data) => {
            const res = await fetch(`/api/tasks/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                dueDate: data.dueDate || null,
                recurrence: data.recurrence,
                taskType: data.taskType,
                mealType: data.mealType,
              }),
            });
            if (!res.ok) throw new Error("Failed to update task");
            router.push("/");
          }}
        />
      </div>

      {/* Food management for MEAL tasks */}
      {task.taskType === "MEAL" && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <TaskFoodManager
            taskId={id}
            taskFoods={task.taskFoods || []}
            onUpdate={fetchTask}
          />
        </div>
      )}

      {/* Medication management for MEDICATION tasks */}
      {task.taskType === "MEDICATION" && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <TaskMedManager
            taskId={id}
            taskMeds={task.taskMeds || []}
            onUpdate={fetchTask}
          />
        </div>
      )}

      {/* Subtasks */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <SubtaskList
          taskId={id}
          subtasks={task.subtasks || []}
          onUpdate={fetchTask}
        />
      </div>
    </div>
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
      .then((data) => setFoods(data));
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
  const totalCarbs = Math.round(
    taskFoods.reduce((s, tf) => s + tf.foodItem.carbs * tf.quantity, 0),
  );
  const totalFat = Math.round(
    taskFoods.reduce((s, tf) => s + tf.foodItem.fat * tf.quantity, 0),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Foods
        </h3>
        {taskFoods.length > 0 && (
          <span className="text-xs text-green-600 dark:text-green-400">
            {totalCal} cal · {totalPro}g P · {totalCarbs}g C · {totalFat}g F
          </span>
        )}
      </div>

      {/* Current foods */}
      {taskFoods.length > 0 && (
        <div className="mt-2 space-y-1">
          {taskFoods.map((tf) => (
            <div
              key={tf.id}
              className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {tf.foodItem.name}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  x{tf.quantity} (
                  {Math.round(tf.foodItem.calories * tf.quantity)} cal)
                </span>
              </div>
              <button
                onClick={() => removeFood(tf.id)}
                className="rounded p-0.5 text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600"
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
      )}

      {/* Add food */}
      <div className="mt-3 flex gap-2">
        <select
          value={selectedFoodId}
          onChange={(e) => setSelectedFoodId(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Select from library...</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({Math.round(f.calories)} cal/{f.servingSize}
              {f.servingUnit})
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.5"
          min="0.5"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder="Qty"
        />
        <button
          onClick={addFood}
          disabled={!selectedFoodId}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {foods.length === 0 && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          No foods in your library. Add some from Diet &amp; Nutrition first.
        </p>
      )}
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
      .then((data) => setMeds(data));
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

      {taskMeds.length > 0 && (
        <div className="mt-2 space-y-1">
          {taskMeds.map((tm) => (
            <div
              key={tm.id}
              className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {tm.medicationItem.name}
                </span>
                {tm.dosage && (
                  <span className="ml-2 text-xs text-gray-400">
                    {tm.dosage}
                  </span>
                )}
                {tm.medicationItem.genericName && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({tm.medicationItem.genericName})
                  </span>
                )}
              </div>
              <button
                onClick={() => removeMed(tm.id)}
                className="rounded p-0.5 text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600"
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
      )}

      <div className="mt-3 flex gap-2">
        <select
          value={selectedMedId}
          onChange={(e) => setSelectedMedId(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Select from library...</option>
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
          className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder="Dosage"
        />
        <button
          onClick={addMed}
          disabled={!selectedMedId}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {meds.length === 0 && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          No medications in your library. Add some from Diet &amp; Nutrition
          first.
        </p>
      )}
    </div>
  );
}
