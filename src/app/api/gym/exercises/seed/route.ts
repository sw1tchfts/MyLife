import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const EXERCISE_DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

interface RawExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
}

function mapEquipment(raw: string | null): string {
  if (!raw) return "bodyweight";
  const map: Record<string, string> = {
    "body only": "bodyweight",
    kettlebells: "kettlebell",
    bands: "band",
    "e-z curl bar": "barbell",
    "foam roll": "foam roll",
    "medicine ball": "medicine ball",
    "exercise ball": "exercise ball",
  };
  return map[raw] || raw;
}

function makeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// POST /api/gym/exercises/seed — import exercises from free-exercise-db
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the exercise database
    const res = await fetch(EXERCISE_DB_URL);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch exercise database" },
        { status: 502 },
      );
    }
    const rawExercises: RawExercise[] = await res.json();

    // Get existing slugs to skip duplicates
    const existing = await prisma.exercise.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((e) => e.slug));

    // Build exercises to insert
    const toInsert = [];
    const seenSlugs = new Set<string>();

    for (const raw of rawExercises) {
      const slug = makeSlug(raw.name);
      if (existingSlugs.has(slug) || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      toInsert.push({
        name: raw.name,
        slug,
        muscleGroup: raw.primaryMuscles[0] || "other",
        secondaryMuscles: [
          ...raw.primaryMuscles.slice(1),
          ...raw.secondaryMuscles,
        ].join(", "),
        equipment: mapEquipment(raw.equipment),
        difficulty: raw.level || "beginner",
        category: raw.category || "strength",
        force: raw.force || "",
        mechanic: raw.mechanic || "",
        instructions: raw.instructions.join("\n\n"),
        tips: "",
      });
    }

    if (toInsert.length === 0) {
      return NextResponse.json({
        message: "No new exercises to import",
        imported: 0,
        total: existing.length,
      });
    }

    // Batch insert
    const result = await prisma.exercise.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Imported ${result.count} exercises`,
      imported: result.count,
      total: existing.length + result.count,
    });
  } catch (error) {
    console.error("Failed to seed exercises:", error);
    return NextResponse.json(
      { error: "Failed to seed exercises" },
      { status: 500 },
    );
  }
}
