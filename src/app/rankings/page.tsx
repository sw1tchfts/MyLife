"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

/* ── Types ─────────────────────────────────────────── */

interface RankingCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  _count: { items: number; comparisons: number };
}

interface RankingItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string;
  elo: number;
  wins: number;
  losses: number;
  ties: number;
  categoryId: string;
}

type Tab = "categories" | "items" | "compare" | "rankings" | "stats";

/* ── Main page wrapper with Suspense ───────────────── */

export default function RankingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <RankingsContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function RankingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "categories";
  const categoryId = searchParams.get("category") || "";

  const [categories, setCategories] = useState<RankingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    (RankingCategory & { items: RankingItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(() => {
    fetch("/api/rankings/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  const fetchCategory = useCallback((id: string) => {
    fetch(`/api/rankings/categories/${id}`)
      .then((r) => r.json())
      .then((data) => setSelectedCategory(data));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (categoryId) fetchCategory(categoryId);
  }, [categoryId, fetchCategory]);

  const setTab = (t: Tab) => {
    const params = new URLSearchParams();
    params.set("tab", t);
    if (categoryId) params.set("category", categoryId);
    router.push(`/rankings?${params.toString()}`);
  };

  const selectCategory = (id: string, t: Tab = "items") => {
    router.push(`/rankings?tab=${t}&category=${id}`);
  };

  const TABS: { key: Tab; label: string; needsCategory?: boolean }[] = [
    { key: "categories", label: "Categories" },
    { key: "items", label: "Items", needsCategory: true },
    { key: "compare", label: "Compare", needsCategory: true },
    { key: "rankings", label: "Rankings", needsCategory: true },
    { key: "stats", label: "Stats", needsCategory: true },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Pairwise Ranker
      </h1>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => {
          if (t.needsCategory && !categoryId) return null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          );
        })}
        {categoryId && selectedCategory && (
          <div className="ml-auto flex items-center text-xs text-gray-400 dark:text-gray-500">
            List: {selectedCategory.name}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : (
        <>
          {tab === "categories" && (
            <CategoriesTab
              categories={categories}
              onSelect={selectCategory}
              onRefresh={fetchCategories}
            />
          )}
          {tab === "items" && categoryId && selectedCategory && (
            <ItemsTab
              category={selectedCategory}
              onRefresh={() => fetchCategory(categoryId)}
            />
          )}
          {tab === "compare" && categoryId && selectedCategory && (
            <CompareTab
              categoryId={categoryId}
              onComparisonDone={() => fetchCategory(categoryId)}
            />
          )}
          {tab === "rankings" && categoryId && selectedCategory && (
            <RankingsTab category={selectedCategory} />
          )}
          {tab === "stats" && categoryId && selectedCategory && (
            <StatsTab categoryId={categoryId} category={selectedCategory} />
          )}
        </>
      )}
    </div>
  );
}

/* ── Categories Tab ────────────────────────────────── */

function CategoriesTab({
  categories,
  onSelect,
  onRefresh,
}: {
  categories: RankingCategory[];
  onSelect: (id: string, tab?: Tab) => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/rankings/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description }),
    });
    setName("");
    setDescription("");
    setCreating(false);
    onRefresh();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/rankings/categories/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Create new */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          New Ranking List
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="List name (e.g. Best Movies)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={create}
            disabled={creating || !name.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>

      {/* List */}
      {categories.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No ranking lists yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Create one above to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <button onClick={() => onSelect(cat.id)} className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {cat.description}
                    </p>
                  )}
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="rounded p-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span>{cat._count.items} items</span>
                <span>{cat._count.comparisons} comparisons</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onSelect(cat.id, "compare")}
                  className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  Compare
                </button>
                <button
                  onClick={() => onSelect(cat.id, "rankings")}
                  className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Rankings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Items Tab ─────────────────────────────────────── */

