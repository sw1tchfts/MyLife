/**
 * Centralized screen, tab, modal, and shared label constants.
 *
 * Every user-visible name in the app should be defined here so there's
 * one place to look up (or rename) what anything is called.
 */

/* ── Page / Screen Names ─────────────────────────────── */

export const SCREEN_NAMES = {
  tasks: "Tasks",
  diet: "Diet & Nutrition",
  gym: "Gym",
  medications: "Medications",
  journal: "Journal",
  rankings: "Pairwise Ranker",
  diagrams: "Diagram Creator",
  settings: "Settings",
} as const;

/* ── Sidebar Section Names ───────────────────────────── */

export const SIDEBAR_SECTIONS = {
  missionControl: "Mission Control",
  health: "Health",
  otherApplications: "Other Applications",
  manage: "Manage",
} as const;

/* ── Tab Labels ──────────────────────────────────────── */

export const TASK_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "tasks", label: "Tasks" },
  { key: "adhoc-config", label: "Ad-Hoc Config" },
  { key: "recurring-config", label: "Recurring Config" },
] as const;

export const DIET_TABS = [
  { key: "library", label: "Food Library" },
  { key: "diet", label: "Diet" },
] as const;

export const GYM_TABS = [
  { key: "exercises", label: "Exercises" },
  { key: "routines", label: "Routines" },
] as const;

export const MEDICATION_TABS = [
  { key: "medications", label: "Medications" },
  { key: "schedule", label: "Medication Schedule" },
] as const;

export const RANKING_TABS = [
  { key: "items", label: "Items" },
  { key: "compare", label: "Compare" },
  { key: "rankings", label: "Rankings" },
  { key: "stats", label: "Stats" },
] as const;

/* ── Modal / Panel Titles ────────────────────────────── */

export const MODAL_TITLES = {
  newTask: "New Task",
  editTask: "Edit Task",
  dailyLog: "Daily Log",
  newEntry: "New Entry",
  editEntry: "Edit Entry",
  newRecurringTask: "New Recurring Task",
  newMedSchedule: "New Medication Schedule",
  addMealToPlan: "Add Meal to Plan",
  newWorkoutRoutine: "New Workout Routine",
  manageRankingLists: "Manage Ranking Lists",
} as const;

/* ── Section Headings ────────────────────────────────── */

export const SECTION_HEADINGS = {
  // Tasks page
  taskStats: "Task Stats",

  // Settings page
  appearance: "Appearance",
  account: "Account",
  notifications: "Notifications",
  dailyTracker: "Daily Tracker",

  // Daily Log dashboard sections
  weightTrend: "Weight Trend",
  caloriesVsDailyBurn: "Calories vs Daily Burn",
  todaysNutrition: "Today's Nutrition",
  todaysMedications: "Today's Medications",
  trackingStatus: "Tracking Status",

  // Medications page sections
  searchMedications: "Search Medications (OpenFDA)",
  yourMedications: "Your Medications",

  // Diet page sections
  searchFoods: "Search USDA Food Database",
  yourFoodLibrary: "Your Food Library",
} as const;

/* ── Filter Labels ───────────────────────────────────── */

export const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
} as const;

export const PRIORITY_LABELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

export const TASK_TYPE_LABELS = {
  ALL: "All",
  TASK: "Tasks",
  MEAL: "Meals",
  MEDICATION: "Meds",
} as const;

/* ── Shared Label Maps ───────────────────────────────── */

export const WEEKDAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

/** Abbreviated weekday labels — used in compact UIs (pills, gym routines). */
export const WEEKDAY_LABELS_SHORT: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** Full weekday labels — used in spacious UIs (diet planner). */
export const WEEKDAY_LABELS_FULL: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

export const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

export const MOOD_OPTIONS = [
  { value: "GREAT", label: "Great", emoji: "\u{1f929}" },
  { value: "GOOD", label: "Good", emoji: "\u{1f60a}" },
  { value: "OKAY", label: "Okay", emoji: "\u{1f610}" },
  { value: "BAD", label: "Bad", emoji: "\u{1f61e}" },
  { value: "TERRIBLE", label: "Terrible", emoji: "\u{1f622}" },
] as const;

export const DIAGRAM_TYPE_LABELS: Record<string, string> = {
  FLOWCHART: "Flowchart",
  PROCESS: "Process Diagram",
  SWIMLANE: "Swim Lane",
  ER_DIAGRAM: "ER Diagram",
};

/* ── Reverse Lookup (dev inspector) ──────────────────── */

/**
 * Builds a map from display text → constant path(s) in this file.
 * Used by ScreenNameInspector to show where a label is defined.
 */
export function buildNameLookup(): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const add = (text: string, path: string) => {
    const arr = map.get(text) ?? [];
    arr.push(path);
    map.set(text, arr);
  };

  // Screen names
  for (const [k, v] of Object.entries(SCREEN_NAMES))
    add(v, `SCREEN_NAMES.${k}`);

  // Sidebar sections
  for (const [k, v] of Object.entries(SIDEBAR_SECTIONS))
    add(v, `SIDEBAR_SECTIONS.${k}`);

  // Tab arrays
  const tabSets = [
    ["TASK_TABS", TASK_TABS],
    ["DIET_TABS", DIET_TABS],
    ["GYM_TABS", GYM_TABS],
    ["MEDICATION_TABS", MEDICATION_TABS],
    ["RANKING_TABS", RANKING_TABS],
  ] as const;
  for (const [name, tabs] of tabSets) {
    for (const t of tabs) add(t.label, `${name} → ${t.key}`);
  }

  // Modal titles
  for (const [k, v] of Object.entries(MODAL_TITLES))
    add(v, `MODAL_TITLES.${k}`);

  // Section headings
  for (const [k, v] of Object.entries(SECTION_HEADINGS))
    add(v, `SECTION_HEADINGS.${k}`);

  // Filter labels
  for (const [k, v] of Object.entries(STATUS_LABELS))
    add(v, `STATUS_LABELS.${k}`);
  for (const [k, v] of Object.entries(PRIORITY_LABELS))
    add(v, `PRIORITY_LABELS.${k}`);
  for (const [k, v] of Object.entries(TASK_TYPE_LABELS))
    add(v, `TASK_TYPE_LABELS.${k}`);

  // Shared label maps
  for (const [k, v] of Object.entries(WEEKDAY_LABELS_SHORT))
    add(v, `WEEKDAY_LABELS_SHORT.${k}`);
  for (const [k, v] of Object.entries(WEEKDAY_LABELS_FULL))
    add(v, `WEEKDAY_LABELS_FULL.${k}`);
  for (const [k, v] of Object.entries(MEAL_LABELS)) add(v, `MEAL_LABELS.${k}`);
  for (const m of MOOD_OPTIONS) add(m.label, `MOOD_OPTIONS → ${m.value}`);
  for (const [k, v] of Object.entries(DIAGRAM_TYPE_LABELS))
    add(v, `DIAGRAM_TYPE_LABELS.${k}`);

  return map;
}
