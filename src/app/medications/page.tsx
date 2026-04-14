"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface MedicationItem {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  concentration: string;
  dosage: string;
  halfLife: string;
  halfLifeHours: number | null;
  description: string;
}

interface SearchResult {
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  description: string;
  externalId: string;
  halfLife: string;
  halfLifeHours: number | null;
}

type Tab = "medications" | "schedule" | "pharmacokinetics";

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
    { key: "pharmacokinetics", label: "Pharmacokinetics" },
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
      {tab === "pharmacokinetics" && <PharmacokineticsTab />}
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
        halfLife: result.halfLife,
        halfLifeHours: result.halfLifeHours,
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
              <MedicationCard
                key={m.id}
                med={m}
                onUpdate={fetchMeds}
                onDelete={() => deleteMed(m.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Medication Card (expandable edit) ────────────── */

function MedicationCard({
  med,
  onUpdate,
  onDelete,
}: {
  med: MedicationItem;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: med.name,
    genericName: med.genericName,
    dosageForm: med.dosageForm,
    strength: med.strength,
    concentration: med.concentration,
    dosage: med.dosage,
    halfLife: med.halfLife,
    halfLifeHours: med.halfLifeHours,
    description: med.description,
  });

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/medications/${med.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        halfLifeHours: form.halfLifeHours || null,
      }),
    });
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  const field = (
    label: string,
    key: keyof typeof form,
    placeholder: string,
    opts?: { type?: string },
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {editing ? (
        <input
          type={opts?.type ?? "text"}
          value={form[key] ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [key]:
                opts?.type === "number"
                  ? e.target.value
                    ? parseFloat(e.target.value)
                    : null
                  : e.target.value,
            }))
          }
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      ) : (
        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
          {(form[key] as string | number | null) || (
            <span className="text-gray-300 dark:text-gray-600">--</span>
          )}
        </p>
      )}
    </div>
  );

  const detailPills = [
    med.dosageForm,
    med.strength,
    med.concentration,
    med.dosage,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {med.name}
          </p>
          {med.genericName && (
            <p className="text-xs text-gray-400">{med.genericName}</p>
          )}
          {detailPills.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {detailPills.join(" · ")}
            </p>
          )}
        </div>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-3 dark:border-gray-700">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field("Brand Name", "name", "Brand name")}
            {field("Generic Name", "genericName", "Generic name")}
            {field("Form", "dosageForm", "e.g. Tablet, Capsule, Injectable")}
            {field("Strength", "strength", "e.g. 500mg, 10mg/5mL")}
            {field("Concentration", "concentration", "e.g. 200mg/mL")}
            {field("Dosage", "dosage", "e.g. 1 tablet twice daily")}
            {field("Half-Life", "halfLife", "e.g. 8 hours, 3 days")}
            {field(
              "Half-Life (hours)",
              "halfLifeHours",
              "Numeric, for graphing",
              {
                type: "number",
              },
            )}
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mt-3 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Description
            </label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {form.description || (
                  <span className="text-gray-300 dark:text-gray-600">--</span>
                )}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setForm({
                      name: med.name,
                      genericName: med.genericName,
                      dosageForm: med.dosageForm,
                      strength: med.strength,
                      concentration: med.concentration,
                      dosage: med.dosage,
                      halfLife: med.halfLife,
                      halfLifeHours: med.halfLifeHours,
                      description: med.description,
                    });
                    setEditing(false);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={onDelete}
              className="ml-auto rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pharmacokinetics Tab ────────────────────────── */

