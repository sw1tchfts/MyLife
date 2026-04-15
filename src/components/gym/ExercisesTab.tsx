"use client";

import { useEffect, useState, useCallback } from "react";
import {
  panel,
  inputSm,
  btnPrimary,
  emptyState,
  badgeSm,
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
    chest: "bg-danger-soft text-danger-text",
    back: "bg-accent-soft text-accent-text",
    shoulders: "bg-amber-soft text-amber-text",
    biceps: "bg-purple-soft text-purple-text",
    triceps: "bg-info-soft text-info-text",
    legs: "bg-success-soft text-success-text",
    core: "bg-warning-soft text-warning-text",
    cardio: "bg-purple-soft text-purple-text",
  };
  return (
    <span
      className={`${badgeSm} capitalize ${colors[group] || "bg-elevated text-body"}`}
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
          className={inputSm}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`rounded-md border border-input-border bg-card px-2 py-1.5 text-sm text-heading`}
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
          className={btnPrimary}
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className={`${panel} p-4`}>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Exercise name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExercise()}
              className="flex-1 rounded-md border border-input-border bg-card px-3 py-2 text-sm text-heading"
            />
            <select
              value={newMuscle}
              onChange={(e) => setNewMuscle(e.target.value)}
              className="rounded-md border border-input-border bg-card px-2 py-2 text-sm text-heading"
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
              className="rounded-md border border-input-border bg-card px-2 py-2 text-sm text-heading"
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
              className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className={emptyState}>
          <p className="text-muted">No exercises found</p>
          <p className="mt-1 text-sm text-faint">
            Add exercises or seed the library from the database
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-heading">
                  {ex.name}
                </p>
                <MuscleGroupBadge group={ex.muscleGroup} />
              </div>
              <p className="mt-1 text-xs text-faint">
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
