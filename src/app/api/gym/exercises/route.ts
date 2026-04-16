import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/gym/exercises — list all exercises, optionally filter by muscleGroup
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const muscleGroup = searchParams.get("muscleGroup");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (muscleGroup) where.muscleGroup = muscleGroup;
    if (category) where.category = category;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Failed to fetch exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 },
    );
  }
}

// POST /api/gym/exercises — create a custom exercise
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = body.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const exercise = await prisma.exercise.create({
      data: {
        name: body.name.trim(),
        slug,
        muscleGroup: body.muscleGroup || "other",
        secondaryMuscles: body.secondaryMuscles || "",
        equipment: body.equipment || "bodyweight",
        difficulty: body.difficulty || "beginner",
        category: body.category || "strength",
        force: body.force || "",
        mechanic: body.mechanic || "",
        instructions: body.instructions || "",
        tips: body.tips || "",
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Failed to create exercise:", error);
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 },
    );
  }
}
