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
      {tab === "schedule" && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a medication administration schedule. Your medications will
            appear as recurring tasks in the task list at the cadence you define.
          </p>
          <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              Coming soon — medication schedule builder
            </p>
          </div>
        </div>
      )}
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
