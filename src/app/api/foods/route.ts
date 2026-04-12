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

    const food = await prisma.foodItem.create({
      data: {
        name: body.name,
        brand: body.brand ?? "",
        servingSize: body.servingSize ?? 100,
        servingUnit: body.servingUnit ?? "g",
        calories: body.calories ?? 0,
        protein: body.protein ?? 0,
        carbs: body.carbs ?? 0,
        fat: body.fat ?? 0,
        fiber: body.fiber ?? 0,
        sugar: body.sugar ?? 0,
        sodium: body.sodium ?? 0,
        vitaminA: body.vitaminA ?? 0,
        vitaminC: body.vitaminC ?? 0,
        vitaminD: body.vitaminD ?? 0,
        calcium: body.calcium ?? 0,
        iron: body.iron ?? 0,
        potassium: body.potassium ?? 0,
        externalId: body.externalId ?? "",
        source: body.source ?? "",
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Failed to create food:", error);
    return NextResponse.json(
      { error: "Failed to create food" },
      { status: 500 },
    );
  }
}
