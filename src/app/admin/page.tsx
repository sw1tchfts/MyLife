"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { SCREEN_NAMES, SECTION_HEADINGS } from "@/lib/screens";

interface Category {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

export default function AdminPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [appSettings, setAppSettings] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    fetch("/api/settings/app")
      .then((r) => r.json())
      .then(setAppSettings);
  }, []);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
    });
    const cat = await res.json();
    setCategories((prev) =>
      [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setNewCategoryName("");
    setNewCategoryColor("#3B82F6");
  };

  const updateCategory = async (id: string) => {
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, color: editColor }),
    });
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: editName, color: editColor } : c,
      ),
    );
    setEditingId(null);
  };

  const deleteCategory = (id: string) => {
    const deleted = categories.find((c) => c.id === id);
    if (!deleted) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast({
      message: `Deleted "${deleted.name}"`,
      onUndo: () =>
        setCategories((prev) =>
          [...prev, deleted].sort((a, b) => a.name.localeCompare(b.name)),
        ),
      onExpire: () => {
        fetch(`/api/categories/${id}`, { method: "DELETE" });
      },
    });
  };

  const saveAppSettings = async () => {
    setSaving(true);
    await fetch("/api/settings/app", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appSettings),
    });
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {SCREEN_NAMES.admin}
        </h1>
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
          Back to Tasks
        </Link>
      </div>

      {/* Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {SECTION_HEADINGS.categories}
        </h2>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCategoryColor(c)}
                className={`h-9 w-9 rounded-full border-2 ${newCategoryColor === c ? "border-gray-900 dark:border-gray-100" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={addCategory}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3"
            >
              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-1 text-sm"
                  />
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`h-6 w-6 rounded-full border-2 ${editColor === c ? "border-gray-900 dark:border-gray-100" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => updateCategory(cat.id)}
                    className="text-sm text-green-600 hover:text-green-500"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-400 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-sm font-medium dark:text-gray-100">
                    {cat.name}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                      setEditColor(cat.color);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No categories yet.
            </p>
          )}
        </ul>
      </div>

      {/* Default Settings */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {SECTION_HEADINGS.defaultTaskSettings}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Priority
            </label>
            <select
              value={appSettings.defaultPriority || "MEDIUM"}
              onChange={(e) =>
                setAppSettings((s) => ({
                  ...s,
                  defaultPriority: e.target.value,
                }))
              }
              className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Status
            </label>
            <select
              value={appSettings.defaultStatus || "TODO"}
              onChange={(e) =>
                setAppSettings((s) => ({
                  ...s,
                  defaultStatus: e.target.value,
                }))
              }
              className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
          <button
            onClick={saveAppSettings}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Defaults"}
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {SECTION_HEADINGS.dataExport}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download your data as CSV or JSON files.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              {
                type: "tasks",
                label: "Tasks",
                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
              },
              {
                type: "journal",
                label: "Journal Entries",
                icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
              },
              {
                type: "metrics",
                label: "Body Metrics",
                icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
              },
            ] as const
          ).map((item) => (
            <div
              key={item.type}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/api/export?type=${item.type}&format=csv`}
                  download
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  CSV
                </a>
                <a
                  href={`/api/export?type=${item.type}&format=json`}
                  download
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  JSON
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
