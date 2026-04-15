"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  panel,
  inputSm,
  btnPrimary,
  emptyState,
  deleteBtn,
  labelSm,
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
      <div className={`${panel} p-4`}>
        <h3 className="mb-3 text-sm font-semibold text-body">
          Search USDA Food Database
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search for a food (e.g. chicken breast, brown rice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className={`flex-1 ${inputSm}`}
          />
          <button
            onClick={search}
            disabled={searching || !searchQuery.trim()}
            className={btnPrimary}
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className={labelSm}>
              {searchResults.length} results — click &quot;Save&quot; to add to
              your library
            </p>
            {searchResults.map((r) => (
              <div
                key={r.fdcId}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-heading">{r.name}</p>
                  {r.brand && <p className="text-xs text-faint">{r.brand}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {Math.round(r.calories)} cal · {Math.round(r.protein)}g P ·{" "}
                    {Math.round(r.carbs)}g C · {Math.round(r.fat)}g F
                    <span className="ml-2 text-faint">
                      per {r.servingSize}
                      {r.servingUnit}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => saveFood(r)}
                  disabled={saving === r.fdcId}
                  className="rounded-md bg-success-soft px-3 py-1.5 text-xs font-medium text-success-text disabled:opacity-50"
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
        <h3 className="mb-3 text-sm font-semibold text-body">
          Your Food Library ({foods.length})
        </h3>
        {foods.length === 0 ? (
          <div className={emptyState}>
            <p className="text-muted">No saved foods yet</p>
            <p className="mt-1 text-sm text-faint">
              Search above to find and save foods
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${panel}`}>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                    Food
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-muted uppercase">
                    Cal
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-muted uppercase">
                    Protein
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-muted uppercase">
                    Carbs
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wide text-muted uppercase">
                    Fat
                  </th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {foods.map((f) => (
                  <tr key={f.id} className="hover:bg-elevated">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-heading">
                        {f.name}
                      </p>
                      <p className="text-xs text-faint">
                        per {f.servingSize}
                        {f.servingUnit}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-body">
                      {Math.round(f.calories)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-body">
                      {Math.round(f.protein)}g
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-body">
                      {Math.round(f.carbs)}g
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-body">
                      {Math.round(f.fat)}g
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteFood(f.id)}
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
