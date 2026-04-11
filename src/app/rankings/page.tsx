"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

/* ── Types ─────────────────────────────────────────── */

interface RankingList {
  id: string;
  name: string;
  description: string;
  color: string;
  _count: { items: number; comparisons: number };
}

interface RankingListDetail extends RankingList {
  items: RankingItem[];
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

type Tab = "items" | "compare" | "rankings" | "stats";

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
  const tab = (searchParams.get("tab") as Tab) || "items";
  const listId = searchParams.get("list") || "";

  const [lists, setLists] = useState<RankingList[]>([]);
  const [selectedList, setSelectedList] = useState<RankingListDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showManage, setShowManage] = useState(false);

  const fetchLists = useCallback(() => {
    fetch("/api/rankings/categories")
      .then((r) => r.json())
      .then((data) => {
        setLists(data);
        setLoading(false);
      });
  }, []);

  const fetchList = useCallback((id: string) => {
    fetch(`/api/rankings/categories/${id}`)
      .then((r) => r.json())
      .then((data) => setSelectedList(data));
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (!listId) return;
    fetchList(listId);
  }, [listId, fetchList]);

  const navigate = (t: Tab, lid?: string) => {
    const params = new URLSearchParams();
    params.set("tab", t);
    const id = lid ?? listId;
    if (id) params.set("list", id);
    router.push(`/rankings?${params.toString()}`);
  };

  const selectList = (id: string) => {
    navigate(tab, id);
  };

  const refreshAll = () => {
    fetchLists();
    if (listId) fetchList(listId);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "items", label: "Items" },
    { key: "compare", label: "Compare" },
    { key: "rankings", label: "Rankings" },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Pairwise Ranker
        </h1>
        <button
          onClick={() => setShowManage(!showManage)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {showManage ? "Hide" : "Manage Lists"}
        </button>
      </div>

      {/* Manage lists panel */}
      {showManage && (
        <ManageListsPanel
          lists={lists}
          onRefresh={fetchLists}
          onSelect={(id) => {
            selectList(id);
            setShowManage(false);
          }}
          currentListId={listId}
        />
      )}

      {/* List selector + tabs */}
      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : lists.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No ranking lists yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Click &quot;Manage Lists&quot; above to create one
          </p>
        </div>
      ) : (
        <>
          {/* List dropdown + tab bar */}
          <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center dark:border-gray-700">
            <select
              value={listId}
              onChange={(e) => selectList(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Select a list...</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l._count.items} items)
                </option>
              ))}
            </select>

            {listId && (
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => navigate(t.key)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      tab === t.key
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab content */}
          {!listId ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              Select a list above to get started
            </div>
          ) : !selectedList ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : (
            <>
              {tab === "items" && (
                <ItemsTab
                  list={selectedList}
                  allLists={lists}
                  onRefresh={refreshAll}
                />
              )}
              {tab === "compare" && (
                <CompareTab
                  listId={listId}
                  onComparisonDone={() => fetchList(listId)}
                />
              )}
              {tab === "rankings" && <RankingsTab list={selectedList} />}
              {tab === "stats" && <StatsTab list={selectedList} />}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Manage Lists Panel ────────────────────────────── */

function ManageListsPanel({
  lists,
  onRefresh,
  onSelect,
  currentListId,
}: {
  lists: RankingList[];
  onRefresh: () => void;
  onSelect: (id: string) => void;
  currentListId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/rankings/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description }),
    });
    const data = await res.json();
    setName("");
    setDescription("");
    setCreating(false);
    onRefresh();
    onSelect(data.id);
  };

  const deleteList = async (id: string) => {
    await fetch(`/api/rankings/categories/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Manage Ranking Lists
      </h3>

      {/* Create form */}
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

      {/* Existing lists */}
      {lists.length > 0 && (
        <div className="mt-3 space-y-1">
          {lists.map((l) => (
            <div
              key={l.id}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${
                l.id === currentListId
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <button
                onClick={() => onSelect(l.id)}
                className="text-left text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="font-medium">{l.name}</span>
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                  {l._count.items} items · {l._count.comparisons} comparisons
                </span>
              </button>
              <button
                onClick={() => deleteList(l.id)}
                className="rounded p-1 text-gray-300 hover:text-red-500 dark:text-gray-600"
                title="Delete list"
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
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Items Tab ─────────────────────────────────────── */

function ItemsTab({
  list,
  allLists,
  onRefresh,
}: {
  list: RankingListDetail;
  allLists: RankingList[];
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
        categoryId: list.id,
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

  const moveItem = async (itemId: string, newListId: string) => {
    await fetch(`/api/rankings/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: newListId }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Add Item to &quot;{list.name}&quot;
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
      {list.items.length === 0 ? (
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
                {allLists.length > 1 && (
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    List
                  </th>
                )}
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {list.items.map((item) => (
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
                  <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                    {Math.round(item.elo)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {item.wins}/{item.losses}/{item.ties}
                  </td>
                  {allLists.length > 1 && (
                    <td className="px-4 py-3">
                      <select
                        value={item.categoryId}
                        onChange={(e) => moveItem(item.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {allLists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
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
  listId,
  onComparisonDone,
}: {
  listId: string;
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
    fetch(`/api/rankings/compare?categoryId=${listId}`)
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
  }, [listId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rankings/compare?categoryId=${listId}`)
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
  }, [listId]);

  const submitChoice = async (result: "LEFT" | "RIGHT" | "TIE" | "SKIP") => {
    if (!left || !right) return;
    await fetch("/api/rankings/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leftItemId: left.id,
        rightItemId: right.id,
        categoryId: listId,
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
  list,
}: {
  list: { items: RankingItem[]; _count: { comparisons: number } };
}) {
  const items = [...list.items].sort((a, b) => b.elo - a.elo);
  const maxElo = items.length > 0 ? items[0].elo : 1500;
  const minElo = items.length > 0 ? items[items.length - 1].elo : 1500;
  const eloRange = maxElo - minElo || 1;

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
            <span className="w-8 text-center text-lg font-bold text-gray-300 dark:text-gray-600">
              {i + 1}
            </span>
            <span
              className={`w-8 rounded px-1.5 py-0.5 text-center text-xs font-bold ${tierColors[tier]}`}
            >
              {tier}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                  {Math.round(item.elo)}
                </span>
              </div>
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
  list,
}: {
  list: { items: RankingItem[]; _count: { comparisons: number } };
}) {
  const items = [...list.items].sort((a, b) => b.elo - a.elo);
  const totalComparisons = list._count.comparisons;
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
