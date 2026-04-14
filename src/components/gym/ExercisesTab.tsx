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

export default function ExercisesTab() {
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
