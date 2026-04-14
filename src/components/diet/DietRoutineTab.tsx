"use client";

import { useEffect, useState } from "react";

interface FoodItem {
  id: string;
  name: string;
  brand: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface MealPlan {
  mealType: string;
  time: string;
  days: string;
  foods: {
    foodItemId: string;
    quantity: number;
    name: string;
    calories: number;
  }[];
}

export default function DietRoutineTab() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [newMealType, setNewMealType] = useState("BREAKFAST");
  const [newTime, setNewTime] = useState("08:00");
  const [newDays, setNewDays] = useState("mon,tue,wed,thu,fri,sat,sun");
  const [newFoods, setNewFoods] = useState<
    { foodItemId: string; quantity: number }[]
  >([]);
  const [addFoodId, setAddFoodId] = useState("");
  const [addFoodQty, setAddFoodQty] = useState("1");

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then((data) => {
        setFoods(data);
        setLoading(false);
      });
  }, []);

  const addFoodToMeal = () => {
    if (!addFoodId) return;
    setNewFoods((prev) => [
      ...prev,
      { foodItemId: addFoodId, quantity: parseFloat(addFoodQty) || 1 },
    ]);
    setAddFoodId("");
    setAddFoodQty("1");
  };

  const removeFoodFromMeal = (idx: number) => {
    setNewFoods((prev) => prev.filter((_, i) => i !== idx));
  };

  const addMealToPlan = () => {
    const foodDetails = newFoods.map((f) => {
      const item = foods.find((fd) => fd.id === f.foodItemId);
      return {
        ...f,
        name: item?.name || "Unknown",
        calories: (item?.calories || 0) * f.quantity,
      };
    });
    setMeals((prev) => [
      ...prev,
      {
        mealType: newMealType,
        time: newTime,
        days: newDays,
        foods: foodDetails,
      },
    ]);
    setNewMealType("BREAKFAST");
    setNewTime("08:00");
    setNewDays("mon,tue,wed,thu,fri,sat,sun");
    setNewFoods([]);
    setShowAdd(false);
  };

  const removeMealFromPlan = (idx: number) => {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  };

  const activatePlan = async () => {
    setSaving(true);
    for (const meal of meals) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: MEAL_LABELS[meal.mealType] || meal.mealType,
          taskType: "MEAL",
          mealType: meal.mealType,
          recurrence: "WEEKLY",
          recurrenceDays: meal.days,
          recurrenceTime: meal.time,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        for (const food of meal.foods) {
          await fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addFood: { foodItemId: food.foodItemId, quantity: food.quantity },
            }),
          });
        }
      }
    }
    setSaving(false);
    setMeals([]);
  };

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;

  const totalDailyCal = meals.reduce(
    (sum, m) => sum + m.foods.reduce((s, f) => s + f.calories, 0),
    0,
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Build your meal plan. Add meals with their foods, then activate to
            create recurring tasks.
          </p>
          {meals.length > 0 && (
            <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
              Plan total: ~{Math.round(totalDailyCal)} cal/day
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Add Meal
          </button>
          {meals.length > 0 && (
            <button
              onClick={activatePlan}
              disabled={saving}
              className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Activate Plan"}
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Add Meal to Plan
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Meal Type
              </label>
              <select
                value={newMealType}
                onChange={(e) => setNewMealType(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MEAL_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Days
              </label>
              <div className="mt-1 flex gap-1">
                {WEEKDAYS.map((day) => {
                  const active = newDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const current = newDays.split(",").filter(Boolean);
                        const next = active
                          ? current.filter((d) => d !== day)
                          : [...current, day];
                        setNewDays(next.join(","));
                      }}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${active ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"}`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Foods
            </label>
            {newFoods.length > 0 && (
              <div className="mt-1 space-y-1">
                {newFoods.map((f, i) => {
                  const item = foods.find((fd) => fd.id === f.foodItemId);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-gray-800"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {item?.name} &times;{f.quantity}
                        <span className="ml-2 text-gray-400">
                          {Math.round((item?.calories || 0) * f.quantity)} cal
                        </span>
                      </span>
                      <button
                        onClick={() => removeFoodFromMeal(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-1 flex gap-2">
              <select
                value={addFoodId}
                onChange={(e) => setAddFoodId(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select food...</option>
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({Math.round(f.calories)} cal)
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={addFoodQty}
                onChange={(e) => setAddFoodQty(e.target.value)}
                className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                onClick={addFoodToMeal}
                disabled={!addFoodId}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {foods.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No foods saved. Add foods in the Food Library tab first.
              </p>
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAdd(false);
                setNewFoods([]);
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={addMealToPlan}
              disabled={newFoods.length === 0}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add to Plan
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {meals.length === 0 && !showAdd ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              No meals in your plan yet
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Add meals to build your weekly diet routine
            </p>
          </div>
        ) : (
          meals.map((meal, i) => {
            const mealCal = meal.foods.reduce((s, f) => s + f.calories, 0);
            const daysList = meal.days
              .split(",")
              .map((d) => WEEKDAY_LABELS[d]?.slice(0, 3) || d)
              .join(", ");
            return (
              <div
                key={i}
                className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {MEAL_LABELS[meal.mealType]}
                    </span>
                    <span className="text-xs text-gray-400">{meal.time}</span>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {Math.round(mealCal)} cal
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {daysList}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {meal.foods
                      .map((f) => `${f.name} ×${f.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => removeMealFromPlan(i)}
                  className="rounded p-1 text-gray-300 hover:text-red-500 dark:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
