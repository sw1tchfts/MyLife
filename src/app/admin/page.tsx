"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Stats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
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
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((tasks) => {
        const now = new Date();
        setStats({
          total: tasks.length,
          todo: tasks.filter((t: { status: string }) => t.status === "TODO")
            .length,
          inProgress: tasks.filter(
            (t: { status: string }) => t.status === "IN_PROGRESS",
          ).length,
          done: tasks.filter((t: { status: string }) => t.status === "DONE")
            .length,
          overdue: tasks.filter(
            (t: { status: string; dueDate: string | null }) =>
              t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE",
          ).length,
        });
      });
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

  const deleteCategory = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
          Back to Tasks
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-100" },
            { label: "To Do", value: stats.todo, color: "bg-blue-100" },
            {
              label: "In Progress",
              value: stats.inProgress,
              color: "bg-yellow-100",
            },
            { label: "Done", value: stats.done, color: "bg-green-100" },
            { label: "Overdue", value: stats.overdue, color: "bg-red-100" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-lg ${s.color} p-4 text-center`}
            >
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCategoryColor(c)}
                className={`h-9 w-9 rounded-full border-2 ${newCategoryColor === c ? "border-gray-900" : "border-transparent"}`}
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
              className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3"
            >
              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`h-6 w-6 rounded-full border-2 ${editColor === c ? "border-gray-900" : "border-transparent"}`}
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
                    className="text-sm text-gray-500 hover:text-gray-400"
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
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
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
            <p className="text-sm text-gray-500">No categories yet.</p>
          )}
        </ul>
      </div>

      {/* Default Settings */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Default Task Settings
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
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
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
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
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
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
    </div>
  );
}
