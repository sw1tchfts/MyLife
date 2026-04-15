"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  panel,
  input as inputCls,
  btnPrimary,
  emptyState,
  deleteBtn,
} from "@/lib/styles";

interface RankingList {
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

interface RankingListDetail extends RankingList {
  items: RankingItem[];
}

export default function ItemsTab({
  list,
  allLists,
  onRefresh,
}: {
  list: RankingListDetail;
  allLists: RankingList[];
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const items = list.items.filter((i) => !hiddenIds.has(i.id));
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

  const deleteItem = (id: string) => {
    const deleted = list.items.find((t) => t.id === id);
    if (!deleted) return;
    setHiddenIds((prev) => new Set(prev).add(id));
    showToast({
      message: `Deleted "${deleted.title}"`,
      onUndo: () =>
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      onExpire: () => {
        fetch(`/api/rankings/items/${id}`, { method: "DELETE" });
      },
    });
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
      <div className={`${panel} p-4`}>
        <h3 className="mb-3 text-sm font-semibold text-body">
          Add Item to &quot;{list.name}&quot;
        </h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className={`${inputCls} mt-0 flex-1`}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} mt-0 flex-1`}
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={`${inputCls} mt-0`}
          />
          <button
            onClick={addItem}
            disabled={adding || !title.trim()}
            className={btnPrimary}
          >
            Add
          </button>
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className={emptyState}>
          <p className="text-muted">No items yet</p>
          <p className="mt-1 text-sm text-faint">
            Add items above, then start comparing
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto ${panel}`}>
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                  Elo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                  W/L/T
                </th>
                {allLists.length > 1 && (
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                    List
                  </th>
                )}
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-elevated"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-heading">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-faint">
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
                            className="rounded bg-elevated px-1.5 py-0.5 text-xs text-muted"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-body">
                    {Math.round(item.elo)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {item.wins}/{item.losses}/{item.ties}
                  </td>
                  {allLists.length > 1 && (
                    <td className="px-4 py-3">
                      <select
                        value={item.categoryId}
                        onChange={(e) => moveItem(item.id, e.target.value)}
                        className="rounded border border-input-border bg-card px-2 py-1 text-xs text-body"
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
  );
}
