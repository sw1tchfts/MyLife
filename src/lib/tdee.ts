/**
 * Adaptive TDEE (Total Daily Energy Expenditure) calculator.
 *
 * Hybrid algorithm inspired by:
 * - nSuns TDEE 3.0 spreadsheet (weekly averaging + rolling TDEE smoothing)
 * - MacroFactor V3 (EMA weight smoothing, composition-adjusted energy constants)
 *
 * Core equation:  TDEE = Calories In - (Change in Stored Energy)
 * Exercise is implicitly captured via actual weight change.
 */

// ── Types ────────────────────────────────────────────────

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  weight: number | null; // scale weight in user's unit
  caloriesIn: number | null; // total calories consumed
}

export interface TrackerProfile {
  height: number | null; // in user's unit
  heightUnit: "in" | "cm";
  age: number | null;
  sex: "male" | "female" | null;
}

export interface TrackerGoal {
  goalWeight: number | null; // in user's weight unit
  goalBodyFat: number | null; // percentage
}

export interface TDEEResult {
  estimatedTDEE: number; // calories/day
  trendWeight: number | null; // EMA-smoothed weight
  confidence: "low" | "medium" | "high";
  weeksOfData: number;
  calorieTarget: number; // based on goal
  weeklyWeightChange: number | null; // smoothed lbs/week
  dailySurplusDeficit: number | null; // positive = surplus
  weightUnit: "lbs" | "kg";
}

export interface WeekSummary {
  weekStart: string;
  avgWeight: number;
  avgCalories: number;
  weightChange: number;
  rawTDEE: number;
  smoothedTDEE: number;
}

// ── Constants ────────────────────────────────────────────

/**
 * Default activity multiplier for seed TDEE.
 * Uses moderate (1.55) since the adaptive algorithm will converge
 * to the real value within 3-4 weeks regardless of the starting point.
 */
const DEFAULT_ACTIVITY_MULTIPLIER = 1.55;

/** Calories per pound of body weight change. */
const CAL_PER_LB_FAT = 3500;
const CAL_PER_LB_MIXED = 3200; // blended fat+lean for moderate rates

/** EMA smoothing factor for daily weight (lower = smoother). */
const WEIGHT_EMA_ALPHA = 0.1;

/** Max weeks in the rolling TDEE average window. */
const ROLLING_WINDOW = 6;

// ── Mifflin-St Jeor seed ────────────────────────────────

export function calculateBMR(
  profile: TrackerProfile,
  weightLbs: number,
): number | null {
  if (!profile.height || !profile.age || !profile.sex) return null;

  // Convert to metric
  const weightKg = weightLbs * 0.453592;
  const heightCm =
    profile.heightUnit === "in" ? profile.height * 2.54 : profile.height;

  // Mifflin-St Jeor
  const bmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * profile.age +
    (profile.sex === "male" ? 5 : -161);

  return bmr;
}

export function calculateSeedTDEE(
  profile: TrackerProfile,
  weightLbs: number,
): number {
  const bmr = calculateBMR(profile, weightLbs);
  if (!bmr) {
    // Fallback: weight × 13 (nSuns heuristic)
    return Math.round(weightLbs * 13);
  }
  return Math.round(bmr * DEFAULT_ACTIVITY_MULTIPLIER);
}

// ── EMA weight smoothing ─────────────────────────────────

export function smoothWeights(entries: DailyEntry[]): (number | null)[] {
  const smoothed: (number | null)[] = [];
  let prev: number | null = null;

  for (const entry of entries) {
    if (entry.weight !== null) {
      if (prev === null) {
        prev = entry.weight;
      } else {
        prev = WEIGHT_EMA_ALPHA * entry.weight + (1 - WEIGHT_EMA_ALPHA) * prev;
      }
      smoothed.push(prev);
    } else {
      smoothed.push(prev); // carry forward
    }
  }

  return smoothed;
}

// ── Weekly aggregation ──────────���────────────────────────

interface Week {
  entries: DailyEntry[];
  smoothedWeights: (number | null)[];
}

function groupByWeek(
  entries: DailyEntry[],
  smoothedWeights: (number | null)[],
): Week[] {
  const weeks: Week[] = [];
  let current: Week = { entries: [], smoothedWeights: [] };

  for (let i = 0; i < entries.length; i++) {
    const d = new Date(entries[i].date);
    // Start a new week on Monday
    if (current.entries.length > 0) {
      const prevD = new Date(current.entries[current.entries.length - 1].date);
      const daysDiff = Math.round((d.getTime() - prevD.getTime()) / 86400000);
      if (d.getDay() === 1 && daysDiff >= 1 && current.entries.length >= 1) {
        weeks.push(current);
        current = { entries: [], smoothedWeights: [] };
      }
    }
    current.entries.push(entries[i]);
    current.smoothedWeights.push(smoothedWeights[i]);
  }
  if (current.entries.length > 0) weeks.push(current);

  return weeks;
}

