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
  admin: "Admin",
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

const SECTION_HEADINGS = {
  // Tasks page
  taskStats: "Task Stats",

  // Admin page
  categories: "Categories",
  defaultTaskSettings: "Default Task Settings",
  dataExport: "Data Export",

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

const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
} as const;

const PRIORITY_LABELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

const TASK_TYPE_LABELS = {
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

const MOOD_OPTIONS = [
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
