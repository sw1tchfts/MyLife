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
  category: string;
  force: string;
  mechanic: string;
  instructions: string;
  tips: string;
}

/* ── Muscle group helpers ─────────────────────────── */

const MUSCLE_GROUPS = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
];

const EQUIPMENT_TYPES = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "band",
  "medicine ball",
  "exercise ball",
  "foam roll",
  "other",
];

const CATEGORIES = [
  "strength",
  "stretching",
  "plyometrics",
  "strongman",
  "powerlifting",
  "cardio",
];

const muscleColors: Record<string, string> = {
  chest: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  shoulders:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  triceps:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  biceps:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  forearms:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  lats: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "middle back": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "lower back":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  traps: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  quadriceps:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  hamstrings:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  glutes: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  calves:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  adductors:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  abductors: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  abdominals:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  neck: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400",
};

function MuscleGroupBadge({ group }: { group: string }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${muscleColors[group] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {group}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    strength: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    stretching:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    plyometrics:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    strongman: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    powerlifting:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    cardio: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  };
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${colors[category] || "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}
    >
      {category}
    </span>
  );
}

/* ── Exercises Tab ─────────────────────────────────── */

export default function ExercisesTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("chest");
  const [newEquipment, setNewEquipment] = useState("barbell");
  const [newCategory, setNewCategory] = useState("strength");

  const fetchExercises = useCallback(() => {
    const params = new URLSearchParams();
    if (filter) params.set("muscleGroup", filter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (search) params.set("search", search);
    fetch(`/api/gym/exercises?${params}`)
      .then((r) => r.json())
      .then(setExercises);
  }, [filter, categoryFilter, search]);

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
        category: newCategory,
      }),
    });
    setNewName("");
    setShowAdd(false);
    fetchExercises();
  };

  const seedExercises = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/gym/exercises/seed", { method: "POST" });
      const data = await res.json();
      if (data.imported > 0) {
        fetchExercises();
      }
    } finally {
      setSeeding(false);
    }
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
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
              {EQUIPMENT_TYPES.map((e) => (
                <option key={e} value={e}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
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
            Import ~870 exercises from the open-source exercise database
          </p>
          <button
            onClick={seedExercises}
            disabled={seeding}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {seeding ? "Importing..." : "Import Exercise Library"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={seedExercises}
              disabled={seeding}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
            >
              {seeding ? "Importing..." : "Import more from library"}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                onClick={() =>
                  setExpandedId(expandedId === ex.id ? null : ex.id)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ex.name}
                  </p>
                  <MuscleGroupBadge group={ex.muscleGroup} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <CategoryBadge category={ex.category} />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {ex.equipment}
                  </span>
                  {ex.mechanic && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      &middot; {ex.mechanic}
                    </span>
                  )}
                  {ex.force && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      &middot; {ex.force}
                    </span>
                  )}
                  {ex.difficulty !== "beginner" && (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      &middot; {ex.difficulty}
                    </span>
                  )}
                </div>
                {ex.secondaryMuscles && (
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    Also: {ex.secondaryMuscles}
                  </p>
                )}

                {/* Expanded details */}
                {expandedId === ex.id && ex.instructions && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Instructions
                    </p>
                    <div className="max-h-40 overflow-y-auto text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                      {ex.instructions.split("\n\n").map((step, i) => (
                        <p key={i} className="mb-1">
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