function weekAvg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── Energy content adjustment ─────────────────────────────

/**
 * Adjust calories per pound based on rate of change.
 * Slower loss = more fat-dominant (~3500 cal/lb).
 * Faster gain = more lean mass mixed in (~2800 cal/lb).
 */
function caloriesPerLb(weeklyWeightChangeLbs: number): number {
  const absRate = Math.abs(weeklyWeightChangeLbs);
  if (absRate <= 0.5) return CAL_PER_LB_FAT; // slow change, mostly fat
  if (absRate >= 2.0) return 2800; // aggressive, significant lean mass
  // Linear interpolation between 3500 and 2800
  const t = (absRate - 0.5) / 1.5;
  return CAL_PER_LB_FAT - t * (CAL_PER_LB_FAT - 2800);
}

// ── Main TDEE calculation ────────────────────────────────

export function calculateAdaptiveTDEE(
  entries: DailyEntry[],
  profile: TrackerProfile,
  goal: TrackerGoal,
  weightUnit: "lbs" | "kg" = "lbs",
): TDEEResult {
  // Sort by date ascending
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Convert kg weights to lbs for internal calculation
  const internalEntries = sorted.map((e) => ({
    ...e,
    weight:
      e.weight !== null
        ? weightUnit === "kg"
          ? e.weight * 2.20462
          : e.weight
        : null,
  }));

  // Step 1: EMA smooth the weights
  const smoothed = smoothWeights(internalEntries);

  // Step 2: Group into weeks
  const weeks = groupByWeek(internalEntries, smoothed);

  // Get starting weight for seed TDEE
  const firstWeight = internalEntries.find((e) => e.weight !== null)?.weight;
  const seedTDEE = firstWeight ? calculateSeedTDEE(profile, firstWeight) : 2200; // absolute fallback

  if (weeks.length === 0) {
    const target = goalCalorieTarget(
      seedTDEE,
      goal,
      firstWeight ?? null,
      weightUnit,
    );
    return {
      estimatedTDEE: seedTDEE,
      trendWeight: firstWeight
        ? convertWeightBack(firstWeight, weightUnit)
        : null,
      confidence: "low",
      weeksOfData: 0,
      calorieTarget: target,
      weeklyWeightChange: null,
      dailySurplusDeficit: null,
      weightUnit,
    };
  }

  // Step 3: Calculate weekly TDEE estimates
  const weeklyTDEEs: number[] = [];
  const weekSummaries: WeekSummary[] = [];
  let prevAvgSmoothedWeight: number | null = null;

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const avgSmoothedWeight = weekAvg(week.smoothedWeights);
    const avgCalories = weekAvg(week.entries.map((e) => e.caloriesIn));

    if (avgSmoothedWeight === null || avgCalories === null) {
      // Not enough data this week, carry forward previous TDEE
      if (weeklyTDEEs.length > 0) {
        weeklyTDEEs.push(weeklyTDEEs[weeklyTDEEs.length - 1]);
      }
      prevAvgSmoothedWeight = avgSmoothedWeight ?? prevAvgSmoothedWeight;
      continue;
    }

    // Weight change this week
    const prevWeight = prevAvgSmoothedWeight ?? avgSmoothedWeight;
    const weightChange = avgSmoothedWeight - prevWeight;

    // Energy constant adjusted for rate
    const calPerLb = caloriesPerLb(weightChange);

    // Raw TDEE for this week
    const rawTDEE = avgCalories - (weightChange * calPerLb) / 7;

    // Rolling average: grow window from 1 to ROLLING_WINDOW
    const windowSize = Math.min(i + 1, ROLLING_WINDOW);
    const prevValues = weeklyTDEEs.slice(-(ROLLING_WINDOW - 1));
    const smoothedTDEE =
      (rawTDEE + prevValues.reduce((a, b) => a + b, 0)) / windowSize;

    // Round to nearest 5
    const finalTDEE = Math.round(smoothedTDEE / 5) * 5;
    weeklyTDEEs.push(finalTDEE);

    weekSummaries.push({
      weekStart: week.entries[0].date,
      avgWeight: avgSmoothedWeight,
      avgCalories,
      weightChange,
      rawTDEE: Math.round(rawTDEE),
      smoothedTDEE: finalTDEE,
    });

    prevAvgSmoothedWeight = avgSmoothedWeight;
  }

  // Step 4: Blend with seed estimate based on data amount
  const weeksOfData = weekSummaries.length;
  let blendedTDEE: number;

  if (weeklyTDEEs.length === 0) {
    blendedTDEE = seedTDEE;
  } else {
    const dataTDEE = weeklyTDEEs[weeklyTDEEs.length - 1];
    let dataWeight: number;
    if (weeksOfData <= 2) {
      dataWeight = 0.3;
    } else if (weeksOfData <= 4) {
      dataWeight = 0.6;
    } else {
      dataWeight = 0.9;
    }
    blendedTDEE = Math.round(
      dataTDEE * dataWeight + seedTDEE * (1 - dataWeight),
    );
    // Round to nearest 5
    blendedTDEE = Math.round(blendedTDEE / 5) * 5;
  }

  // Current trend weight (last smoothed value)
  const lastSmoothed = smoothed.filter((v) => v !== null).pop() ?? null;

  // Recent weekly weight change (from last week summary)
  const lastWeek =
    weekSummaries.length > 0 ? weekSummaries[weekSummaries.length - 1] : null;

  // Recent daily surplus/deficit
  const recentCalories = lastWeek?.avgCalories ?? null;
  const dailySurplus =
    recentCalories !== null ? Math.round(recentCalories - blendedTDEE) : null;

  // Confidence level
  let confidence: "low" | "medium" | "high";
  if (weeksOfData < 2) confidence = "low";
  else if (weeksOfData < 4) confidence = "medium";
  else confidence = "high";

  const target = goalCalorieTarget(blendedTDEE, goal, lastSmoothed, weightUnit);

  return {
    estimatedTDEE: blendedTDEE,
    trendWeight:
      lastSmoothed !== null
        ? convertWeightBack(lastSmoothed, weightUnit)
        : null,
    confidence,
    weeksOfData,
    calorieTarget: target,
    weeklyWeightChange: lastWeek
      ? convertWeightBack(lastWeek.weightChange, weightUnit)
      : null,
    dailySurplusDeficit: dailySurplus,
    weightUnit,
  };
}

