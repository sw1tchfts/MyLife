"use client";

import { useEffect, useState } from "react";
import { SECTION_HEADINGS } from "@/lib/screens";

interface TDEEData {
  estimatedTDEE: number;
  trendWeight: number | null;
  confidence: "low" | "medium" | "high";
  weeksOfData: number;
  calorieTarget: number;
  weeklyWeightChange: number | null;
  dailySurplusDeficit: number | null;
  weightUnit: string;
}

interface DailyEntry {
  date: string;
  weight: number | null;
  caloriesIn: number | null;
}

interface TrackerResponse {
  tdee: TDEEData;
  todayNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  todayMedications: { name: string; dosage: string }[];
  todayMetrics: { type: string; value: number; unit: string }[];
  dailyEntries: DailyEntry[];
}

const CONFIDENCE_CONFIG = {
  low: {
    label: "Low",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    desc: "Less than 2 weeks of data. Estimate based mostly on formula.",
  },
  medium: {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    desc: "2-4 weeks of data. Estimate becoming personalized.",
  },
  high: {
    label: "High",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    desc: "4+ weeks of data. Estimate driven by your real data.",
  },
};

export default function DailyLogSection() {
  const [data, setData] = useState<TrackerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tracker?days=90")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 dark:text-gray-500">Loading daily log...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Failed to load tracker data.</p>
      </div>
    );
  }

  const { tdee, todayNutrition, todayMedications, dailyEntries } = data;
  const conf = CONFIDENCE_CONFIG[tdee.confidence];

  // Build chart data: last 30 days of weight + calories
  const last30 = dailyEntries.slice(-30);
  const weightEntries = last30.filter((e) => e.weight !== null);
  const calorieEntries = last30.filter((e) => e.caloriesIn !== null);

  // Simple bar chart scale helpers
  const maxCal = Math.max(
    ...calorieEntries.map((e) => e.caloriesIn!),
    tdee.estimatedTDEE,
    1,
  );

  // Weight range for sparkline
  const weights = weightEntries.map((e) => e.weight!);
  const minW = weights.length > 0 ? Math.min(...weights) : 0;
  const maxW = weights.length > 0 ? Math.max(...weights) : 1;
  const weightRange = maxW - minW || 1;

  const hasLoggedToday = data.todayMetrics.length > 0;

  return (
    <div>
      {/* TDEE Hero Card */}
      <div className="mt-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-6 dark:border-teal-800 dark:from-teal-900/30 dark:to-cyan-900/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
              Estimated Daily Burn (TDEE)
            </p>
            <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">
              {tdee.estimatedTDEE.toLocaleString()}{" "}
              <span className="text-lg font-normal text-gray-500">cal/day</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${conf.bg} ${conf.color}`}
              >
                {conf.label} Confidence
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {conf.desc}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-right sm:grid-cols-4">
            <StatCard
              label="Trend Weight"
              value={
                tdee.trendWeight !== null
                  ? `${tdee.trendWeight} ${tdee.weightUnit}`
                  : "—"
              }
            />
            <StatCard
              label="Calorie Target"
              value={`${tdee.calorieTarget.toLocaleString()} cal`}
            />
            <StatCard
              label="Weekly Change"
              value={
                tdee.weeklyWeightChange !== null
                  ? `${tdee.weeklyWeightChange > 0 ? "+" : ""}${tdee.weeklyWeightChange} ${tdee.weightUnit}`
                  : "—"
              }
              color={
                tdee.weeklyWeightChange !== null
                  ? tdee.weeklyWeightChange > 0
                    ? "text-red-600 dark:text-red-400"
                    : tdee.weeklyWeightChange < 0
                      ? "text-green-600 dark:text-green-400"
                      : undefined
                  : undefined
              }
            />
            <StatCard
              label="Data"
              value={`${tdee.weeksOfData} week${tdee.weeksOfData !== 1 ? "s" : ""}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weight Trend Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {SECTION_HEADINGS.weightTrend}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last 30 days
          </p>
          {weightEntries.length < 2 ? (
            <div className="mt-4 flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Log at least 2 days of weight data to see your trend
            </div>
          ) : (
            <div className="mt-4">
              <svg
                viewBox={`0 0 ${weightEntries.length * 20} 120`}
                className="h-32 w-full"
              >
                {/* TDEE trend line reference */}
                {tdee.trendWeight !== null && (
                  <line
                    x1="0"
                    y1={110 - ((tdee.trendWeight - minW) / weightRange) * 100}
                    x2={weightEntries.length * 20}
                    y2={110 - ((tdee.trendWeight - minW) / weightRange) * 100}
                    stroke="#14b8a6"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    opacity="0.5"
                  />
                )}
                {/* Weight line */}
                <polyline
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  points={weightEntries
                    .map(
                      (e, i) =>
                        `${i * 20 + 10},${110 - ((e.weight! - minW) / weightRange) * 100}`,
                    )
                    .join(" ")}
                />
                {/* Dots */}
                {weightEntries.map((e, i) => (
                  <circle
                    key={i}
                    cx={i * 20 + 10}
                    cy={110 - ((e.weight! - minW) / weightRange) * 100}
                    r="3"
                    fill="#0ea5e9"
                  />
                ))}
              </svg>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>{weightEntries[0]?.date}</span>
                <span>
                  Range: {minW.toFixed(1)} – {maxW.toFixed(1)} {tdee.weightUnit}
                </span>
                <span>{weightEntries[weightEntries.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Calorie Intake vs TDEE */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {SECTION_HEADINGS.caloriesVsDailyBurn}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last 30 days — bars = intake, line = TDEE
          </p>
          {calorieEntries.length < 2 ? (
            <div className="mt-4 flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Log at least 2 days of calorie data to see the chart
            </div>
          ) : (
            <div className="mt-4">
              <svg
                viewBox={`0 0 ${calorieEntries.length * 16} 120`}
                className="h-32 w-full"
              >
                {/* TDEE reference line */}
                <line
                  x1="0"
                  y1={110 - (tdee.estimatedTDEE / maxCal) * 100}
                  x2={calorieEntries.length * 16}
                  y2={110 - (tdee.estimatedTDEE / maxCal) * 100}
                  stroke="#14b8a6"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* Calorie bars */}
                {calorieEntries.map((e, i) => {
                  const h = (e.caloriesIn! / maxCal) * 100;
                  const over = e.caloriesIn! > tdee.estimatedTDEE;
                  return (
                    <rect
                      key={i}
                      x={i * 16 + 2}
                      y={110 - h}
                      width="12"
                      height={h}
                      rx="2"
                      fill={over ? "#f87171" : "#60a5fa"}
                      opacity="0.7"
                    />
                  );
                })}
              </svg>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>{calorieEntries[0]?.date}</span>
                <span className="text-teal-600 dark:text-teal-400">
                  — TDEE: {tdee.estimatedTDEE.toLocaleString()} cal
                </span>
                <span>{calorieEntries[calorieEntries.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Today's Nutrition Summary */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {SECTION_HEADINGS.todaysNutrition}
          </h2>
          {todayNutrition.calories === 0 ? (
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              No meals logged today yet
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {/* Calorie progress bar */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Calories
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.round(todayNutrition.calories)} /{" "}
                    {tdee.calorieTarget.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      todayNutrition.calories > tdee.calorieTarget
                        ? "bg-red-500"
                        : "bg-teal-500"
                    }`}
                    style={{
                      width: `${Math.min((todayNutrition.calories / tdee.calorieTarget) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-3">
                <MacroCard
                  label="Protein"
                  grams={todayNutrition.protein}
                  color="text-blue-600 dark:text-blue-400"
                />
                <MacroCard
                  label="Carbs"
                  grams={todayNutrition.carbs}
                  color="text-amber-600 dark:text-amber-400"
                />
                <MacroCard
                  label="Fat"
                  grams={todayNutrition.fat}
                  color="text-red-600 dark:text-red-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Today's Medications */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {SECTION_HEADINGS.todaysMedications}
          </h2>
          {todayMedications.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              No medications taken today
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {todayMedications.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {m.name}
                  {m.dosage && (
                    <span className="text-xs text-gray-400">({m.dosage})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Logging Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {SECTION_HEADINGS.trackingStatus}
          </h2>
          <div className="mt-3 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  hasLoggedToday
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                }`}
              >
                {hasLoggedToday ? "!" : "?"}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {hasLoggedToday
                  ? "Today's metrics logged"
                  : "Today's metrics not yet logged"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  todayNutrition.calories > 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                }`}
              >
                {todayNutrition.calories > 0 ? "!" : "?"}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {todayNutrition.calories > 0
                  ? `${Math.round(todayNutrition.calories)} cal logged from meals`
                  : "No meals logged today"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                {tdee.weeksOfData}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                weeks of tracking data
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${color || "text-gray-900 dark:text-gray-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

function MacroCard({
  label,
  grams,
  color,
}: {
  label: string;
  grams: number;
  color: string;
}) {
  return (
    <div className="rounded-md bg-gray-50 p-2 text-center dark:bg-gray-700/50">
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{Math.round(grams)}g</p>
    </div>
  );
}
