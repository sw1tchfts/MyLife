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

interface NutritionLog {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface BodyMetric {
  id: string;
  date: string;
  type: string;
  value: number;
  unit: string;
}

type Tab = "library" | "nutrition" | "metrics";

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
    { key: "nutrition", label: "Nutrition Log" },
    { key: "metrics", label: "Body Metrics" },
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
      {tab === "nutrition" && <NutritionTab />}
      {tab === "metrics" && <BodyMetricsTab />}
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
        externalId: result.fdcId,
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

/* ── Nutrition Log Tab ─────────────────────────────── */

function NutritionTab() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    fetch(
      `/api/nutrition?from=${weekAgo.toISOString()}&to=${today.toISOString()}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <p className="text-center text-gray-400">Loading nutrition data...</p>
    );

  // Group by date
  const byDate = new Map<string, NutritionLog[]>();
  for (const log of logs) {
    const key = new Date(log.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(log);
  }

  const dailyTotals = Array.from(byDate.entries()).map(([date, dayLogs]) => ({
    date,
    calories: Math.round(dayLogs.reduce((s, l) => s + l.calories, 0)),
    protein: Math.round(dayLogs.reduce((s, l) => s + l.protein, 0)),
    carbs: Math.round(dayLogs.reduce((s, l) => s + l.carbs, 0)),
    fat: Math.round(dayLogs.reduce((s, l) => s + l.fat, 0)),
    meals: dayLogs.length,
  }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Last 7 days — nutrition is logged when you mark a meal task as done.
      </p>

      {dailyTotals.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No nutrition data yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Create meal tasks with foods, then mark them done to log nutrition
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dailyTotals.map((day) => (
            <div
              key={day.date}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {day.date}
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {day.meals} meal{day.meals !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {day.calories}
                  </p>
                  <p className="text-xs text-gray-400">Calories</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">
                    {day.protein}g
                  </p>
                  <p className="text-xs text-gray-400">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">
                    {day.carbs}g
                  </p>
                  <p className="text-xs text-gray-400">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-500">{day.fat}g</p>
                  <p className="text-xs text-gray-400">Fat</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Body Metrics Tab ──────────────────────────────── */

function BodyMetricsTab() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [metricType, setMetricType] = useState("WEIGHT");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("lbs");
  const [adding, setAdding] = useState(false);

  const fetchMetrics = useCallback(() => {
    fetch("/api/body-metrics")
      .then((r) => r.json())
      .then((data) => setMetrics(data));
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const addMetric = async () => {
    if (!value) return;
    setAdding(true);
    await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        type: metricType,
        value: parseFloat(value),
        unit,
      }),
    });
    setValue("");
    setAdding(false);
    fetchMetrics();
  };

  const deleteMetric = async (id: string) => {
    await fetch(`/api/body-metrics/${id}`, { method: "DELETE" });
    fetchMetrics();
  };

  const METRIC_TYPES = [
    { value: "WEIGHT", label: "Weight", defaultUnit: "lbs" },
    { value: "BODY_FAT", label: "Body Fat %", defaultUnit: "%" },
    { value: "HEIGHT", label: "Height", defaultUnit: "in" },
    { value: "WAIST", label: "Waist", defaultUnit: "in" },
    { value: "CHEST", label: "Chest", defaultUnit: "in" },
    { value: "BMI", label: "BMI", defaultUnit: "" },
  ];

  // Group metrics by type for display
  const byType = new Map<string, BodyMetric[]>();
  for (const m of metrics) {
    if (!byType.has(m.type)) byType.set(m.type, []);
    byType.get(m.type)!.push(m);
  }

  return (
    <div className="space-y-6">
      {/* Add metric */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Log a Measurement
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={metricType}
            onChange={(e) => {
              setMetricType(e.target.value);
              const mt = METRIC_TYPES.find((t) => t.value === e.target.value);
              if (mt) setUnit(mt.defaultUnit);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {METRIC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMetric()}
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={addMetric}
            disabled={adding || !value}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Log
          </button>
        </div>
      </div>

      {/* Metrics by type */}
      {byType.size === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No measurements yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Log your weight, body fat, or other measurements above
          </p>
        </div>
      ) : (
        Array.from(byType.entries()).map(([type, items]) => {
          const label =
            METRIC_TYPES.find((t) => t.value === type)?.label || type;
          const sorted = [...items].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          const latest = sorted[0];
          const prev = sorted[1];
          const change =
            prev && latest ? (latest.value - prev.value).toFixed(1) : null;

          return (
            <div
              key={type}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {label}
                </h3>
                {latest && (
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {latest.value}
                    </span>
                    <span className="ml-1 text-sm text-gray-400">
                      {latest.unit}
                    </span>
                    {change && (
                      <span
                        className={`ml-2 text-xs ${parseFloat(change) > 0 ? "text-red-500" : parseFloat(change) < 0 ? "text-green-500" : "text-gray-400"}`}
                      >
                        {parseFloat(change) > 0 ? "+" : ""}
                        {change}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {sorted.slice(0, 10).map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-400 dark:text-gray-500">
                      {new Date(m.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        {m.value} {m.unit}
                      </span>
                      <button
                        onClick={() => deleteMetric(m.id)}
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
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
