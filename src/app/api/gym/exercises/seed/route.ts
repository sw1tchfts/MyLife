import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { MUSCLES, EXERCISES } from "@/lib/gym-seed-data";

function makeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// POST /api/gym/exercises/seed — seed muscles and exercises from static data
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing data (order matters for FK constraints)
      await tx.exerciseMuscle.deleteMany();
      await tx.exercise.deleteMany(); // cascades to RoutineDayExercise, WorkoutLogExercise
      await tx.muscle.deleteMany();

      // 2. Insert parent muscles (those without parentName)
      const parentMuscles = MUSCLES.filter((m) => !m.parentName);
      await tx.muscle.createMany({
        data: parentMuscles.map((m) => ({ name: m.name, group: m.group })),
      });

      // 3. Look up parent IDs, then insert child muscles
      const parents = await tx.muscle.findMany();
      const parentMap = new Map(parents.map((p) => [p.name, p.id]));

      const childMuscles = MUSCLES.filter((m) => m.parentName);
      if (childMuscles.length > 0) {
        await tx.muscle.createMany({
          data: childMuscles.map((m) => ({
            name: m.name,
            group: m.group,
            parentId: parentMap.get(m.parentName!) ?? undefined,
          })),
        });
      }

      // 4. Build full muscle name → ID map
      const allMuscles = await tx.muscle.findMany();
      const muscleMap = new Map(allMuscles.map((m) => [m.name, m.id]));

      // 5. Insert exercises and their muscle relationships
      let exerciseCount = 0;
      let muscleRelCount = 0;
      const seenSlugs = new Set<string>();

      for (const ex of EXERCISES) {
        const slug = makeSlug(ex.name);
        if (seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        const exercise = await tx.exercise.create({
          data: {
            name: ex.name,
            slug,
            utility: ex.utility,
            mechanics: ex.mechanics,
            force: ex.force,
            equipment: ex.equipment,
          },
        });
        exerciseCount++;

        // Build muscle role entries
        const roleEntries: { muscleId: string; role: string }[] = [];

        const addRoles = (muscles: string[], role: string) => {
          for (const name of muscles) {
            const muscleId = muscleMap.get(name);
            if (muscleId) {
              roleEntries.push({ muscleId, role });
            }
          }
        };

        addRoles(ex.target, "target");
        addRoles(ex.synergists, "synergist");
        addRoles(ex.dynamicStabilizers, "dynamic_stabilizer");
        addRoles(ex.stabilizers, "stabilizer");
        addRoles(ex.antagonistStabilizers, "antagonist_stabilizer");

        if (roleEntries.length > 0) {
          // Deduplicate by [muscleId, role]
          const seen = new Set<string>();
          const unique = roleEntries.filter((e) => {
            const key = `${e.muscleId}:${e.role}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          await tx.exerciseMuscle.createMany({
            data: unique.map((e) => ({
              exerciseId: exercise.id,
              muscleId: e.muscleId,
              role: e.role,
            })),
          });
          muscleRelCount += unique.length;
        }
      }

      return {
        muscles: allMuscles.length,
        exercises: exerciseCount,
        muscleRelations: muscleRelCount,
      };
    });

    return NextResponse.json({
      message: `Seeded ${result.exercises} exercises, ${result.muscles} muscles, ${result.muscleRelations} muscle-exercise relations`,
      ...result,
    });
  } catch (error) {
    console.error("Failed to seed exercises:", error);
    return NextResponse.json(
      { error: "Failed to seed exercises" },
      { status: 500 },
    );
  }
}
