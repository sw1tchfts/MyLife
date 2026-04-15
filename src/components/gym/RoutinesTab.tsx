"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  panel,
  inputSm,
  btnPrimary,
  btnSecondary,
  btnSuccessXs,
  emptyState,
  deleteBtn,
  labelSm,
  pillInactive,
} from "@/lib/styles";

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
  const { showToast } = useToast();
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

  const deleteRoutine = (id: string) => {
    const deleted = routines.find((r) => r.id === id);
    if (!deleted) return;
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    showToast({
      message: `Deleted "${deleted.name}"`,
      onUndo: () => setRoutines((prev) => [...prev, deleted]),
      onExpire: () => {
        fetch(`/api/gym/routines/${id}`, { method: "DELETE" });
      },
    });
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
    return <p className="text-center text-muted">Loading routines...</p>;

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className={`inline-flex items-center shadow-sm ${btnPrimary}`}
          >
            + New Routine
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-accent bg-accent-soft p-4">
          <h3 className="mb-3 text-sm font-semibold text-heading">
            New Workout Routine
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelSm}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Push Pull Legs"
                className={`mt-1 ${inputSm}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelSm}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className={`mt-1 ${inputSm}`}
              />
            </div>
            <div>
              <label className={labelSm}>Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-1 w-full rounded-md border border-input-border bg-card px-3 py-1.5 text-sm text-heading"
              >
                <option value="hypertrophy">Hypertrophy</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
                <option value="general">General Fitness</option>
              </select>
            </div>
            <div>
              <label className={labelSm}>Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1 w-full rounded-md border border-input-border bg-card px-3 py-1.5 text-sm text-heading"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Days builder */}
          <div className="mt-4">
            <label className={labelSm}>Workout Days ({days.length})</label>
            <div className="mt-2 space-y-3">
              {days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className="rounded-md border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-heading">
                      {day.name}
                    </span>
                    <button
                      onClick={() => removeDay(dayIdx)}
                      className="text-xs text-faint hover:text-danger-text"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Weekday selector */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-faint">Day:</span>
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
                            ? "border-accent bg-accent text-white"
                            : `${pillInactive}`
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
                            className="flex items-center gap-2 rounded bg-elevated px-2 py-1 text-xs"
                          >
                            <span className="flex-1 text-body">
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
                              className="w-12 rounded border border-input-border bg-card px-1 py-0.5 text-center text-xs text-heading"
                              title="Sets"
                            />
                            <span className="text-faint">x</span>
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
                              className="w-12 rounded border border-input-border bg-card px-1 py-0.5 text-center text-xs text-heading"
                              title="Min reps"
                            />
                            <span className="text-faint">-</span>
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
                              className="w-12 rounded border border-input-border bg-card px-1 py-0.5 text-center text-xs text-heading"
                              title="Max reps"
                            />
                            <button
                              onClick={() =>
                                removeExerciseFromDay(dayIdx, exIdx)
                              }
                              className="text-faint hover:text-danger-text"
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
                      className="w-full rounded-md border border-input-border bg-card px-2 py-1 text-xs text-heading"
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
                className={`flex-1 ${inputSm}`}
              />
              <button
                onClick={addDay}
                disabled={!newDayName.trim()}
                className="rounded-md bg-elevated px-3 py-1.5 text-xs font-medium text-heading hover:bg-card disabled:opacity-50"
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
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRoutine}
              disabled={saving || !name.trim() || days.length === 0}
              className={btnPrimary}
            >
              {saving ? "Creating..." : "Create Routine"}
            </button>
          </div>
        </div>
      )}

      {routines.length === 0 && !showCreate ? (
        <div className={emptyState}>
          <p className="text-muted">No routines yet</p>
          <p className="mt-1 text-sm text-faint">
            Create a workout routine to get started
          </p>
        </div>
      ) : (
        routines.map((routine) => (
          <div key={routine.id} className={`${panel} p-4`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-heading">
                  {routine.name}
                </h3>
                {routine.description && (
                  <p className="mt-0.5 text-xs text-faint">
                    {routine.description}
                  </p>
                )}
                <div className="mt-1 flex gap-2 text-xs text-faint">
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
                  className={btnSuccessXs}
                >
                  Activate
                </button>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className={deleteBtn}
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
              <div className="mt-3 rounded-md border border-success bg-success-soft p-3">
                <p className="mb-2 text-xs font-medium text-body">
                  Assign each day to a weekday:
                </p>
                <div className="space-y-2">
                  {routine.days.map((day) => (
                    <div key={day.id} className="flex items-center gap-2">
                      <span className="w-24 text-xs font-medium text-body">
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
                                ? "border-success bg-success text-white"
                                : `${pillInactive}`
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
                  <label className="text-xs text-muted">Time:</label>
                  <input
                    type="time"
                    value={activateTime}
                    onChange={(e) => setActivateTime(e.target.value)}
                    className="rounded border border-input-border bg-card px-2 py-1 text-xs text-heading"
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setActivatingId(null)}
                    className="rounded-md border border-input-border px-2.5 py-1 text-xs font-medium text-body"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleActivate(routine)}
                    disabled={saving}
                    className={btnSuccessXs}
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
                    className="rounded-md border border-border p-2"
                  >
                    <p className="text-xs font-medium text-body">
                      {day.name}
                      {day.scheduledDay && (
                        <span className="ml-1.5 rounded bg-accent-soft px-1 py-0.5 text-[10px] font-medium text-accent-text">
                          {WEEKDAY_LABELS_GYM[day.scheduledDay]}
                        </span>
                      )}
                    </p>
                    {day.exercises.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {day.exercises.map((re) => (
                          <p key={re.id} className="text-xs text-muted">
                            {re.exercise.name} — {re.sets}x{re.repsMin}
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
