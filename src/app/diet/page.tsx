"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────── */

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

interface SearchResult {
  fdcId: string;
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
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  calcium: number;
  iron: number;
  potassium: number;
}

type Tab = "library" | "diet";

/* ── Page wrapper ──────────────────────────────────── */

export default function DietPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-gray-400">Loading...</p>}
    >
      <DietContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function DietContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "library";

  const setTab = (t: Tab) => router.push(`/diet?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "library", label: "Food Library" },
    { key: "diet", label: "Diet" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Diet & Nutrition
      </h1>

      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "library" && <FoodLibraryTab />}
      {tab === "diet" && <DietRoutineTab />}
    </div>
  );
}

/* ── Food Library Tab ──────────────────────────────── */

function FoodLibraryTab() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchFoods = useCallback(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then((data) => setFoods(data));
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const search = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(
      `/api/foods/search?q=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();
    setSearchResults(data);
    setSearching(false);
  };

  const saveFood = async (result: SearchResult) => {
    setSaving(result.fdcId);
    await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        brand: result.brand,
        servingSize: result.servingSize,
        servingUnit: result.servingUnit,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        sugar: result.sugar,
        sodium: result.sodium,
        vitaminA: result.vitaminA,
        vitaminC: result.vitaminC,
        vitaminD: result.vitaminD,
        calcium: result.calcium,
        iron: result.iron,
        potassium: result.potassium,
        externalId: String(result.fdcId),
        source: "USDA",
      }),
    });
    setSaving(null);
    fetchFoods();
  };

  const deleteFood = async (id: string) => {
    await fetch(`/api/foods/${id}`, { method: "DELETE" });
    fetchFoods();
  };

  return (
    <div className="space-y-6">
      {/* Search USDA */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Search USDA Food Database
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search for a food (e.g. chicken breast, brown rice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={search}
            disabled={searching || !searchQuery.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {searchResults.length} results — click &quot;Save&quot; to add to
              your library
            </p>
            {searchResults.map((r) => (
              <div
                key={r.fdcId}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {r.name}
                  </p>
                  {r.brand && (
                    <p className="text-xs text-gray-400">{r.brand}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(r.calories)} cal · {Math.round(r.protein)}g P ·{" "}
                    {Math.round(r.carbs)}g C · {Math.round(r.fat)}g F
                    <span className="ml-2 text-gray-400">
                      per {r.servingSize}
                      {r.servingUnit}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => saveFood(r)}
                  disabled={saving === r.fdcId}
                  className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400"
                >
                  {saving === r.fdcId ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved foods */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Your Food Library ({foods.length})
        </h3>
        {foods.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              No saved foods yet
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Search above to find and save foods
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Food
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Cal
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Protein
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Carbs
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Fat
                  </th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {foods.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {f.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        per {f.servingSize}
                        {f.servingUnit}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Math.round(f.calories)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Math.round(f.protein)}g
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Math.round(f.carbs)}g
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Math.round(f.fat)}g
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteFood(f.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


/* ── Diet Routine Tab ────────────────────────────────── */

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

interface MealPlan {
  mealType: string;
  time: string;
  days: string;
  foods: { foodItemId: string; quantity: number; name: string; calories: number }[];
}

function DietRoutineTab() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [newMealType, setNewMealType] = useState("BREAKFAST");
  const [newTime, setNewTime] = useState("08:00");
  const [newDays, setNewDays] = useState("mon,tue,wed,thu,fri,sat,sun");
  const [newFoods, setNewFoods] = useState<{ foodItemId: string; quantity: number }[]>([]);
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
      { mealType: newMealType, time: newTime, days: newDays, foods: foodDetails },
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
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Meal Type</label>
              <select value={newMealType} onChange={(e) => setNewMealType(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                {MEAL_TYPES.map((t) => (<option key={t} value={t}>{MEAL_LABELS[t]}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Time</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Days</label>
              <div className="mt-1 flex gap-1">
                {WEEKDAYS.map((day) => {
                  const active = newDays.includes(day);
                  return (
                    <button key={day} onClick={() => { const current = newDays.split(",").filter(Boolean); const next = active ? current.filter((d) => d !== day) : [...current, day]; setNewDays(next.join(",")); }} className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${active ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"}`}>
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Foods</label>
            {newFoods.length > 0 && (
              <div className="mt-1 space-y-1">
                {newFoods.map((f, i) => {
                  const item = foods.find((fd) => fd.id === f.foodItemId);
                  return (
                    <div key={i} className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-gray-800">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item?.name} &times;{f.quantity}
                        <span className="ml-2 text-gray-400">{Math.round((item?.calories || 0) * f.quantity)} cal</span>
                      </span>
                      <button onClick={() => removeFoodFromMeal(i)} className="text-gray-400 hover:text-red-500">&times;</button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-1 flex gap-2">
              <select value={addFoodId} onChange={(e) => setAddFoodId(e.target.value)} className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="">Select food...</option>
                {foods.map((f) => (<option key={f.id} value={f.id}>{f.name} ({Math.round(f.calories)} cal)</option>))}
              </select>
              <input type="number" step="0.5" min="0.5" value={addFoodQty} onChange={(e) => setAddFoodQty(e.target.value)} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <button onClick={addFoodToMeal} disabled={!addFoodId} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Add</button>
            </div>
            {foods.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No foods saved. Add foods in the Food Library tab first.</p>
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); setNewFoods([]); }} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</button>
            <button onClick={addMealToPlan} disabled={newFoods.length === 0} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Add to Plan</button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {meals.length === 0 && !showAdd ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">No meals in your plan yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Add meals to build your weekly diet routine</p>
          </div>
        ) : (
          meals.map((meal, i) => {
            const mealCal = meal.foods.reduce((s, f) => s + f.calories, 0);
            const daysList = meal.days.split(",").map((d) => WEEKDAY_LABELS[d]?.slice(0, 3) || d).join(", ");
            return (
              <div key={i} className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{MEAL_LABELS[meal.mealType]}</span>
                    <span className="text-xs text-gray-400">{meal.time}</span>
                    <span className="text-xs text-green-600 dark:text-green-400">{Math.round(mealCal)} cal</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{daysList}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{meal.foods.map((f) => `${f.name} ×${f.quantity}`).join(", ")}</p>
                </div>
                <button onClick={() => removeMealFromPlan(i)} className="rounded p-1 text-gray-300 hover:text-red-500 dark:text-gray-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
