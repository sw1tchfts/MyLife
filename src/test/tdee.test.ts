import { describe, it, expect } from "vitest";
import {
  calculateBMR,
  calculateSeedTDEE,
  smoothWeights,
  calculateAdaptiveTDEE,
  buildDailyEntries,
  type DailyEntry,
  type TrackerProfile,
  type TrackerGoal,
} from "@/lib/tdee";

const PROFILE: TrackerProfile = {
  height: 70, // 5'10"
  heightUnit: "in",
  age: 30,
  sex: "male",
};

const NO_GOAL: TrackerGoal = {
  goalWeight: null,
  goalBodyFat: null,
};

describe("calculateBMR", () => {
  it("calculates BMR for male using Mifflin-St Jeor", () => {
    const bmr = calculateBMR(PROFILE, 180);
    // 10 * 81.6 + 6.25 * 177.8 - 5 * 30 + 5 = 816 + 1111.25 - 150 + 5 = 1782.25
    expect(bmr).toBeCloseTo(1782.25, 0);
  });

  it("calculates BMR for female", () => {
    const femaleProfile: TrackerProfile = { ...PROFILE, sex: "female" };
    const bmr = calculateBMR(femaleProfile, 140);
    expect(bmr).toBeGreaterThan(1200);
    expect(bmr).toBeLessThan(1600);
  });

  it("returns null when profile is incomplete", () => {
    expect(calculateBMR({ ...PROFILE, height: null }, 180)).toBeNull();
    expect(calculateBMR({ ...PROFILE, age: null }, 180)).toBeNull();
    expect(calculateBMR({ ...PROFILE, sex: null }, 180)).toBeNull();
  });
});

describe("calculateSeedTDEE", () => {
  it("uses Mifflin-St Jeor with activity multiplier", () => {
    const tdee = calculateSeedTDEE(PROFILE, 180);
    // BMR ~1782 * 1.55 (moderate) = ~2762
    expect(tdee).toBeGreaterThan(2700);
    expect(tdee).toBeLessThan(2850);
  });

  it("falls back to weight * 13 when profile incomplete", () => {
    const incomplete: TrackerProfile = { ...PROFILE, sex: null };
    const tdee = calculateSeedTDEE(incomplete, 180);
    expect(tdee).toBe(2340); // 180 * 13
  });
});

describe("smoothWeights", () => {
  it("returns first weight unchanged", () => {
    const entries: DailyEntry[] = [
      { date: "2024-01-01", weight: 180, caloriesIn: null },
    ];
    const smoothed = smoothWeights(entries);
    expect(smoothed[0]).toBe(180);
  });

  it("applies EMA smoothing", () => {
    const entries: DailyEntry[] = [
      { date: "2024-01-01", weight: 180, caloriesIn: null },
      { date: "2024-01-02", weight: 182, caloriesIn: null },
    ];
    const smoothed = smoothWeights(entries);
    // EMA: 0.1 * 182 + 0.9 * 180 = 18.2 + 162 = 180.2
    expect(smoothed[1]).toBeCloseTo(180.2, 1);
  });

  it("carries forward on null days", () => {
    const entries: DailyEntry[] = [
      { date: "2024-01-01", weight: 180, caloriesIn: null },
      { date: "2024-01-02", weight: null, caloriesIn: null },
      { date: "2024-01-03", weight: null, caloriesIn: null },
    ];
    const smoothed = smoothWeights(entries);
    expect(smoothed[1]).toBe(180);
    expect(smoothed[2]).toBe(180);
  });
});

