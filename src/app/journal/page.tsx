"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────── */

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

type Tab = "entries" | "write" | "calendar";

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

/* ── Page wrapper ──────────────────────────────────── */

export default function JournalPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-gray-400">Loading...</p>}
    >
      <JournalContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function JournalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "entries";
  const editId = searchParams.get("edit");

  const setTab = (t: Tab) => router.push(`/journal?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "entries", label: "Entries" },
    { key: "write", label: "Write" },
    { key: "calendar", label: "Calendar" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Journal
      </h1>

      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "entries" && <EntriesTab />}
      {tab === "write" && (
        <WriteTab editId={editId} onSaved={() => setTab("entries")} />
      )}
      {tab === "calendar" && <CalendarTab />}
    </div>
  );
}

/* ── Write / Edit Tab ─────────────────────────────── */

function WriteTab({
  editId,
  onSaved,
}: {
  editId: string | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/journal/${editId}`)
      .then((r) => r.json())
      .then((entry: JournalEntry) => {
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood);
        setTags(entry.tags);
        setDate(new Date(entry.date).toISOString().slice(0, 10));
        setLoading(false);
      });
  }, [editId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);

    const body = {
      title: title.trim(),
      content: content.trim(),
      mood: mood || null,
      tags: tags.trim(),
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
    onSaved();
  };

  if (loading) {
    return <p className="text-center text-gray-400">Loading entry...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this entry a title..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Mood selector */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          How are you feeling?
        </label>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`flex flex-col items-center rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                mood === m.value
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Entry
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about your day..."
          rows={12}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags{" "}
          <span className="font-normal text-gray-400">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. work, personal, gratitude"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !content.trim()}
          className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : editId ? "Update Entry" : "Save Entry"}
        </button>
        {editId && (
          <button
            onClick={onSaved}
            className="rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Entries Tab ──────────────────────────────────── */

function EntriesTab() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const deleteEntry = async (id: string) => {
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const editEntry = (id: string) => {
    router.push(`/journal?tab=write&edit=${id}`);
  };

  // Group entries by month
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
    <div className="space-y-4">
      {/* Search & filter bar */}
      <div className="flex flex-wrap items-center gap-3">
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

      {/* Entries */}
      {loading ? (
        <p className="text-center text-gray-400">Loading entries...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            No journal entries yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Switch to the Write tab to create your first entry
          </p>
        </div>
      ) : (
        grouped.map(([month, monthEntries]) => (
          <div key={month}>
            <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">
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
                const tagList = entry.tags
                  ? entry.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Header */}
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
                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-line dark:text-gray-300">
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

                      {/* Actions */}
                      <div className="ml-3 flex gap-1">
                        <button
                          onClick={() => editEntry(entry.id)}
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
        ))
      )}
    </div>
  );
}

/* ── Calendar Tab ─────────────────────────────────── */

function CalendarTab() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    fetch(`/api/journal?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setEntries(data));
  }, [currentMonth]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Build map of date -> entries
  const byDay = new Map<number, JournalEntry[]>();
  for (const e of entries) {
    const day = new Date(e.date).getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          &larr; Prev
        </button>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {monthLabel}
        </h3>
        <button
          onClick={nextMonth}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Next &rarr;
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-gray-400 dark:text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[80px]" />;
          }

          const dayEntries = byDay.get(day) || [];
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`min-h-[80px] rounded-md border p-1.5 transition-colors ${
                isToday
                  ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20"
                  : "border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {day}
                </span>
                {dayEntries.length > 0 && dayEntries[0].mood && (
                  <span className="text-xs">
                    {moodEmoji(dayEntries[0].mood)}
                  </span>
                )}
              </div>
              {dayEntries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => router.push(`/journal?tab=write&edit=${e.id}`)}
                  className="mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-xs text-gray-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20"
                >
                  {e.title || e.content.slice(0, 30)}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          This Month
        </h4>
        <div className="mt-2 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {entries.length}
            </p>
            <p className="text-xs text-gray-400">Entries</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {byDay.size}
            </p>
            <p className="text-xs text-gray-400">Days Written</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {entries.filter((e) => e.mood).length > 0
                ? moodEmoji(
                    (() => {
                      const moodCounts = new Map<string, number>();
                      for (const e of entries) {
                        if (e.mood) {
                          moodCounts.set(
                            e.mood,
                            (moodCounts.get(e.mood) || 0) + 1,
                          );
                        }
                      }
                      let topMood = "";
                      let topCount = 0;
                      for (const [m, c] of moodCounts) {
                        if (c > topCount) {
                          topMood = m;
                          topCount = c;
                        }
                      }
                      return topMood;
                    })(),
                  )
                : "-"}
            </p>
            <p className="text-xs text-gray-400">Top Mood</p>
          </div>
        </div>
      </div>
    </div>
  );
}