// ── Goal-based calorie target ────────────────────────────

/**
 * Derive a calorie target from TDEE + goal weight.
 *
 * Logic: compare current trend weight to goal weight to determine direction
 * and a safe weekly rate. The further away you are, the more aggressive the
 * rate (capped at 1 lb/week for cuts, 0.5 lb/week for bulks).
 *
 * If no goal weight is set, returns TDEE (maintenance).
 */
function goalCalorieTarget(
  tdee: number,
  goal: TrackerGoal,
  currentWeightLbs: number | null,
  weightUnit: "lbs" | "kg",
): number {
  if (!goal.goalWeight || !currentWeightLbs) return tdee;

  // Convert goal weight to lbs for internal math
  const goalLbs =
    weightUnit === "kg" ? goal.goalWeight * 2.20462 : goal.goalWeight;

  const diff = currentWeightLbs - goalLbs; // positive = need to lose

  // Within 2 lbs of goal — maintain
  if (Math.abs(diff) < 2) return tdee;

  // Derive a weekly rate: scale with distance, cap at safe limits
  let weeklyRateLbs: number;
  if (diff > 0) {
    // Cutting: 0.5-1 lb/week depending on distance
    weeklyRateLbs = Math.min(1.0, Math.max(0.5, diff / 20));
  } else {
    // Bulking: 0.25-0.5 lb/week (more conservative)
    weeklyRateLbs = Math.min(0.5, Math.max(0.25, Math.abs(diff) / 30));
  }

  const dailyAdjustment = (weeklyRateLbs * CAL_PER_LB_MIXED) / 7;

  if (diff > 0) {
    return Math.round((tdee - dailyAdjustment) / 5) * 5;
  }
  return Math.round((tdee + dailyAdjustment) / 5) * 5;
}

// ── Helpers ──────��───────────────────────────────────────

function convertWeightBack(lbs: number, unit: "lbs" | "kg"): number {
  return unit === "kg"
    ? Math.round((lbs / 2.20462) * 10) / 10
    : Math.round(lbs * 10) / 10;
}

/**
 * Build DailyEntry array from BodyMetric weights and NutritionLog calories.
 * Merges by date for any date range.
 */
export function buildDailyEntries(
  weights: { date: Date | string; value: number }[],
  nutritionLogs: { date: Date | string; calories: number }[],
): DailyEntry[] {
  const map = new Map<string, { weight: number | null; calories: number }>();

  for (const w of weights) {
    const key = toDateKey(w.date);
    const existing = map.get(key) || { weight: null, calories: 0 };
    existing.weight = w.value;
    map.set(key, existing);
  }

  for (const n of nutritionLogs) {
    const key = toDateKey(n.date);
    const existing = map.get(key) || { weight: null, calories: 0 };
    existing.calories += n.calories;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([date, data]) => ({
      date,
      weight: data.weight,
      caloriesIn: data.calories > 0 ? data.calories : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}
