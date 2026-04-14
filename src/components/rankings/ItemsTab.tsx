"use client";

import { useState } from "react";

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
