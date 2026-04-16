"use client";

import { useEffect, useState } from "react";

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
    color: "text-danger-text",
    bg: "bg-danger-soft",
    desc: "Less than 2 weeks of data. Estimate based mostly on formula.",
  },
  medium: {
    label: "Medium",
    color: "text-amber-text",
    bg: "bg-amber-soft",
    desc: "2-4 weeks of data. Estimate becoming personalized.",
  },
  high: {
    label: "High",
    color: "text-success-text",
    bg: "bg-success-soft",
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
        <p className="text-muted">Loading daily log...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Failed to load tracker data.</p>
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
      <div className="mt-6 rounded-xl border border-info-soft bg-gradient-to-br from-info-soft/30 to-info-soft/20 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-info-text">
              Estimated Daily Burn (TDEE)
            </p>
            <p className="mt-1 text-4xl font-bold text-heading">
              {tdee.estimatedTDEE.toLocaleString()}{" "}
              <span className="text-lg font-normal text-muted">cal/day</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${conf.bg} ${conf.color}`}
              >
                {conf.label} Confidence
              </span>
              <span className="text-xs text-muted">{conf.desc}</span>
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
                    ? "text-danger-text"
                    : tdee.weeklyWeightChange < 0
                      ? "text-success-text"
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
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-heading">Weight Trend</h2>
          <p className="text-xs text-muted">Last 30 days</p>
          {weightEntries.length < 2 ? (
            <div className="mt-4 flex h-32 items-center justify-center text-sm text-faint">
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
                    style={{ stroke: "var(--color-info)" }}
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    opacity="0.5"
                  />
                )}
                {/* Weight line */}
                <polyline
                  fill="none"
                  style={{ stroke: "var(--color-accent)" }}
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
                    style={{ fill: "var(--color-accent)" }}
                  />
                ))}
              </svg>
              <div className="mt-1 flex justify-between text-[10px] text-faint">
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
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-heading">
            Calories vs Daily Burn
          </h2>
          <p className="text-xs text-muted">
            Last 30 days — bars = intake, line = TDEE
          </p>
          {calorieEntries.length < 2 ? (
            <div className="mt-4 flex h-32 items-center justify-center text-sm text-faint">
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
                  style={{ stroke: "var(--color-info)" }}
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
                      style={{
                        fill: over
                          ? "var(--color-danger)"
                          : "var(--color-accent-text)",
                      }}
                      opacity="0.7"
                    />
                  );
                })}
              </svg>
              <div className="mt-1 flex justify-between text-[10px] text-faint">
                <span>{calorieEntries[0]?.date}</span>
                <span className="text-info-text">
                  — TDEE: {tdee.estimatedTDEE.toLocaleString()} cal
                </span>
                <span>{calorieEntries[calorieEntries.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Today's Nutrition Summary */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-heading">
            Today&apos;s Nutrition
          </h2>
          {todayNutrition.calories === 0 ? (
            <p className="mt-2 text-sm text-faint">No meals logged today yet</p>
          ) : (
            <div className="mt-3 space-y-3">
              {/* Calorie progress bar */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Calories</span>
                  <span className="font-medium text-heading">
                    {Math.round(todayNutrition.calories)} /{" "}
                    {tdee.calorieTarget.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-elevated">
                  <div
                    className={`h-full rounded-full transition-all ${
                      todayNutrition.calories > tdee.calorieTarget
                        ? "bg-danger"
                        : "bg-info"
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
                  color="text-accent-text"
                />
                <MacroCard
                  label="Carbs"
                  grams={todayNutrition.carbs}
                  color="text-amber-text"
                />
                <MacroCard
                  label="Fat"
                  grams={todayNutrition.fat}
                  color="text-danger-text"
                />
              </div>
            </div>
          )}
        </div>

        {/* Today's Medications */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-heading">
            Today&apos;s Medications
          </h2>
          {todayMedications.length === 0 ? (
            <p className="mt-2 text-sm text-faint">
              No medications taken today
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {todayMedications.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-body"
                >
                  <svg
                    className="h-4 w-4 text-success-text"
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
                    <span className="text-xs text-faint">({m.dosage})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Logging Status */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-heading">
            Tracking Status
          </h2>
          <div className="mt-3 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  hasLoggedToday
                    ? "bg-success-soft text-success-text"
                    : "bg-elevated text-faint"
                }`}
              >
                {hasLoggedToday ? "!" : "?"}
              </span>
              <span className="text-sm text-body">
                {hasLoggedToday
                  ? "Today's metrics logged"
                  : "Today's metrics not yet logged"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  todayNutrition.calories > 0
                    ? "bg-success-soft text-success-text"
                    : "bg-elevated text-faint"
                }`}
              >
                {todayNutrition.calories > 0 ? "!" : "?"}
              </span>
              <span className="text-sm text-body">
                {todayNutrition.calories > 0
                  ? `${Math.round(todayNutrition.calories)} cal logged from meals`
                  : "No meals logged today"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-info-soft/30 text-xs font-bold text-info-text">
                {tdee.weeksOfData}
              </span>
              <span className="text-sm text-body">weeks of tracking data</span>
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
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`text-sm font-semibold ${color || "text-heading"}`}>
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
    <div className="rounded-md bg-elevated/50 p-2 text-center">
      <p className="text-[10px] text-muted">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{Math.round(grams)}g</p>
    </div>
  );
}
