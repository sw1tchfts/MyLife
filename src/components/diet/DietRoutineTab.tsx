"use client";

import { useEffect, useState } from "react";
import {
  inputSm,
  select,
  btnPrimary,
  btnSecondary,
  emptyState,
  deleteBtn,
  labelSm,
  pillInactive,
} from "@/lib/styles";

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

  if (loading) return <p className="text-center text-muted">Loading...</p>;

  const totalDailyCal = meals.reduce(
    (sum, m) => sum + m.foods.reduce((s, f) => s + f.calories, 0),
    0,
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            Build your meal plan. Add meals with their foods, then activate to
            create recurring tasks.
          </p>
          {meals.length > 0 && (
            <p className="mt-1 text-xs text-info-text">
              Plan total: ~{Math.round(totalDailyCal)} cal/day
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className={`inline-flex items-center shadow-sm ${btnPrimary}`}
          >
            + Add Meal
          </button>
          {meals.length > 0 && (
            <button
              onClick={activatePlan}
              disabled={saving}
              className="inline-flex items-center rounded-md bg-success px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Activate Plan"}
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="mt-4 rounded-lg border border-accent bg-accent-soft p-4">
          <h3 className="mb-3 text-sm font-semibold text-heading">
            Add Meal to Plan
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelSm}>Meal Type</label>
              <select
                value={newMealType}
                onChange={(e) => setNewMealType(e.target.value)}
                className={select}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MEAL_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelSm}>Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className={`${inputSm} mt-1`}
              />
            </div>
            <div>
              <label className={labelSm}>Days</label>
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
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${active ? "border-accent bg-accent text-white" : `${pillInactive}`}`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className={labelSm}>Foods</label>
            {newFoods.length > 0 && (
              <div className="mt-1 space-y-1">
                {newFoods.map((f, i) => {
                  const item = foods.find((fd) => fd.id === f.foodItemId);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-card px-2 py-1 text-xs"
                    >
                      <span className="text-body">
                        {item?.name} &times;{f.quantity}
                        <span className="ml-2 text-faint">
                          {Math.round((item?.calories || 0) * f.quantity)} cal
                        </span>
                      </span>
                      <button
                        onClick={() => removeFoodFromMeal(i)}
                        className="text-faint hover:text-danger-text"
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
                className={`flex-1 ${inputSm}`}
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
                className="w-16 rounded-md border border-input-border bg-card px-2 py-1.5 text-sm text-heading"
              />
              <button
                onClick={addFoodToMeal}
                disabled={!addFoodId}
                className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {foods.length === 0 && (
              <p className="mt-1 text-xs text-warning-text">
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
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={addMealToPlan}
              disabled={newFoods.length === 0}
              className={btnPrimary}
            >
              Add to Plan
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {meals.length === 0 && !showAdd ? (
          <div className={emptyState}>
            <p className="text-muted">No meals in your plan yet</p>
            <p className="mt-1 text-sm text-faint">
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
                className="flex items-start justify-between rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-heading">
                      {MEAL_LABELS[meal.mealType]}
                    </span>
                    <span className="text-xs text-faint">{meal.time}</span>
                    <span className="text-xs text-success-text">
                      {Math.round(mealCal)} cal
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{daysList}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {meal.foods
                      .map((f) => `${f.name} ×${f.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => removeMealFromPlan(i)}
                  className={deleteBtn}
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
