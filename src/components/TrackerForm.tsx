"use client";

import { useState, useEffect } from "react";

interface TrackerConfig {
  metrics: {
    weight: boolean;
    bodyFat: boolean;
    waist: boolean;
    chest: boolean;
    manualCalories: boolean;
  };
  units: {
    weight: "lbs" | "kg";
    measurements: "in" | "cm";
  };
}

interface TrackerData {
  tdee: {
    estimatedTDEE: number;
    trendWeight: number | null;
    confidence: "low" | "medium" | "high";
    weeksOfData: number;
    calorieTarget: number;
    weeklyWeightChange: number | null;
    dailySurplusDeficit: number | null;
    weightUnit: string;
  } | null;
  todayNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  todayMedications: { name: string; dosage: string }[];
  todayMetrics: { type: string; value: number; unit: string }[];
}

interface TrackerFormProps {
  taskId: string;
  taskStatus: string;
  onComplete: () => void;
}

const CONFIDENCE_LABELS = {
  low: { text: "Low", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
  medium: { text: "Medium", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  high: { text: "High", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
};

export default function TrackerForm({
  taskId,
  taskStatus,
  onComplete,
}: TrackerFormProps) {
  const [config, setConfig] = useState<TrackerConfig | null>(null);
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form values
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [manualCal, setManualCal] = useState("");

  const isDone = taskStatus === "DONE";

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/user").then((r) => r.json()),
      fetch("/api/tracker").then((r) => r.json()),
    ]).then(([settingsData, trackerData]) => {
      const tc = settingsData.trackerConfig || {
        metrics: {
          weight: true,
          bodyFat: true,
          waist: false,
          chest: false,
          manualCalories: false,
        },
        units: { weight: "lbs", measurements: "in" },
      };
      setConfig(tc);
      setData(trackerData);

      // Pre-fill with today's already-logged values
      if (trackerData.todayMetrics) {
        for (const m of trackerData.todayMetrics) {
          if (m.type === "WEIGHT") setWeight(String(m.value));
          if (m.type === "BODY_FAT") setBodyFat(String(m.value));
          if (m.type === "WAIST") setWaist(String(m.value));
          if (m.type === "CHEST") setChest(String(m.value));
        }
      }

      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    const metrics: { type: string; value: number; unit: string }[] = [];
    if (config.metrics.weight && weight) {
      metrics.push({ type: "WEIGHT", value: Number(weight), unit: config.units.weight });
    }
    if (config.metrics.bodyFat && bodyFat) {
      metrics.push({ type: "BODY_FAT", value: Number(bodyFat), unit: "%" });
    }
    if (config.metrics.waist && waist) {
      metrics.push({ type: "WAIST", value: Number(waist), unit: config.units.measurements });
    }
    if (config.metrics.chest && chest) {
      metrics.push({ type: "CHEST", value: Number(chest), unit: config.units.measurements });
    }

    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics,
        taskId,
        manualCalories: config.metrics.manualCalories && manualCal ? Number(manualCal) : undefined,
      }),
    });

    setSaving(false);
    onComplete();
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-8 w-full rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!config) return null;

  const tdee = data?.tdee;
  const nutrition = data?.todayNutrition;
  const conf = tdee ? CONFIDENCE_LABELS[tdee.confidence] : null;

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
            Tracker
          </span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Daily Log
          </h3>
          {isDone && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Logged
            </span>
          )}
        </div>
        {tdee && conf && (
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-gray-500 dark:text-gray-400">
                Daily Burn
              </span>
              <span className="ml-1.5 font-bold text-gray-900 dark:text-gray-100">
                {tdee.estimatedTDEE.toLocaleString()} cal
              </span>
            </div>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${conf.bg} ${conf.color}`}
            >
              {conf.text}
            </span>
          </div>
        )}
      </div>

      {/* TDEE summary strip */}
      {tdee && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          {tdee.trendWeight !== null && (
            <span>
              Trend:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {tdee.trendWeight} {tdee.weightUnit}
              </span>
            </span>
          )}
          {tdee.calorieTarget !== tdee.estimatedTDEE && (
            <span>
              Target:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {tdee.calorieTarget.toLocaleString()} cal
              </span>
            </span>
          )}
          {tdee.weeklyWeightChange !== null && (
            <span>
              Weekly:{" "}
              <span
                className={`font-medium ${tdee.weeklyWeightChange > 0 ? "text-red-600 dark:text-red-400" : tdee.weeklyWeightChange < 0 ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-200"}`}
              >
                {tdee.weeklyWeightChange > 0 ? "+" : ""}
                {tdee.weeklyWeightChange} {tdee.weightUnit}
              </span>
            </span>
          )}
          {tdee.dailySurplusDeficit !== null && (
            <span>
              Balance:{" "}
              <span
                className={`font-medium ${tdee.dailySurplusDeficit > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
              >
                {tdee.dailySurplusDeficit > 0 ? "+" : ""}
                {tdee.dailySurplusDeficit} cal
              </span>
            </span>
          )}
        </div>
      )}

      {/* Today's nutrition from meals (read-only) */}
      {nutrition && nutrition.calories > 0 && (
        <div className="mt-3 rounded-md bg-white/60 px-3 py-2 dark:bg-gray-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Today&apos;s Meals
          </p>
          <div className="mt-1 flex gap-4 text-xs">
            <span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {Math.round(nutrition.calories)}
              </span>{" "}
              cal
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              {Math.round(nutrition.protein)}g P
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {Math.round(nutrition.carbs)}g C
            </span>
            <span className="text-red-600 dark:text-red-400">
              {Math.round(nutrition.fat)}g F
            </span>
          </div>
        </div>
      )}

      {/* Input fields */}
      {!isDone && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {config.metrics.weight && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Weight ({config.units.weight})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="185.0"
                  className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
            {config.metrics.bodyFat && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="18.0"
                  className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
            {config.metrics.waist && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Waist ({config.units.measurements})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="34.0"
                  className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
            {config.metrics.chest && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Chest ({config.units.measurements})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder="42.0"
                  className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
            {config.metrics.manualCalories && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Calories In
                </label>
                <input
                  type="number"
                  value={manualCal}
                  onChange={(e) => setManualCal(e.target.value)}
                  placeholder="2500"
                  className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Log & Complete"}
            </button>
          </div>
        </div>
      )}

      {/* Today's medications (read-only) */}
      {data?.todayMedications && data.todayMedications.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Meds today:{" "}
          {data.todayMedications
            .map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ""}`)
            .join(", ")}
        </div>
      )}
    </div>
  );
}