function PharmacokineticsTab() {
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [doseAmountMg, setDoseAmountMg] = useState("100");
  const [intervalHours, setIntervalHours] = useState("24");
  const [durationDays, setDurationDays] = useState("7");
  const [unit, setUnit] = useState<"hours" | "days">("days");

  useEffect(() => {
    fetch("/api/medications")
      .then((r) => r.json())
      .then((data: MedicationItem[]) => setMeds(data));
  }, []);

  const selectedMed = meds.find((m) => m.id === selectedMedId);
  const halfLifeH = selectedMed?.halfLifeHours;
  const dose = parseFloat(doseAmountMg) || 0;
  const interval = parseFloat(intervalHours) || 24;
  const durationH = (parseFloat(durationDays) || 7) * 24;

  // Build concentration curve via superposition
  const points: { t: number; c: number }[] = [];
  if (halfLifeH && halfLifeH > 0 && dose > 0) {
    const ke = Math.LN2 / halfLifeH;
    const steps = 500;
    const dt = durationH / steps;
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      let c = 0;
      // Sum contribution of every dose administered before time t
      for (let doseTime = 0; doseTime <= t; doseTime += interval) {
        c += dose * Math.exp(-ke * (t - doseTime));
      }
      points.push({ t, c });
    }
  }

  const maxC = points.length > 0 ? Math.max(...points.map((p) => p.c)) : 0;
  const chartW = 700;
  const chartH = 260;
  const padL = 55;
  const padR = 20;
  const padT = 15;
  const padB = 35;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const toX = (t: number) => padL + (t / durationH) * plotW;
  const toY = (c: number) => padT + plotH - (maxC > 0 ? (c / maxC) * plotH : 0);

  const pathD =
    points.length > 0
      ? points
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"}${toX(p.t).toFixed(1)},${toY(p.c).toFixed(1)}`,
          )
          .join(" ")
      : "";

  // Y-axis ticks
  const yTicks = maxC > 0 ? [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxC) : [];
  // X-axis ticks (5-6 ticks)
  const xTickCount = 6;
  const xTicks = Array.from(
    { length: xTickCount + 1 },
    (_, i) => (durationH / xTickCount) * i,
  );

  const formatTime = (h: number) =>
    unit === "days" ? `${(h / 24).toFixed(1)}d` : `${h.toFixed(0)}h`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Visualize estimated blood concentration over time based on dosing
        schedule and half-life. This is a simplified one-compartment model for
        educational purposes only — not medical advice.
      </p>

      {/* Config */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Medication
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Select a medication...</option>
              {meds
                .filter((m) => m.halfLifeHours)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.halfLife ? ` (t½ ${m.halfLife})` : ""}
                  </option>
                ))}
            </select>
            {meds.filter((m) => m.halfLifeHours).length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No medications with half-life data. Edit a medication in the
                Medications tab and enter a half-life value.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Dose Amount (mg)
            </label>
            <input
              type="number"
              value={doseAmountMg}
              onChange={(e) => setDoseAmountMg(e.target.value)}
              min="0"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Dosing Interval (hours)
            </label>
            <input
              type="number"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value)}
              min="1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Duration (days)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              min="1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              X-Axis Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as "hours" | "days")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      {points.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Blood Concentration (mg)
          </h3>
          {selectedMed && (
            <p className="mb-3 text-xs text-gray-400">
              {selectedMed.name} — t½{" "}
              {selectedMed.halfLife || `${selectedMed.halfLifeHours}h`}
              {" · "}
              {dose}mg every {interval}h for {durationDays} days
            </p>
          )}
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="h-64 w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines + Y labels */}
            {yTicks.map((v, i) => (
              <g key={`y-${i}`}>
                <line
                  x1={padL}
                  x2={chartW - padR}
                  y1={toY(v)}
                  y2={toY(v)}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth={0.5}
                />
                <text
                  x={padL - 6}
                  y={toY(v) + 3}
                  textAnchor="end"
                  className="fill-gray-400 text-[9px]"
                >
                  {v < 10 ? v.toFixed(1) : v.toFixed(0)}
                </text>
              </g>
            ))}
            {/* X labels */}
            {xTicks.map((h, i) => (
              <text
                key={`x-${i}`}
                x={toX(h)}
                y={chartH - 5}
                textAnchor="middle"
                className="fill-gray-400 text-[9px]"
              >
                {formatTime(h)}
              </text>
            ))}
            {/* Axes */}
            <line
              x1={padL}
              x2={padL}
              y1={padT}
              y2={padT + plotH}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              strokeWidth={1}
            />
            <line
              x1={padL}
              x2={chartW - padR}
              y1={padT + plotH}
              y2={padT + plotH}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              strokeWidth={1}
            />
            {/* Curve */}
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
          </svg>
        </div>
      ) : selectedMedId ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            Enter a dose amount to see the concentration graph
          </p>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            Select a medication with half-life data to see the concentration
            graph
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Schedule Tab ─────────────────────────────────── */

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
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
          (
            t: ScheduleEntry & { isRecurringParent: boolean; taskType: string },
          ) => t.isRecurringParent && t.taskType === "MEDICATION",
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
                  No medications saved yet. Add medications in the Medications
                  tab first.
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
