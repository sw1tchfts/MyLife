"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  pageTitle,
  panel,
  input as inputCls,
  btnPrimary,
  emptyState,
  deleteBtn,
} from "@/lib/styles";

const ItemsTab = dynamic(() => import("@/components/rankings/ItemsTab"));
const CompareTab = dynamic(() => import("@/components/rankings/CompareTab"));
const RankingsTab = dynamic(() => import("@/components/rankings/RankingsTab"));
const StatsTab = dynamic(() => import("@/components/rankings/StatsTab"));

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
          <p className="text-muted">Loading...</p>
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
        <h1 className={pageTitle}>Pairwise Ranker</h1>
        <button
          onClick={() => setShowManage(!showManage)}
          className="rounded-md border border-input-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-elevated"
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
        <p className="text-center text-muted">Loading...</p>
      ) : lists.length === 0 ? (
        <div className={emptyState}>
          <p className="text-muted">No ranking lists yet</p>
          <p className="mt-1 text-sm text-faint">
            Click &quot;Manage Lists&quot; above to create one
          </p>
        </div>
      ) : (
        <>
          {/* List dropdown + tab bar */}
          <div className="mb-6 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center">
            <select
              value={listId}
              onChange={(e) => selectList(e.target.value)}
              className="rounded-md border border-input-border bg-card px-3 py-1.5 text-sm font-medium text-heading"
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
                        ? "bg-accent text-white"
                        : "text-muted hover:bg-elevated"
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
            <div className="py-12 text-center text-muted">
              Select a list above to get started
            </div>
          ) : !selectedList ? (
            <p className="text-center text-muted">Loading...</p>
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
    <div className={`${panel} mb-6 p-4`}>
      <h3 className="mb-3 text-sm font-semibold text-body">
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
          className={`${inputCls} mt-0 flex-1`}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputCls} mt-0 flex-1`}
        />
        <button
          onClick={create}
          disabled={creating || !name.trim()}
          className={btnPrimary}
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
                l.id === currentListId ? "bg-accent-soft" : "hover:bg-elevated"
              }`}
            >
              <button
                onClick={() => onSelect(l.id)}
                className="text-left text-sm text-body"
              >
                <span className="font-medium">{l.name}</span>
                <span className="ml-2 text-xs text-faint">
                  {l._count.items} items · {l._count.comparisons} comparisons
                </span>
              </button>
              <button
                onClick={() => deleteList(l.id)}
                className={deleteBtn}
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
