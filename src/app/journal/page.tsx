"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

const MOODS = [
  { value: "GREAT", label: "Great", emoji: "\u{1f929}" },
  { value: "GOOD", label: "Good", emoji: "\u{1f60a}" },
  { value: "OKAY", label: "Okay", emoji: "\u{1f610}" },
  { value: "BAD", label: "Bad", emoji: "\u{1f61e}" },
  { value: "TERRIBLE", label: "Terrible", emoji: "\u{1f622}" },
] as const;

function moodEmoji(mood: string | null): string {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "";
}

function moodLabel(mood: string | null): string {
  return MOODS.find((m) => m.value === mood)?.label ?? "";
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Inline form state
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(() => {
    const params = new URLSearchParams();
    if (moodFilter) params.set("mood", moodFilter);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();

    fetch(`/api/journal${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }, [moodFilter, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setContent("");
    setMood(null);
    setTags("");
    setDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setTags(entry.tags.join(", "));
    setDate(new Date(entry.date).toISOString().slice(0, 10));
    setShowForm(true);
    setExpandedId(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);

    const body = {
      title: title.trim(),
      content: content.trim(),
      mood: mood || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      date: new Date(date + "T12:00:00").toISOString(),
    };

    if (editId) {
      await fetch(`/api/journal/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    resetForm();
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const key = new Date(entry.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Journal
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + New Entry
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {editId ? "Edit Entry" : "New Entry"}
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                    mood === m.value
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your day..."
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              autoFocus
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !content.trim()}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <div className="flex gap-1">
          <button
            onClick={() => setMoodFilter(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              !moodFilter
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            All
          </button>
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() =>
                setMoodFilter(moodFilter === m.value ? null : m.value)
              }
              title={m.label}
              className={`rounded-full px-2 py-1 text-sm transition-colors ${
                moodFilter === m.value
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      {loading ? (
        <p className="text-center text-gray-400">Loading entries...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No journal entries yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Click &quot;+ New Entry&quot; to write your first one
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([month, monthEntries]) => (
            <div key={month}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {month}
              </h3>
              <div className="space-y-2">
                {monthEntries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const dateStr = new Date(entry.date).toLocaleDateString(
                    "en-US",
                    { weekday: "short", month: "short", day: "numeric" },
                  );
                  const preview =
                    entry.content.length > 150
                      ? entry.content.slice(0, 150) + "..."
                      : entry.content;
                  const tagList = entry.tags ?? [];

                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : entry.id)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              {dateStr}
                            </span>
                            {entry.mood && (
                              <span title={moodLabel(entry.mood)}>
                                {moodEmoji(entry.mood)}
                              </span>
                            )}
                          </div>
                          {entry.title && (
                            <h4 className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                              {entry.title}
                            </h4>
                          )}
                          <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
                            {isExpanded ? entry.content : preview}
                          </p>
                          {tagList.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tagList.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="ml-3 flex gap-1">
                          <button
                            onClick={() => startEdit(entry)}
                            className="rounded p-1.5 text-gray-300 hover:text-blue-500 dark:text-gray-600 dark:hover:text-blue-400"
                            title="Edit"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="rounded p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