function ItemsTab({
  category,
  onRefresh,
}: {
  category: { id: string; items: RankingItem[] };
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [adding, setAdding] = useState(false);

  const addItem = async () => {
    if (!title.trim()) return;
    setAdding(true);
    await fetch("/api/rankings/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description,
        tags,
        categoryId: category.id,
      }),
    });
    setTitle("");
    setDescription("");
    setTags("");
    setAdding(false);
    onRefresh();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/rankings/items/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Add Item
        </h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={addItem}
            disabled={adding || !title.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Items list */}
      {category.items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">No items yet</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Add items above, then start comparing
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Elo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  W/L/T
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {category.items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.tags && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.split(",").map((tag, i) => (
                          <span
                            key={i}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                    {Math.round(item.elo)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {item.wins}/{item.losses}/{item.ties}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteItem(item.id)}
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
  );
}

/* ── Compare Tab ───────────────────────────────────── */

function CompareTab({
  categoryId,
  onComparisonDone,
}: {
  categoryId: string;
  onComparisonDone: () => void;
}) {
  const [left, setLeft] = useState<RankingItem | null>(null);
  const [right, setRight] = useState<RankingItem | null>(null);
  const [loadingPair, setLoadingPair] = useState(true);
  const [error, setError] = useState("");
  const [totalDone, setTotalDone] = useState(0);

  const fetchPair = useCallback(() => {
    setLoadingPair(true);
    setError("");
    fetch(`/api/rankings/compare?categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setLeft(data.left);
          setRight(data.right);
        }
        setLoadingPair(false);
      });
  }, [categoryId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rankings/compare?categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setLeft(data.left);
          setRight(data.right);
        }
        setLoadingPair(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const submitChoice = async (result: "LEFT" | "RIGHT" | "TIE" | "SKIP") => {
    if (!left || !right) return;
    await fetch("/api/rankings/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leftItemId: left.id,
        rightItemId: right.id,
        categoryId,
        result,
      }),
    });
    setTotalDone((n) => n + 1);
    onComparisonDone();
    fetchPair();
  };

  if (error) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Add more items to start comparing
        </p>
      </div>
    );
  }

  if (loadingPair || !left || !right) {
    return <p className="text-center text-gray-400">Loading matchup...</p>;
  }

  return (
    <div className="space-y-6">
      {totalDone > 0 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          {totalDone} comparison{totalDone !== 1 ? "s" : ""} this session
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Left item */}
        <button
          onClick={() => submitChoice("LEFT")}
          className="group rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
        >
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-gray-100">
            {left.title}
          </h3>
          {left.description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {left.description}
            </p>
          )}
          {left.tags && (
            <div className="mt-3 flex flex-wrap gap-1">
              {left.tags.split(",").map((t, i) => (
                <span
                  key={i}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-center text-xs font-medium text-gray-400 group-hover:text-blue-500">
            Click to pick this one
          </p>
        </button>

        {/* VS divider */}
        <div className="flex items-center justify-center">
          <span className="text-2xl font-black text-gray-300 dark:text-gray-600">
            VS
          </span>
        </div>

        {/* Right item */}
        <button
          onClick={() => submitChoice("RIGHT")}
          className="group rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
        >
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-gray-100">
            {right.title}
          </h3>
          {right.description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {right.description}
            </p>
          )}
          {right.tags && (
            <div className="mt-3 flex flex-wrap gap-1">
              {right.tags.split(",").map((t, i) => (
                <span
                  key={i}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-center text-xs font-medium text-gray-400 group-hover:text-blue-500">
            Click to pick this one
          </p>
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => submitChoice("TIE")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Tie / Equal
        </button>
        <button
          onClick={() => submitChoice("SKIP")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/* ── Rankings Tab ──────────────────────────────────── */

function RankingsTab({
  category,
}: {
  category: { items: RankingItem[]; _count: { comparisons: number } };
}) {
  const items = [...category.items].sort((a, b) => b.elo - a.elo);
  const maxElo = items.length > 0 ? items[0].elo : 1500;
  const minElo = items.length > 0 ? items[items.length - 1].elo : 1500;
  const eloRange = maxElo - minElo || 1;

  // Assign tiers: top 20% = S, next 20% = A, next 20% = B, next 20% = C, bottom 20% = D
  const getTier = (index: number, total: number) => {
    if (total <= 1) return "S";
    const pct = index / (total - 1);
    if (pct <= 0.2) return "S";
    if (pct <= 0.4) return "A";
    if (pct <= 0.6) return "B";
    if (pct <= 0.8) return "C";
    return "D";
  };

  const tierColors: Record<string, string> = {
    S: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    C: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    D: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">No items to rank</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const total = item.wins + item.losses + item.ties;
        const stability = Math.min(100, Math.round((total / 10) * 100));
        const tier = getTier(i, items.length);
        const barWidth =
          eloRange > 0
            ? Math.max(5, ((item.elo - minElo) / eloRange) * 100)
            : 100;

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Rank number */}
            <span className="w-8 text-center text-lg font-bold text-gray-300 dark:text-gray-600">
              {i + 1}
            </span>

            {/* Tier badge */}
            <span
              className={`w-8 rounded px-1.5 py-0.5 text-center text-xs font-bold ${tierColors[tier]}`}
            >
              {tier}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                  {Math.round(item.elo)}
                </span>
              </div>
              {/* Elo bar */}
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="mt-1 flex gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                <span>
                  {item.wins}W / {item.losses}L / {item.ties}T
                </span>
                <span>Stability: {stability}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Stats Tab ─────────────────────────────────────── */

function StatsTab({
  category,
}: {
  categoryId: string;
  category: { items: RankingItem[]; _count: { comparisons: number } };
}) {
  const items = [...category.items].sort((a, b) => b.elo - a.elo);
  const totalComparisons = category._count.comparisons;
  const totalItems = items.length;
  const maxPossiblePairs = (totalItems * (totalItems - 1)) / 2;
  const avgComparisons =
    totalItems > 0
      ? Math.round(
          items.reduce((sum, i) => sum + i.wins + i.losses + i.ties, 0) /
            totalItems,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalItems}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Items</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalComparisons}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Comparisons
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {maxPossiblePairs}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Possible Pairs
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {avgComparisons}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Avg per Item
          </p>
        </div>
      </div>

      {/* Per-item stats */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Item Statistics
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((item) => {
            const total = item.wins + item.losses + item.ties;
            const winRate =
              total > 0 ? Math.round((item.wins / total) * 100) : 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Elo {Math.round(item.elo)} · {total} matchups
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-600">{item.wins}W</span>
                  <span className="text-red-500">{item.losses}L</span>
                  <span className="text-gray-400">{item.ties}T</span>
                  <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                    {winRate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
