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

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const foods = await prisma.foodItem.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error("Failed to fetch foods:", error);
    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const food = await prisma.foodItem.create({
      data: {
        name: String(body.name),
        brand: String(body.brand ?? ""),
        servingSize: Number(body.servingSize) || 100,
        servingUnit: String(body.servingUnit ?? "g"),
        calories: Number(body.calories) || 0,
        protein: Number(body.protein) || 0,
        carbs: Number(body.carbs) || 0,
        fat: Number(body.fat) || 0,
        fiber: Number(body.fiber) || 0,
        sugar: Number(body.sugar) || 0,
        sodium: Number(body.sodium) || 0,
        vitaminA: Number(body.vitaminA) || 0,
        vitaminC: Number(body.vitaminC) || 0,
        vitaminD: Number(body.vitaminD) || 0,
        calcium: Number(body.calcium) || 0,
        iron: Number(body.iron) || 0,
        potassium: Number(body.potassium) || 0,
        externalId: String(body.externalId ?? ""),
        source: String(body.source ?? ""),
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to create food:", msg);
    return NextResponse.json(
      { error: "Failed to create food", detail: msg },
      { status: 500 },
    );
  }
}
