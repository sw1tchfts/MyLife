"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────── */

interface Exercise {
  id: string;
  name: string;
  slug: string;
  muscleGroup: string;
  secondaryMuscles: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  tips: string;
}

interface RoutineExercise {
  id: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  sortOrder: number;
  notes: string;
  exercise: Exercise;
}

interface RoutineDay {
  id: string;
  name: string;
  dayOrder: number;
  exercises: RoutineExercise[];
}

interface Routine {
  id: string;
  name: string;
  description: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  days: RoutineDay[];
}

interface LogSet {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  unit: string;
  completed: boolean;
}

interface LogExercise {
  id: string;
  exercise: { id: string; name: string; muscleGroup: string };
  sets: LogSet[];
}

interface WorkoutLog {
  id: string;
  date: string;
  durationMinutes: number;
  notes: string;
  routine?: { id: string; name: string } | null;
  routineDay?: { id: string; name: string } | null;
  exercises: LogExercise[];
}

type Tab = "exercises" | "routines" | "log" | "history";

/* ── Page wrapper ──────────────────────────────────── */

export default function GymPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-gray-400">Loading...</p>}
    >
      <GymContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function GymContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "exercises";

  const setTab = (t: Tab) => router.push(`/gym?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "exercises", label: "Exercises" },
    { key: "routines", label: "Routines" },
    { key: "log", label: "Log Workout" },
    { key: "history", label: "History" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        Gym
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

      {tab === "exercises" && <ExercisesTab />}
      {tab === "routines" && <RoutinesTab />}
      {tab === "log" && <LogWorkoutTab />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}

/* ── Muscle group helpers ─────────────────────────── */

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "core",
  "cardio",
  "other",
];

function MuscleGroupBadge({ group }: { group: string }) {
  const colors: Record<string, string> = {
    chest: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    back: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    shoulders:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    biceps:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    triceps:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    legs: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    core: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    cardio: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${colors[group] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {group}
    </span>
  );
}

/* ── Exercises Tab ─────────────────────────────────── */

function ExercisesTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("chest");
  const [newEquipment, setNewEquipment] = useState("barbell");

  const fetchExercises = useCallback(() => {
    const params = new URLSearchParams();
    if (filter) params.set("muscleGroup", filter);
    if (search) params.set("search", search);
    fetch(`/api/gym/exercises?${params}`)
      .then((r) => r.json())
      .then(setExercises);
  }, [filter, search]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const addExercise = async () => {
    if (!newName.trim()) return;
    await fetch("/api/gym/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        muscleGroup: newMuscle,
        equipment: newEquipment,
      }),
    });
    setNewName("");
    setShowAdd(false);
    fetchExercises();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Exercise name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExercise()}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <select
              value={newMuscle}
              onChange={(e) => setNewMuscle(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {[
                "barbell",
                "dumbbell",
                "cable",
                "machine",
                "bodyweight",
                "kettlebell",
                "band",
                "other",
              ].map((e) => (
                <option key={e} value={e}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={addExercise}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">No exercises found</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Add exercises or seed the library from the database
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {ex.name}
                </p>
                <MuscleGroupBadge group={ex.muscleGroup} />
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {ex.equipment}
                {ex.difficulty !== "beginner" && ` · ${ex.difficulty}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Routines Tab ──────────────────────────────────── */

function RoutinesTab() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutines = useCallback(() => {
    fetch("/api/gym/routines")
      .then((r) => r.json())
      .then((data) => {
        setRoutines(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const deleteRoutine = async (id: string) => {
    await fetch(`/api/gym/routines/${id}`, { method: "DELETE" });
    fetchRoutines();
  };

  if (loading)
    return <p className="text-center text-gray-400">Loading routines...</p>;

  return (
    <div className="space-y-4">
      {routines.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">No routines yet</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Create a workout routine to get started
          </p>
        </div>
      ) : (
        routines.map((routine) => (
          <div
            key={routine.id}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {routine.name}
                </h3>
                {routine.description && (
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {routine.description}
                  </p>
                )}
                <div className="mt-1 flex gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <span className="capitalize">{routine.goal}</span>
                  <span>·</span>
                  <span className="capitalize">{routine.level}</span>
                  <span>·</span>
                  <span>{routine.daysPerWeek} days/week</span>
                </div>
              </div>
              <button
                onClick={() => deleteRoutine(routine.id)}
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

            {routine.days.length > 0 && (
              <div className="mt-3 space-y-2">
                {routine.days.map((day) => (
                  <div
                    key={day.id}
                    className="rounded-md border border-gray-100 p-2 dark:border-gray-700"
                  >
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {day.name}
                    </p>
                    {day.exercises.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {day.exercises.map((re) => (
                          <p
                            key={re.id}
                            className="text-xs text-gray-500 dark:text-gray-400"
                          >
                            {re.exercise.name} — {re.sets}×{re.repsMin}
                            {re.repsMax !== re.repsMin && `-${re.repsMax}`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ── Log Workout Tab ───────────────────────────────── */

function LogWorkoutTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logExercises, setLogExercises] = useState<
    {
      exerciseId: string;
      name: string;
      sets: { reps: number; weight: number }[];
    }[]
  >([]);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    fetch("/api/gym/exercises")
      .then((r) => r.json())
      .then(setExercises);
  }, []);

  const addExercise = () => {
    const ex = exercises.find((e) => e.id === selectedExercise);
    if (!ex) return;
    setLogExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        sets: [
          { reps: 0, weight: 0 },
          { reps: 0, weight: 0 },
          { reps: 0, weight: 0 },
        ],
      },
    ]);
    setSelectedExercise("");
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: "reps" | "weight",
    value: number,
  ) => {
    setLogExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  };

  const addSet = (exIdx: number) => {
    setLogExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] }
          : ex,
      ),
    );
  };

  const removeExercise = (exIdx: number) => {
    setLogExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const saveLog = async () => {
    if (logExercises.length === 0) return;
    setSaving(true);
    await fetch("/api/gym/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        durationMinutes: parseInt(duration) || 0,
        notes,
        exercises: logExercises.map((ex, i) => ({
          exerciseId: ex.exerciseId,
          sortOrder: i,
          sets: ex.sets.map((s, j) => ({
            setNumber: j + 1,
            reps: s.reps,
            weight: s.weight,
            completed: true,
          })),
        })),
      }),
    });
    setSaving(false);
    setSaved(true);
    setLogExercises([]);
    setDuration("");
    setNotes("");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      {saved && (
        <div className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Workout saved!
        </div>
      )}

      {/* Add exercise to log */}
      <div className="flex gap-2">
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">Select exercise to add...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.muscleGroup})
            </option>
          ))}
        </select>
        <button
          onClick={addExercise}
          disabled={!selectedExercise}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Exercise entries */}
      {logExercises.map((ex, exIdx) => (
        <div
          key={exIdx}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {ex.name}
            </p>
            <button
              onClick={() => removeExercise(exIdx)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Remove
            </button>
          </div>

          <div className="mt-2">
            <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-xs text-gray-400">
              <span>Set</span>
              <span>Weight</span>
              <span>Reps</span>
              <span />
            </div>
            {ex.sets.map((set, setIdx) => (
              <div
                key={setIdx}
                className="mb-1 grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
              >
                <span className="text-xs text-gray-400">{setIdx + 1}</span>
                <input
                  type="number"
                  value={set.weight || ""}
                  onChange={(e) =>
                    updateSet(
                      exIdx,
                      setIdx,
                      "weight",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="lbs"
                  className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="number"
                  value={set.reps || ""}
                  onChange={(e) =>
                    updateSet(
                      exIdx,
                      setIdx,
                      "reps",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="reps"
                  className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  onClick={() =>
                    setLogExercises((prev) =>
                      prev.map((e, i) =>
                        i === exIdx
                          ? {
                              ...e,
                              sets: e.sets.filter((_, j) => j !== setIdx),
                            }
                          : e,
                      ),
                    )
                  }
                  className="text-gray-300 hover:text-red-500 dark:text-gray-600"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addSet(exIdx)}
              className="mt-1 text-xs text-blue-600 hover:text-blue-500"
            >
              + Add set
            </button>
          </div>
        </div>
      ))}

      {/* Duration and notes */}
      {logExercises.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-400">
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1 w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <button
            onClick={saveLog}
            disabled={saving}
            className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Workout"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── History Tab ───────────────────────────────────── */

function HistoryTab() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    fetch("/api/gym/logs?limit=30")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const deleteLog = async (id: string) => {
    await fetch(`/api/gym/logs/${id}`, { method: "DELETE" });
    fetchLogs();
  };

  if (loading)
    return <p className="text-center text-gray-400">Loading history...</p>;

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">No workouts logged</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Log a workout to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const totalSets = log.exercises.reduce(
          (s, ex) => s + ex.sets.length,
          0,
        );
        const totalVolume = log.exercises.reduce(
          (s, ex) =>
            s + ex.sets.reduce((ss, set) => ss + set.reps * set.weight, 0),
          0,
        );

        return (
          <div
            key={log.id}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(log.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {log.routineDay && (
                    <span className="ml-2 font-normal text-gray-400">
                      — {log.routineDay.name}
                    </span>
                  )}
                </p>
                <div className="mt-0.5 flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                  {log.durationMinutes > 0 && (
                    <span>{log.durationMinutes} min</span>
                  )}
                  <span>{log.exercises.length} exercises</span>
                  <span>{totalSets} sets</span>
                  {totalVolume > 0 && (
                    <span>{totalVolume.toLocaleString()} lbs volume</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteLog(log.id)}
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

            <div className="mt-2 space-y-1">
              {log.exercises.map((ex) => (
                <div key={ex.id} className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {ex.exercise.name}
                  </span>
                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                    {ex.sets
                      .map(
                        (s) => `${s.weight > 0 ? s.weight + "×" : ""}${s.reps}`,
                      )
                      .join(", ")}
                  </span>
                </div>
              ))}
            </div>

            {log.notes && (
              <p className="mt-2 text-xs text-gray-400 italic dark:text-gray-500">
                {log.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
