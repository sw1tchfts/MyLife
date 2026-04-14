"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";

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

export default function FoodLibraryTab() {
  const { showToast } = useToast();
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

  const deleteFood = (id: string) => {
    const deleted = foods.find((f) => f.id === id);
    if (!deleted) return;
    setFoods((prev) => prev.filter((f) => f.id !== id));
    showToast({
      message: `Deleted "${deleted.name}"`,
      onUndo: () => setFoods((prev) => [...prev, deleted]),
      onExpire: () => {
        fetch(`/api/foods/${id}`, { method: "DELETE" });
      },
    });
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