describe("calculateAdaptiveTDEE", () => {
  it("returns seed TDEE with no data", () => {
    const result = calculateAdaptiveTDEE([], PROFILE, NO_GOAL, "lbs");
    // No weight data, falls back to 2200 absolute fallback
    expect(result.estimatedTDEE).toBe(2200);
    expect(result.confidence).toBe("low");
    expect(result.weeksOfData).toBe(0);
  });

  it("calculates TDEE from weight + calorie data", () => {
    // Simulate 3 weeks: weight stable at 180, eating ~2500 cal/day
    const entries: DailyEntry[] = [];
    for (let w = 0; w < 3; w++) {
      for (let d = 0; d < 7; d++) {
        const dayNum = w * 7 + d;
        const date = new Date(2024, 0, 1 + dayNum);
        entries.push({
          date: date.toISOString().split("T")[0],
          weight: 180 + Math.random() * 0.5, // slight noise
          caloriesIn: 2500 + Math.random() * 100, // ~2500 cal
        });
      }
    }

    const result = calculateAdaptiveTDEE(entries, PROFILE, NO_GOAL, "lbs");

    // With stable weight and ~2500 cal intake, TDEE should be near 2500
    expect(result.estimatedTDEE).toBeGreaterThan(2200);
    expect(result.estimatedTDEE).toBeLessThan(2900);
    expect(result.confidence).toBe("medium"); // 3 weeks
    expect(result.weeksOfData).toBeGreaterThanOrEqual(2);
  });

  it("detects deficit when losing weight", () => {
    // Eating 2000 cal but losing 1 lb/week = TDEE should be ~2500
    const entries: DailyEntry[] = [];
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 7; d++) {
        const dayNum = w * 7 + d;
        const date = new Date(2024, 0, 1 + dayNum);
        entries.push({
          date: date.toISOString().split("T")[0],
          weight: 180 - dayNum * (1 / 7), // losing 1 lb/week
          caloriesIn: 2000,
        });
      }
    }

    const result = calculateAdaptiveTDEE(entries, PROFILE, NO_GOAL, "lbs");

    // TDEE = 2000 - (-1 * 3500/7) = 2000 + 500 = 2500
    expect(result.estimatedTDEE).toBeGreaterThan(2300);
    expect(result.estimatedTDEE).toBeLessThan(2700);
  });

  it("applies goal-based calorie target for cutting", () => {
    const cutGoal: TrackerGoal = { goalWeight: 170, goalBodyFat: 15 };
    const entries: DailyEntry[] = [
      { date: "2024-01-01", weight: 180, caloriesIn: 2500 },
    ];

    const result = calculateAdaptiveTDEE(entries, PROFILE, cutGoal, "lbs");

    // Goal is 170 lbs, current is 180 — should recommend a deficit
    expect(result.calorieTarget).toBeLessThan(result.estimatedTDEE);
  });

  it("handles kg units", () => {
    const kgProfile: TrackerProfile = {
      height: 178,
      heightUnit: "cm",
      age: 30,
      sex: "male",
    };
    const entries: DailyEntry[] = [
      { date: "2024-01-01", weight: 82, caloriesIn: 2500 },
    ];

    const result = calculateAdaptiveTDEE(entries, kgProfile, NO_GOAL, "kg");

    expect(result.weightUnit).toBe("kg");
    expect(result.estimatedTDEE).toBeGreaterThan(2000);
  });
});

describe("buildDailyEntries", () => {
  it("merges weights and nutrition logs by date", () => {
    const weights = [
      { date: new Date("2024-01-01"), value: 180 },
      { date: new Date("2024-01-02"), value: 179.5 },
    ];
    const logs = [
      { date: new Date("2024-01-01"), calories: 2000 },
      { date: new Date("2024-01-01"), calories: 500 }, // second meal
      { date: new Date("2024-01-02"), calories: 2500 },
    ];

    const entries = buildDailyEntries(weights, logs);

    expect(entries).toHaveLength(2);
    expect(entries[0].date).toBe("2024-01-01");
    expect(entries[0].weight).toBe(180);
    expect(entries[0].caloriesIn).toBe(2500); // aggregated
    expect(entries[1].caloriesIn).toBe(2500);
  });

  it("handles dates with only weight or only calories", () => {
    const weights = [{ date: new Date("2024-01-01"), value: 180 }];
    const logs = [{ date: new Date("2024-01-02"), calories: 2500 }];

    const entries = buildDailyEntries(weights, logs);

    expect(entries).toHaveLength(2);
    expect(entries[0].weight).toBe(180);
    expect(entries[0].caloriesIn).toBeNull();
    expect(entries[1].weight).toBeNull();
    expect(entries[1].caloriesIn).toBe(2500);
  });
});
