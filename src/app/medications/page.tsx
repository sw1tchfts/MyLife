"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface MedicationItem {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  description: string;
}

interface SearchResult {
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  description: string;
  externalId: string;
}

type Tab = "medications" | "schedule";

export default function MedicationsPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-gray-400">Loading...</p>}
    >
      <MedicationsContent />
    </Suspense>
  );
}

function MedicationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "medications";

  const setTab = (t: Tab) => router.push(`/medications?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "medications", label: "Medications" },
    { key: "schedule", label: "Medication Schedule" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Medications
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

      {tab === "medications" && <MedicationsTab />}
      {tab === "schedule" && <ScheduleTab />}
    </div>
  );
}

function MedicationsTab() {
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMeds = useCallback(() => {
    fetch("/api/medications")
      .then((r) => r.json())
      .then((data) => setMeds(data));
  }, []);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const search = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(
      `/api/medications/search?q=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();
    setSearchResults(data);
    setSearching(false);
  };

  const saveMed = async (result: SearchResult) => {
    setSaving(result.externalId);
    await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        genericName: result.genericName,
        dosageForm: result.dosageForm,
        strength: result.strength,
        description: result.description,
        externalId: result.externalId,
        source: "OpenFDA",
      }),
    });
    setSaving(null);
    fetchMeds();
  };

  const deleteMed = async (id: string) => {
    await fetch(`/api/medications/${id}`, { method: "DELETE" });
    fetchMeds();
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Search Medications (OpenFDA)
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search for a medication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={search}
            disabled={searching || !searchQuery.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {searchResults.length} results
            </p>
            {searchResults.map((r) => (
              <div
                key={r.externalId}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {r.name}
                  </p>
                  {r.genericName && (
                    <p className="text-xs text-gray-400">{r.genericName}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[r.dosageForm, r.strength].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => saveMed(r)}
                  disabled={saving === r.externalId}
                  className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {saving === r.externalId ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved medications */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Your Medications ({meds.length})
        </h3>
        {meds.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              No medications saved yet
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Search above to find and save medications
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {meds.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {m.name}
                  </p>
                  {m.genericName && (
                    <p className="text-xs text-gray-400">{m.genericName}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[m.dosageForm, m.strength].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => deleteMed(m.id)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Schedule Tab ─────────────────────────────────── */

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

interface ScheduleEntry {
  id: string;
  title: string;
  recurrence: string;
  recurrenceDays: string;
  recurrenceTime: string;
  taskMeds: { medicationItem: { name: string }; dosage: string }[];
}

function ScheduleTab() {
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("DAILY");
  const [days, setDays] = useState("");
  const [time, setTime] = useState("08:00");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/medications").then((r) => r.json()),
      fetch("/api/tasks?includeParents=true").then((r) => r.json()),
    ]).then(([medsData, tasksData]) => {
      setMeds(medsData);
      setSchedules(
        tasksData.filter(
          (t: ScheduleEntry & { isRecurringParent: boolean; taskType: string }) =>
            t.isRecurringParent && t.taskType === "MEDICATION",
        ),
      );
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!selectedMedId) return;
    setSaving(true);

    const med = meds.find((m) => m.id === selectedMedId);
    const title = `Take ${med?.name || "Medication"}${dosage ? ` (${dosage})` : ""}`;

    // Create recurring parent task
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        taskType: "MEDICATION",
        recurrence: frequency,
        recurrenceDays: days,
        recurrenceTime: time,
      }),
    });

    if (res.ok) {
      const task = await res.json();
      // Attach the medication to the parent task
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addMedication: {
            medicationItemId: selectedMedId,
            dosage,
          },
        }),
      });
    }

    setSelectedMedId("");
    setDosage("");
    setDays("");
    setTime("08:00");
    setShowForm(false);
    setSaving(false);
    fetchData();
  };

  const deleteSchedule = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) {
    return <p className="text-center text-gray-400">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up when you take each medication. Each schedule creates a
          recurring task in your task list.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Schedule
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            New Medication Schedule
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Medication
              </label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select a medication...</option>
                {meds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.strength ? ` (${m.strength})` : ""}
                  </option>
                ))}
              </select>
              {meds.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No medications saved yet. Add medications in the Medications tab first.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Dosage
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tablet"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value);
                  setDays("");
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="DAILY">Every day</option>
                <option value="WEEKLY">Specific days</option>
              </select>
            </div>
            {frequency === "WEEKLY" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Days
                </label>
                <div className="mt-1 flex gap-1">
                  {WEEKDAYS.map((day) => {
                    const active = days
                      .toLowerCase()
                      .split(",")
                      .map((d) => d.trim())
                      .includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const current = days
                            .toLowerCase()
                            .split(",")
                            .map((d) => d.trim())
                            .filter(Boolean);
                          const next = active
                            ? current.filter((d) => d !== day)
                            : [...current, day];
                          setDays(next.join(","));
                        }}
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {WEEKDAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !selectedMedId}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Schedule"}
            </button>
          </div>
        </div>
      )}

      {/* Existing schedules */}
      <div className="mt-4 space-y-2">
        {schedules.length === 0 && !showForm ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              No medication schedules yet
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Add a schedule to create recurring medication tasks
            </p>
          </div>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {s.recurrence === "DAILY"
                    ? "Every day"
                    : `Every ${s.recurrenceDays
                        .split(",")
                        .map((d) => WEEKDAY_LABELS[d.trim().toLowerCase()] || d)
                        .join(", ")}`}
                  {s.recurrenceTime ? ` at ${s.recurrenceTime}` : ""}
                </p>
              </div>
              <button
                onClick={() => deleteSchedule(s.id)}
                className="rounded p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                title="Delete schedule"
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
          ))
        )}
      </div>
    </div>
  );
}
