"use client";

import { useEffect, useState, useCallback } from "react";

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
  scheduledDay: string | null;
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

/* ── Constants ────────────────────────────────────── */

const WEEKDAYS_GYM = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_LABELS_GYM: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/* ── Routines Tab ──────────────────────────────────── */

export default function RoutinesTab() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [dayAssignments, setDayAssignments] = useState<Record<string, string>>(
    {},
  );
  const [activateTime, setActivateTime] = useState("06:00");
  const [saving, setSaving] = useState(false);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("hypertrophy");
  const [level, setLevel] = useState("beginner");
  const [days, setDays] = useState<
    {
      name: string;
      scheduledDay: string;
      exercises: {
        exerciseId: string;
        sets: number;
        repsMin: number;
        repsMax: number;
      }[];
    }[]
  >([]);
  const [newDayName, setNewDayName] = useState("");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/gym/routines").then((r) => r.json()),
      fetch("/api/gym/exercises").then((r) => r.json()),
    ]).then(([routinesData, exercisesData]) => {
      setRoutines(routinesData);
      setExercises(exercisesData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteRoutine = async (id: string) => {
    await fetch(`/api/gym/routines/${id}`, { method: "DELETE" });
    fetchData();
  };

  const startActivation = (routine: Routine) => {
    setActivatingId(routine.id);
    // Pre-assign days from saved scheduledDay, fall back to sequential
    const defaults: Record<string, string> = {};
    routine.days.forEach((day, i) => {
      defaults[day.id] = day.scheduledDay || WEEKDAYS_GYM[i] || WEEKDAYS_GYM[0];
    });
    setDayAssignments(defaults);
  };

  const handleActivate = async (routine: Routine) => {
    setSaving(true);

    for (const day of routine.days) {
      const weekday = dayAssignments[day.id];
      if (!weekday) continue;

      const exerciseList = day.exercises
        .map(
          (re) =>
            `${re.exercise.name} ${re.sets}×${re.repsMin}${re.repsMax !== re.repsMin ? `-${re.repsMax}` : ""}`,
        )
        .join(", ");

      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${routine.name}: ${day.name}`,
          description: exerciseList,
          taskType: "TASK",
          recurrence: "WEEKLY",
          recurrenceDays: weekday,
          recurrenceTime: activateTime,
          isHabit: true,
        }),
      });
    }

    setSaving(false);
    setActivatingId(null);
    setDayAssignments({});
  };

  const addDay = () => {
    if (!newDayName.trim()) return;
    setDays((prev) => [
      ...prev,
      { name: newDayName.trim(), scheduledDay: "", exercises: [] },
    ]);
    setNewDayName("");
  };

  const removeDay = (idx: number) => {
    setDays((prev) => prev.filter((_, i) => i !== idx));
  };

  const addExerciseToDay = (dayIdx: number, exerciseId: string) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                { exerciseId, sets: 3, repsMin: 8, repsMax: 12 },
              ],
            }
          : d,
      ),
    );
  };

  const removeExerciseFromDay = (dayIdx: number, exIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
          : d,
      ),
    );
  };

  const updateExercise = (
    dayIdx: number,
    exIdx: number,
    field: "sets" | "repsMin" | "repsMax",
    value: number,
  ) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j === exIdx ? { ...ex, [field]: value } : ex,
              ),
            }
          : d,
      ),
    );
  };

  const handleCreateRoutine = async () => {
    if (!name.trim() || days.length === 0) return;
    setSaving(true);

    await fetch("/api/gym/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description,
        goal,
        level,
        daysPerWeek: days.length,
        days: days.map((d, i) => ({
          name: d.name,
          dayOrder: i,
          scheduledDay: d.scheduledDay || null,
          exercises: d.exercises.map((ex, j) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            repsMin: ex.repsMin,
            repsMax: ex.repsMax,
            sortOrder: j,
          })),
        })),
      }),
    });

    setName("");
    setDescription("");
    setGoal("hypertrophy");
    setLevel("beginner");
    setDays([]);
    setShowCreate(false);
    setSaving(false);
    fetchData();
  };

  if (loading)
    return <p className="text-center text-gray-400">Loading routines...</p>;

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + New Routine
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            New Workout Routine
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Push Pull Legs"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="hypertrophy">Hypertrophy</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
                <option value="general">General Fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Days builder */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Workout Days ({days.length})
            </label>
            <div className="mt-2 space-y-3">
              {days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {day.name}
                    </span>
                    <button
                      onClick={() => removeDay(dayIdx)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Weekday selector */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      Day:
                    </span>
                    {WEEKDAYS_GYM.map((wd) => (
                      <button
                        key={wd}
                        type="button"
                        onClick={() =>
                          setDays((prev) =>
                            prev.map((d, i) =>
                              i === dayIdx
                                ? {
                                    ...d,
                                    scheduledDay:
                                      d.scheduledDay === wd ? "" : wd,
                                  }
                                : d,
                            ),
                          )
                        }
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          day.scheduledDay === wd
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {WEEKDAY_LABELS_GYM[wd]}
                      </button>
                    ))}
                  </div>
                  {/* Exercises in this day */}
                  {day.exercises.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {day.exercises.map((ex, exIdx) => {
                        const exerciseInfo = exercises.find(
                          (e) => e.id === ex.exerciseId,
                        );
                        return (
                          <div
                            key={exIdx}
                            className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-xs dark:bg-gray-700"
                          >
                            <span className="flex-1 text-gray-700 dark:text-gray-300">
                              {exerciseInfo?.name || "Unknown"}
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={ex.sets}
                              onChange={(e) =>
                                updateExercise(
                                  dayIdx,
                                  exIdx,
                                  "sets",
                                  Number(e.target.value),
                                )
                              }
                              className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              title="Sets"
                            />
                            <span className="text-gray-400">×</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={ex.repsMin}
                              onChange={(e) =>
                                updateExercise(
                                  dayIdx,
                                  exIdx,
                                  "repsMin",
                                  Number(e.target.value),
                                )
                              }
                              className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              title="Min reps"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={ex.repsMax}
                              onChange={(e) =>
                                updateExercise(
                                  dayIdx,
                                  exIdx,
                                  "repsMax",
                                  Number(e.target.value),
                                )
                              }
                              className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              title="Max reps"
                            />
                            <button
                              onClick={() =>
                                removeExerciseFromDay(dayIdx, exIdx)
                              }
                              className="text-gray-400 hover:text-red-500"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Add exercise to day */}
                  <div className="mt-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addExerciseToDay(dayIdx, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      defaultValue=""
                    >
                      <option value="">+ Add exercise...</option>
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.muscleGroup})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            {/* Add day */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDay()}
                placeholder="Day name (e.g. Push Day)"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                onClick={addDay}
                disabled={!newDayName.trim()}
                className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-600"
              >
                Add Day
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCreate(false);
                setDays([]);
                setName("");
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRoutine}
              disabled={saving || !name.trim() || days.length === 0}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Routine"}
            </button>
          </div>
        </div>
      )}

      {routines.length === 0 && !showCreate ? (
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
              <div className="flex gap-1">
                <button
                  onClick={() => startActivation(routine)}
                  className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                >
                  Activate
                </button>
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
            </div>

            {/* Activation panel */}
            {activatingId === routine.id && (
              <div className="mt-3 rounded-md border border-green-200 bg-green-50/50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                  Assign each day to a weekday:
                </p>
                <div className="space-y-2">
                  {routine.days.map((day) => (
                    <div key={day.id} className="flex items-center gap-2">
                      <span className="w-24 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {day.name}
                      </span>
                      <div className="flex gap-1">
                        {WEEKDAYS_GYM.map((wd) => (
                          <button
                            key={wd}
                            onClick={() =>
                              setDayAssignments((prev) => ({
                                ...prev,
                                [day.id]: wd,
                              }))
                            }
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                              dayAssignments[day.id] === wd
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {WEEKDAY_LABELS_GYM[wd]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Time:
                  </label>
                  <input
                    type="time"
                    value={activateTime}
                    onChange={(e) => setActivateTime(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setActivatingId(null)}
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleActivate(routine)}
                    disabled={saving}
                    className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Creating tasks..." : "Create Recurring Tasks"}
                  </button>
                </div>
              </div>
            )}

            {routine.days.length > 0 && activatingId !== routine.id && (
              <div className="mt-3 space-y-2">
                {routine.days.map((day) => (
                  <div
                    key={day.id}
                    className="rounded-md border border-gray-100 p-2 dark:border-gray-700"
                  >
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {day.name}
                      {day.scheduledDay && (
                        <span className="ml-1.5 rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {WEEKDAY_LABELS_GYM[day.scheduledDay]}
                        </span>
                      )}
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
